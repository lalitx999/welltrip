"""Run using the isolated settings shipped in verification/ (no production DB)."""
from pathlib import Path
from unittest.mock import patch
import os

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission, AnonymousUser
from django.test import TestCase, RequestFactory, Client
from django.urls import reverse, resolve
from config.context_processors import admin_dashboard_stats
from properties.models import Category, Property, Location
from reviews.models import Article


class AdminThemeTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.superuser = get_user_model().objects.create_superuser('theme_admin', 'admin@example.invalid', 'test-password')
        cls.staff = get_user_model().objects.create_user('theme_staff', is_staff=True)
        cls.category = Category.objects.create(name='Theme category', slug='theme-category')
        location = Location.objects.create(name='Demo location', slug='demo-location')
        property_category = Category.objects.create(name='บ้านเดี่ยว', slug='house')
        cls.property = Property.objects.create(title='บ้านตัวอย่างสำหรับตรวจธีม', slug='demo-house', property_code='DEMO001', description='ข้อมูลทดสอบเท่านั้น', price=3500000, category=property_category, location=location, status='PUBLISHED')
        cls.article = Article.objects.create(title='Theme article', slug='theme-article', content='Test', is_published=False)

    def setUp(self):
        for target in ['crm.signals.send_line_notification', 'crm.signals.dispatch_webhook_event']:
            patcher = patch(target)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.client.force_login(self.superuser)

    def test_registered_model_pages_render(self):
        for model, model_admin in admin.site._registry.items():
            prefix = f'admin:{model._meta.app_label}_{model._meta.model_name}'
            with self.subTest(model=model._meta.label):
                self.assertEqual(self.client.get(reverse(prefix+'_changelist')).status_code, 200)
                request = RequestFactory().get('/admin/')
                request.user = self.superuser
                if model_admin.has_add_permission(request):
                    self.assertEqual(self.client.get(reverse(prefix+'_add')).status_code, 200)

    def test_changelist_restores_filters_and_actions(self):
        response = self.client.get(reverse('admin:properties_property_changelist'))
        for text in ['name="action"', 'export_as_excel', 'generate_banner_action', 'id="changelist-filter"', 'admin/js/actions.js']:
            self.assertContains(response, text)

    def test_form_media_and_validation(self):
        response = self.client.get(reverse('admin:properties_property_add'))
        for text in ['admin/js/inlines.js', 'admin/js/prepopulate.js', 'admin/js/change_form.js', 'TOTAL_FORMS']:
            self.assertContains(response, text)
        response = self.client.get(reverse('admin:crm_lead_add'))
        self.assertContains(response, 'admin/js/SelectFilter2.js')
        response = self.client.post(reverse('admin:properties_category_add'), {'name':'','slug':''})
        self.assertContains(response, 'errornote')

    def test_add_and_editable_list_save(self):
        response = self.client.post(reverse('admin:properties_category_add'), {'name':'Created by test','slug':'created-by-test','_save':'Save'})
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Category.objects.filter(slug='created-by-test').exists())
        response = self.client.post(reverse('admin:reviews_article_changelist'), {
            'form-TOTAL_FORMS':'1','form-INITIAL_FORMS':'1','form-MIN_NUM_FORMS':'0','form-MAX_NUM_FORMS':'1000',
            'form-0-id': str(self.article.pk), 'form-0-is_published':'on','_save':'Save'})
        self.assertEqual(response.status_code, 302)
        self.article.refresh_from_db()
        self.assertTrue(self.article.is_published)

    def test_permission_aware_dashboard(self):
        self.client.force_login(self.staff)
        response = self.client.get(reverse('admin:index'))
        self.assertNotContains(response, reverse('admin:crm_deal_changelist'))
        self.assertFalse(response.context['dashboard_cards'])
        self.staff.user_permissions.add(Permission.objects.get(codename='view_article'))
        response = self.client.get(reverse('admin:index'))
        self.assertContains(response, reverse('admin:reviews_article_changelist'))
        self.assertNotContains(response, reverse('admin:crm_deal_changelist'))
        self.assertEqual(self.client.get(reverse('admin:crm_deal_changelist')).status_code, 403)

    def test_dashboard_skips_queries_off_index(self):
        request = RequestFactory().get(reverse('admin:login'))
        request.resolver_match = resolve(request.path)
        request.user = AnonymousUser()
        with self.assertNumQueries(0):
            self.assertNotIn('dashboard_cards', admin_dashboard_stats(request))
        request = RequestFactory().get(reverse('admin:properties_category_changelist'))
        request.resolver_match = resolve(request.path)
        request.user = self.superuser
        with self.assertNumQueries(0):
            self.assertNotIn('dashboard_cards', admin_dashboard_stats(request))

    def test_dashboard_uses_admin_queryset(self):
        request = RequestFactory().get(reverse('admin:index'))
        request.resolver_match = resolve(request.path)
        request.user = self.superuser
        with patch.object(admin.site._registry[Property], 'get_queryset', return_value=Property.objects.none()) as query:
            context = admin_dashboard_stats(request)
            query.assert_called_once_with(request)
            card = next(c for c in context['dashboard_cards'] if c['label'] == 'ประกาศที่เผยแพร่')
            self.assertEqual(card['value'], 0)

    def test_delete_confirmation_and_history(self):
        url = reverse('admin:properties_category_delete', args=[self.category.pk])
        self.assertContains(self.client.get(url), 'name="post"')
        response = self.client.post(url, {'post':'yes'})
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Category.objects.filter(pk=self.category.pk).exists())
        self.assertEqual(self.client.get(reverse('admin:reviews_article_history', args=[self.article.pk])).status_code, 200)

    def test_login_logout_csrf_and_popup(self):
        client = Client(enforce_csrf_checks=True)
        response = client.get(reverse('admin:login'))
        self.assertContains(response, 'findinghouse_admin/theme.css')
        self.assertNotContains(response, 'id="vault-sidebar"')
        self.assertEqual(client.post(reverse('admin:login'), {'username':'theme_admin','password':'test-password'}).status_code, 403)
        client.force_login(self.superuser)
        self.assertEqual(client.post(reverse('admin:logout')).status_code, 403)
        response = client.get(reverse('admin:index'))
        token = client.cookies['csrftoken'].value
        self.assertEqual(client.post(reverse('admin:logout'), {'csrfmiddlewaretoken':token}).status_code, 200)
        response = self.client.get(reverse('admin:properties_category_add'), {'_popup':'1'})
        self.assertNotContains(response, 'id="vault-sidebar"')
        self.assertContains(response, 'name="_popup"')

    def test_export_preview(self):
        destination = os.environ.get('FH_PREVIEW_DIR')
        if not destination:
            return
        target = Path(destination)
        target.mkdir(parents=True, exist_ok=True)
        for name, url in [('index','admin:index'),('list','admin:properties_property_changelist'),('form','admin:properties_property_add'),('lead','admin:crm_lead_add')]:
            (target/(name+'.html')).write_bytes(self.client.get(reverse(url)).content)
        (target/'jsi18n.js').write_bytes(self.client.get(reverse('admin:jsi18n')).content)
        self.client.logout()
        (target/'login.html').write_bytes(self.client.get(reverse('admin:login')).content)

    def test_property_image_inline_submission(self):
        from io import BytesIO
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile
        image = BytesIO()
        Image.new('RGB', (64, 64), color='green').save(image, format='PNG')
        obj = self.property
        data = {
            'title':obj.title, 'slug':obj.slug, 'property_code':obj.property_code,
            'description':obj.description, 'price':'3500000.00', 'property_type':'SALE',
            'category':str(obj.category_id), 'location':str(obj.location_id),
            'source':'FINDING_HOUSE', 'sale_condition':'SALE_ONLY', 'status':'PUBLISHED',
            'landmarks':'[]', 'features':'{}', 'last_confirmed_at_0':'2026-09-15',
            'last_confirmed_at_1':'12:00:00',
            'images-TOTAL_FORMS':'1', 'images-INITIAL_FORMS':'0',
            'images-MIN_NUM_FORMS':'0', 'images-MAX_NUM_FORMS':'1000',
            'images-0-image':SimpleUploadedFile('theme.png', image.getvalue(), content_type='image/png'),
            'images-0-is_cover':'on', 'images-0-order':'0', '_save':'Save',
        }
        response = self.client.post(reverse('admin:properties_property_change', args=[obj.pk]), data)
        if response.status_code != 302:
            self.fail(str(response.context['adminform'].form.errors) + str([f.errors for f in response.context['inline_admin_formsets']]))
        self.assertEqual(obj.images.count(), 1)
        uploaded = obj.images.get().image
        self.addCleanup(uploaded.storage.delete, uploaded.name)

    def test_external_action_is_mocked(self):
        # Exercise the existing action dispatcher without contacting an AI service.
        with patch.object(type(admin.site._registry[Property]), 'generate_ai_seo_action', autospec=True) as action:
            response = self.client.post(reverse('admin:properties_property_changelist'), {
                'action':'generate_ai_seo_action', '_selected_action':str(self.property.pk), 'index':'0'})
            self.assertEqual(response.status_code, 302)
            action.assert_called_once()
