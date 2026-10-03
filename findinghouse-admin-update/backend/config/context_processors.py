"""Permission-aware dashboard data; only query business data on the admin index."""
import logging
from decimal import Decimal
from urllib.parse import urlsplit

from django.conf import settings
from django.contrib import admin
from django.db import DatabaseError
from django.db.models import Sum
from django.urls import reverse

from properties.models import Property
from crm.models import Lead, Deal, LeaseAgreement, ViewingAppointment
from audit.models import AuditLog

logger = logging.getLogger(__name__)


def admin_dashboard_stats(request):
    site_url = getattr(settings, 'FINDINGHOUSE_SITE_URL', '')
    parsed = urlsplit(site_url)
    context = {'findinghouse_site_url': site_url if parsed.scheme in {'http', 'https'} and parsed.netloc else ''}
    match = getattr(request, 'resolver_match', None)
    user = getattr(request, 'user', None)
    if not (match and match.namespace == admin.site.name and match.url_name == 'index'
            and user and user.is_active and user.is_staff):
        return context

    def permitted_queryset(model):
        model_admin = admin.site._registry.get(model)
        if model_admin is None or not model_admin.has_view_or_change_permission(request):
            return None
        queryset = model_admin.get_queryset(request)
        if any(field.name == 'is_deleted' for field in model._meta.fields):
            queryset = queryset.filter(is_deleted=False)
        return queryset

    cards, sections = [], []

    def card(label, value, money=False):
        cards.append({'label': label, 'value': value, 'money': money})

    def section(model, label, queryset, ordering, label_field, detail_field=None):
        opts = model._meta
        rows = []
        for obj in queryset.order_by(ordering)[:5]:
            # Honor object-level view hooks as well as the ModelAdmin queryset.
            if not admin.site._registry[model].has_view_or_change_permission(request, obj):
                continue
            display = getattr(obj, label_field)
            detail = getattr(obj, detail_field) if detail_field else ''
            rows.append({'label': display, 'detail': detail,
                         'url': reverse(f'admin:{opts.app_label}_{opts.model_name}_change', args=[obj.pk])})
        sections.append({'label': label, 'rows': rows,
                         'url': reverse(f'admin:{opts.app_label}_{opts.model_name}_changelist')})

    try:
        properties = permitted_queryset(Property)
        if properties is not None:
            card('ประกาศที่เผยแพร่', properties.filter(status='PUBLISHED').count())
            section(Property, 'ประกาศล่าสุด', properties, '-created_at', 'title', 'property_code')
        leads = permitted_queryset(Lead)
        if leads is not None:
            card('ลีดที่กำลังติดตาม', leads.exclude(status__in=['CLOSED_WON', 'CLOSED_LOST']).count())
            card('ลีดทั้งหมด', leads.count())
            section(Lead, 'ลีดล่าสุด', leads, '-created_at', 'name', 'phone')
        deals = permitted_queryset(Deal)
        if deals is not None:
            totals = deals.filter(stage='CLOSED_WON').aggregate(
                revenue=Sum('agreed_price'), commission=Sum('commission_amount'), company=Sum('company_share'))
            for key, label in [('revenue', 'ยอดขายปิดดีล'), ('commission', 'คอมมิชชันรวม'), ('company', 'ส่วนแบ่งบริษัท')]:
                card(label, totals[key] or Decimal('0'), money=True)
            section(Deal, 'ดีลล่าสุด', deals, '-updated_at', 'title', 'stage')
        leases = permitted_queryset(LeaseAgreement)
        if leases is not None:
            card('สัญญาใกล้หมด / หมดอายุ', leases.filter(status__in=['EXPIRING_SOON', 'EXPIRED']).count())
        appointments = permitted_queryset(ViewingAppointment)
        if appointments is not None:
            card('นัดเข้าชมทั้งหมด', appointments.count())
        logs = permitted_queryset(AuditLog)
        if logs is not None:
            section(AuditLog, 'กิจกรรมระบบล่าสุด', logs, '-timestamp', 'object_repr', 'action')
    except DatabaseError:
        logger.exception('Unable to load admin dashboard statistics')
        context['dashboard_unavailable'] = True
        return context
    context['dashboard_cards'] = cards
    context['dashboard_sections'] = sections
    return context
