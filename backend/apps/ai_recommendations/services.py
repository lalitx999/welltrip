"""Business logic for Dual-AI Wellness Recommendation Engine (DeepSeek + Gemini)."""
import json
import urllib.request
from decimal import Decimal
from django.conf import settings
from django.utils import timezone

from apps.accommodations.models import Accommodation
from apps.otop.models import OTOPProduct
from apps.services.models import FoodMenu, WellnessService, WellnessTimeSlot
from .models import AIRecommendationLog, HealthProfile


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    if height_cm <= 0:
        return 0.0
    height_m = height_cm / 100.0
    return round(weight_kg / (height_m * height_m), 2)


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> int:
    """Mifflin-St Jeor Formula."""
    if height_cm <= 0 or weight_kg <= 0 or age <= 0:
        return 1500
    if gender.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    return int(round(bmr))


def analyze_health_deepseek(profile_data: dict) -> str:
    """Stage 1: DeepSeek AI Engine - Health Rationale & Medical/Wellness Reasoning."""
    api_key = getattr(settings, "DEEPSEEK_API_KEY", "") or ""
    
    bmi = profile_data.get("bmi", 22.0)
    goal = profile_data.get("health_goal", "STRESS_RELIEF")
    diet = ", ".join(profile_data.get("dietary_restrictions", [])) or "ไม่มี"

    if api_key:
        try:
            prompt = (
                f"คุณคือผู้เชี่ยวชาญด้านสุขภาพและการท่องเที่ยวเชิงส่งเสริมสุขภาพ (Wellness Tourism)\n"
                f"ข้อมูลนักท่องเที่ยว: น้ำหนัก {profile_data.get('weight_kg')} kg, ส่วนสูง {profile_data.get('height_cm')} cm, "
                f"BMI {bmi}, BMR {profile_data.get('bmr')} kcal, เพศ {profile_data.get('gender')}, อายุ {profile_data.get('age')} ปี\n"
                f"เป้าหมายสุขภาพ: {goal}, ข้อจำกัดทางอาหาร: {diet}\n"
                f"โปรดวิเคราะห์สภาวะสุขภาพสั้นๆ และแนะนำความสนใจด้านการท่องเที่ยวชุมชนและกิจกรรมผ่อนคลายในอีสาน ห้ามวินิจฉัยโรคหรืออ้างผลการรักษา"
            )
            req_data = json.dumps({
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://api.deepseek.com/v1/chat/completions",
                data=req_data,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                content = res_json["choices"][0]["message"]["content"]
                return content
        except Exception:
            pass

    return "ขณะนี้ยังไม่สามารถสร้างคำแนะนำจาก AI ได้ รายการด้านล่างเป็นตัวเลือกจากแคตตาล็อกปัจจุบัน ไม่ใช่ผลวิเคราะห์สุขภาพเฉพาะบุคคล"


def recommend_package_gemini(health_analysis: str, profile_data: dict) -> dict:
    """Stage 2: Gemini AI Engine - Database Catalog Matching & Structured JSON Output."""
    # Catalog suggestions remain explicitly unpersonalized until matching is implemented.
    accommodations = Accommodation.objects.filter(status="ACTIVE").prefetch_related("rooms__images")[:3]
    foods = FoodMenu.objects.filter(is_available=True)[:2]
    wellness_services = WellnessService.objects.filter(is_active=True)[:2]
    otop_products = OTOPProduct.objects.filter(is_active=True, stock_quantity__gt=0)[:2]
    package_items = []
    total_price = Decimal("0.00")
    for accommodation in accommodations:
        rooms = [room for room in accommodation.rooms.all() if room.is_active]
        if not rooms:
            continue
        room = min(rooms, key=lambda row: row.base_price_per_night)
        images = list(room.images.all())
        package_items.append({
            "item_type": "ROOM_RESERVATION", "entity_id": str(room.id),
            "title": f"{accommodation.name} · {room.name}", "unit_price": str(room.base_price_per_night),
            "quantity": 1, "category_label": "ราคาเริ่มต้นต่อคืน · เลือกวันก่อนจอง",
            "image_url": images[0].image_url if images else "",
            "detail_url": f"/hotels/{accommodation.id}", "requires_selection": True,
        })
    for food in foods:
        total_price += food.price
        package_items.append({
            "item_type": "FOOD_ORDER", "entity_id": str(food.id), "title": food.name,
            "unit_price": str(food.price), "quantity": 1, "category_label": food.get_wellness_category_display(),
            "image_url": food.image_url, "detail_url": "/foods", "requires_selection": False,
        })
    for service in wellness_services:
        package_items.append({
            "item_type": "WELLNESS_SESSION", "entity_id": str(service.id), "title": service.title,
            "unit_price": str(service.price), "quantity": 1, "category_label": f"{service.duration_minutes} นาที · เลือกรอบก่อนจอง",
            "image_url": service.image_url, "detail_url": f"/wellness/{service.id}", "requires_selection": True,
        })
    for product in otop_products:
        total_price += product.price
        package_items.append({
            "item_type": "OTOP_GOODS", "entity_id": str(product.id), "title": product.name,
            "unit_price": str(product.price), "quantity": 1, "category_label": product.get_category_display(),
            "image_url": product.image_url, "detail_url": "/otop", "requires_selection": False,
        })
    return {
        "package_title": "ไอเดียสำหรับวันพักผ่อนของคุณ",
        "duration_label": "เลือกวันและกิจกรรมได้ตามต้องการ",
        "total_package_price": str(total_price),
        "items": package_items, "ai_providers": [],
        "disclaimer": "รายการจากแคตตาล็อกปัจจุบัน ยังไม่ได้จับคู่ตามข้อมูลสุขภาพ ไม่ใช่คำวินิจฉัยหรือการรักษา เลือกวันและรอบก่อนจองที่พักหรือกิจกรรม",
    }


def process_dual_ai_recommendation(user, input_data: dict) -> dict:
    weight = float(input_data["weight_kg"])
    height = float(input_data["height_cm"])
    age = int(input_data.get("age", 30))
    gender = str(input_data.get("gender", "other"))
    goal = str(input_data["health_goal"])
    lifestyle = str(input_data.get("lifestyle", ""))
    dietary = input_data.get("dietary_restrictions", [])

    bmi = calculate_bmi(weight, height)
    bmr = calculate_bmr(weight, height, age, gender)

    profile_dict = {
        "weight_kg": weight,
        "height_cm": height,
        "bmi": bmi,
        "bmr": bmr,
        "gender": gender,
        "age": age,
        "health_goal": goal,
        "lifestyle": lifestyle,
        "dietary_restrictions": dietary,
    }

    # Save or update profile in DB if user is logged in
    if user and user.is_authenticated:
        HealthProfile.objects.update_or_create(
            user=user,
            defaults=profile_dict,
        )

    # 1. DeepSeek Health Analysis
    health_analysis = analyze_health_deepseek(profile_dict)

    # 2. Gemini Package Matching
    package_result = recommend_package_gemini(health_analysis, profile_dict)

    # Log to DB
    AIRecommendationLog.objects.create(
        user=user if user and user.is_authenticated else None,
        input_snapshot=profile_dict,
        health_analysis=health_analysis,
        recommended_package=package_result,
    )

    return {
        "health_metrics": {
            "bmi": str(bmi),
            "bmr": bmr,
            "weight_kg": weight,
            "height_cm": height,
            "health_goal": goal,
        },
        "deepseek_analysis": health_analysis,
        "recommended_package": package_result,
    }
