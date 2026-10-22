"""
notifications.py - Centralized Transactional Email Service for WellTrip.

Dispatches real, production-grade notifications via Hostinger SMTP.
Zero MockupData: All emails are real, typed, formatted in clean Thai,
and sent using django.core.mail.send_mail with proper exception handling.
"""
import logging
from decimal import Decimal
from typing import Optional

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_from_email() -> str:
    return getattr(settings, "DEFAULT_FROM_EMAIL", "welltripth@welltripthailand.com")


# ---------------------------------------------------------------------------
# 1. OTP Verification Email (Tourist & Merchant Registration / Password Reset)
# ---------------------------------------------------------------------------
def send_otp_email(to_email: str, otp_code: str, purpose: str = "MERCHANT_REGISTER", expires_minutes: int = 10) -> bool:
    """Send a 6-digit OTP verification email to user."""
    to_email = to_email.strip().lower()
    from_email = _get_from_email()

    purpose_titles = {
        "MERCHANT_REGISTER": "ลงทะเบียนเปิดร้านค้า WellTrip",
        "TOURIST_REGISTER": "สมัครสมาชิกนักท่องเที่ยว WellTrip",
        "PASSWORD_RESET": "รีเซ็ตรหัสผ่านบัญชี WellTrip",
    }
    title = purpose_titles.get(purpose, "ยืนยันตัวตน WellTrip")

    subject = f"[WellTrip] รหัสยืนยันตัวตน (OTP) สำหรับ{title}: {otp_code}"
    message = (
        f"เรียน ผู้ใช้งาน WellTrip,\n\n"
        f"รหัสยืนยันตัวตน (OTP) สำหรับ{title} ของท่านคือ:\n\n"
        f"        >>> {otp_code} <<<\n\n"
        f"รหัสนี้มีอายุการใช้งาน {expires_minutes} นาที\n"
        f"หากท่านไม่ได้เป็นผู้ทำรายการ โปรดเพิกเฉยต่ออีเมลฉบับนี้เพื่อความปลอดภัยของบัญชี\n\n"
        f"ขอแสดงความนับถือ,\n"
        f"ทีมงาน WellTrip Thailand\n"
        f"เว็บไซต์: https://welltripthailand.com\n"
        f"ติดต่อ: welltripth@welltripthailand.com"
    )

    try:
        send_mail(subject, message, from_email, [to_email], fail_silently=False)
        logger.info("Dispatched OTP email to %s for purpose %s", to_email, purpose)
        return True
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", to_email, str(exc))
        return False


# ---------------------------------------------------------------------------
# 2. Admin Alert: New Merchant Awaiting Review
# ---------------------------------------------------------------------------
def send_admin_new_merchant_alert(merchant_profile) -> bool:
    """Notify admins when a new merchant registers and awaits verification."""
    from_email = _get_from_email()
    admin_email = getattr(settings, "ADMIN_EMAIL", "promlikit@sskru.ac.th") or "promlikit@sskru.ac.th"
    admin_recipients = [admin_email.strip()]

    user = merchant_profile.user
    applicant_name = getattr(user, "full_name", "") or f"{user.first_name} {user.last_name}".strip() or "-"
    email = getattr(user, "email", "-") or "-"
    phone = getattr(merchant_profile, "phone_number", None) or getattr(user, "phone_number", "-") or "-"
    biz_name = getattr(merchant_profile, "business_name", "-") or "-"
    biz_type = (
        merchant_profile.get_business_category_display()
        if hasattr(merchant_profile, "get_business_category_display")
        else getattr(merchant_profile, "business_category", "-")
    )
    maps_url = getattr(merchant_profile, "google_maps_url", "-") or "-"
    hours = getattr(merchant_profile, "opening_hours", "-") or "-"

    created_time = (
        merchant_profile.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        if hasattr(merchant_profile, "created_at") and merchant_profile.created_at
        else timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    )

    subject = f"[WellTrip Admin Alert] มีผู้ประกอบการยื่นขอเปิดร้านใหม่: {biz_name}"
    message = (
        f"แจ้งเตือนทีมผู้ดูแลระบบ WellTrip,\n\n"
        f"มีผู้ประกอบการรายใหม่ลงทะเบียนขอเปิดร้านบนแพลตฟอร์ม WellTrip และรอการตรวจสอบ (PENDING):\n\n"
        f"รายละเอียดร้านค้าและผู้สมัคร:\n"
        f"- ชื่อสถานประกอบการ: {biz_name}\n"
        f"- หมวดหมู่ธุรกิจ: {biz_type}\n"
        f"- ผู้ยื่นคำขอ: {applicant_name}\n"
        f"- อีเมลติดต่อ: {email}\n"
        f"- เบอร์โทรศัพท์: {phone}\n"
        f"- เวลาทำการ: {hours}\n"
        f"- แผนที่ Google Maps: {maps_url}\n"
        f"- วันที่ยื่นคำขอ: {created_time}\n\n"
        f"ท่านสามารถเข้าตรวจสอบเอกสาร ข้อมูล และกดอนุมัติ (Approve) ได้ที่ Admin Console:\n"
        f"https://welltripthailand.com/admin/approvals\n\n"
        f"ระบบแจ้งเตือนอัตโนมัติ WellTrip Thailand"
    )

    try:
        send_mail(subject, message, from_email, admin_recipients, fail_silently=False)
        logger.info("Dispatched admin alert for merchant %s", merchant_profile.id)
        return True
    except Exception as exc:
        logger.error("Failed to send admin merchant alert: %s", str(exc))
        return False


# ---------------------------------------------------------------------------
# 3. Merchant Approval / Rejection Result
# ---------------------------------------------------------------------------
def send_merchant_decision_notification(merchant_profile, is_approved: bool, rejection_reason: str = "") -> bool:
    """Notify merchant of their application approval or rejection."""
    user = merchant_profile.user
    if not user or not user.email:
        return False

    from_email = _get_from_email()
    recipient = user.email
    recipient_name = user.full_name or merchant_profile.business_name

    if is_approved:
        subject = f"[WellTrip] ยินดีด้วย ร้านค้า {merchant_profile.business_name} ของคุณได้รับการอนุมัติแล้ว"
        message = (
            f"เรียน คุณ {recipient_name},\n\n"
            f"ทีมงาน WellTrip มีความยินดีที่จะแจ้งให้ทราบว่า บัญชีร้านค้า \"{merchant_profile.business_name}\" "
            f"ได้รับการตรวจสอบและอนุมัติ (Approved) เรียบร้อยแล้ว\n\n"
            f"ขณะนี้ ข้อมูลร้านค้า รายการห้องพัก อาหารเพื่อสุขภาพ สินค้า OTOP และบริการเวลเนสของคุณ "
            f"ได้เปิดแสดงสู่สายตานักท่องเที่ยวบนแพลตฟอร์ม WellTrip เรียบร้อยแล้ว\n\n"
            f"ท่านสามารถเข้าสู่ระบบเพื่อจัดการร้านค้า ตรวจสอบการจอง และอัปเดตข้อมูลได้ที่:\n"
            f"https://welltripthailand.com/portal\n\n"
            f"ขอขอบคุณที่ร่วมเป็นส่วนหนึ่งกับ WellTrip\n"
            f"ทีมงาน WellTrip Thailand"
        )
    else:
        reason = rejection_reason.strip() or "เอกสารหรือข้อมูลไม่ครบถ้วนสมบูรณ์"
        subject = f"[WellTrip] แจ้งผลการพิจารณาคำขอเปิดร้านค้า {merchant_profile.business_name}"
        message = (
            f"เรียน คุณ {recipient_name},\n\n"
            f"ทีมงาน WellTrip ได้ตรวจสอบคำขอเปิดร้านค้า \"{merchant_profile.business_name}\" เรียบร้อยแล้ว\n"
            f"สถานะ: ยังไม่ผ่านการอนุมัติ (Rejected)\n"
            f"เหตุผล: {reason}\n\n"
            f"ท่านสามารถเข้าสู่ระบบเพื่อแก้ไขหรืออัปเดตข้อมูลเพิ่มเติมได้ที่:\n"
            f"https://welltripthailand.com/portal\n\n"
            f"หากมีข้อสงสัยหรือต้องการความช่วยเหลือเพิ่มเติม สามารถติดต่อทีมงานได้ที่:\n"
            f"welltripth@welltripthailand.com\n\n"
            f"ทีมงาน WellTrip Thailand"
        )

    try:
        send_mail(subject, message, from_email, [recipient], fail_silently=False)
        logger.info("Dispatched decision notification to merchant %s (approved=%s)", recipient, is_approved)
        return True
    except Exception as exc:
        logger.error("Failed to send merchant decision email: %s", str(exc))
        return False


# ---------------------------------------------------------------------------
# 4. Payment Verified (EasySlip) & Booking Confirmed Notification
# ---------------------------------------------------------------------------
def send_payment_confirmed_notifications(payment) -> bool:
    """
    Notify both Tourist and Merchant when payment slip is verified successfully by EasySlip.
    """
    from_email = _get_from_email()
    booking = payment.booking
    if not booking:
        return False

    tourist = booking.user
    tourist_email = tourist.email if tourist else None

    # Format booking item details
    items_summary = []
    merchant_emails = set()

    for item in booking.items.all():
        item_name = item.title or "รายการบริการ/ห้องพัก"
        items_summary.append(f"- {item_name} (จำนวน: {item.quantity}, ราคา: {item.price_per_unit:,.2f} บาท)")
        # If item has an associated vendor/merchant owner email
        vendor_user = getattr(item, "vendor", None) or getattr(getattr(item, "accommodation", None), "owner", None)
        if vendor_user and hasattr(vendor_user, "email") and vendor_user.email:
            merchant_emails.add(vendor_user.email)

    items_text = "\n".join(items_summary) if items_summary else f"- รหัสการจอง: {booking.id}"

    # Email to Tourist
    if tourist_email:
        tourist_subject = f"[WellTrip] ยืนยันการชำระเงินและการจองสำเร็จ (รหัสการจอง: #{str(booking.id)[:8].upper()})"
        tourist_message = (
            f"เรียน คุณ {tourist.full_name or 'นักท่องเที่ยว'},\n\n"
            f"ระบบได้รับการชำระเงินและตรวจสอบสลิปโอนเงินผ่านระบบ EasySlip เรียบร้อยแล้ว\n"
            f"สถานะการจองของคุณ: ยืนยันแล้ว (CONFIRMED)\n\n"
            f"รายละเอียดการจอง:\n"
            f"- รหัสการจอง: {booking.id}\n"
            f"- วันที่ทำรายการ: {payment.paid_at.strftime('%Y-%m-%d %H:%M น.') if payment.paid_at else timezone.now().strftime('%Y-%m-%d %H:%M น.')}\n"
            f"- ยอดเงินที่ชำระ: {payment.amount:,.2f} บาท\n"
            f"- ช่องทาง: โอนเงินผ่านธนาคาร (ตรวจสอบผ่าน EasySlip)\n\n"
            f"รายการที่จอง:\n"
            f"{items_text}\n\n"
            f"คุณสามารถตรวจสอบข้อมูลการจองและแสดงตั๋ว/หลักฐานได้ที่:\n"
            f"https://welltripthailand.com/my-bookings/{booking.id}\n\n"
            f"ขอขอบคุณที่ร่วมเดินทางและสนับสนุนชุมชนศรีสะเกษกับ WellTrip\n"
            f"ทีมงาน WellTrip Thailand"
        )
        try:
            send_mail(tourist_subject, tourist_message, from_email, [tourist_email], fail_silently=False)
            logger.info("Dispatched payment confirmation email to tourist %s", tourist_email)
        except Exception as exc:
            logger.error("Failed to send tourist payment confirmation: %s", str(exc))

    # Email to Merchants
    for m_email in merchant_emails:
        m_subject = f"[WellTrip] มีคำสั่งซื้อและการชำระเงินใหม่ (รหัสการจอง: #{str(booking.id)[:8].upper()})"
        m_message = (
            f"เรียน ผู้ประกอบการ WellTrip,\n\n"
            f"มีนักท่องเที่ยวทำการจองและชำระเงินเรียบร้อยแล้ว (ตรวจสอบสลิปผ่าน EasySlip สำเร็จ):\n\n"
            f"รายละเอียด:\n"
            f"- รหัสการจอง: {booking.id}\n"
            f"- ยอดชำระ: {payment.amount:,.2f} บาท\n"
            f"- ลูกค้า: {tourist.full_name or tourist.email or 'นักท่องเที่ยว'}\n"
            f"- รายการ: \n{items_text}\n\n"
            f"ท่านสามารถเข้าดูรายละเอียดและเตรียมให้บริการได้ที่ Merchant Portal:\n"
            f"https://welltripthailand.com/portal\n\n"
            f"ทีมงาน WellTrip Thailand"
        )
        try:
            send_mail(m_subject, m_message, from_email, [m_email], fail_silently=True)
            logger.info("Dispatched merchant new order alert to %s", m_email)
        except Exception as exc:
            logger.warning("Failed to send merchant order alert: %s", str(exc))

    return True


# ---------------------------------------------------------------------------
# 5. Payment Slip Rejected Notification
# ---------------------------------------------------------------------------
def send_payment_rejected_notification(payment, rejection_reason: str) -> bool:
    """Notify tourist when uploaded slip failed EasySlip verification."""
    from_email = _get_from_email()
    booking = payment.booking
    if not booking or not booking.user or not booking.user.email:
        return False

    tourist_email = booking.user.email
    subject = f"[WellTrip] สลิปการชำระเงินไม่ผ่านการตรวจสอบ (รหัสการจอง: #{str(booking.id)[:8].upper()})"
    message = (
        f"เรียน คุณ {booking.user.full_name or 'นักท่องเที่ยว'},\n\n"
        f"ระบบได้ทำการตรวจสอบสลิปการโอนเงินสำหรับการจองรหัส #{str(booking.id)[:8].upper()} "
        f"ผ่านระบบตรวจสอบสลิปอัตโนมัติ EasySlip แล้วพบว่า:\n\n"
        f"สาเหตุ: {rejection_reason}\n\n"
        f"คำสั่งซื้อของท่านยังคงอยู่ในสถานะรอชำระเงิน (Pending Payment)\n"
        f"โปรดเข้าสู่ระบบเพื่อแนบสลิปที่ถูกต้องใหม่อีกครั้งได้ที่:\n"
        f"https://welltripthailand.com/checkout/payment/{payment.id}\n\n"
        f"หากมีข้อสงสัยหรือยอดเงินถูกหักไปแล้ว โปรดติดต่อทีมงานพร้อมแนบหลักฐานที่:\n"
        f"welltripth@welltripthailand.com\n\n"
        f"ทีมงาน WellTrip Thailand"
    )

    try:
        send_mail(subject, message, from_email, [tourist_email], fail_silently=False)
        logger.info("Dispatched slip rejected email to tourist %s", tourist_email)
        return True
    except Exception as exc:
        logger.error("Failed to send tourist slip rejection email: %s", str(exc))
        return False
