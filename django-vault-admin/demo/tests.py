from pathlib import Path
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from django.template.loader import get_template
from django.contrib.staticfiles import finders

class ThemeTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = get_user_model().objects.create_superuser('preview_admin', 'preview@example.invalid', 'test-only-password')
        cls.staff = get_user_model().objects.create_user('limited_staff', is_staff=True)
        cls.staff.user_permissions.add(Permission.objects.get(codename='view_group'))

    def test_login_and_anonymous_redirect(self):
        response = self.client.get(reverse('admin:login'))
        self.assertContains(response, 'vault_admin/theme.css')
        self.assertNotContains(response, 'id="vault-sidebar"')
        self.assertEqual(self.client.get(reverse('admin:index')).status_code, 302)

    def test_admin_pages(self):
        self.client.force_login(self.admin)
        urls = ['admin:index', 'admin:auth_user_changelist', 'admin:auth_user_add', 'admin:password_change']
        for url in urls:
            with self.subTest(url=url):
                response = self.client.get(reverse(url))
                self.assertEqual(response.status_code, 200)
                self.assertContains(response, 'id="vault-sidebar"')
                self.assertContains(response, 'vault_admin/theme.css')
        for page in ['change', 'delete', 'history']:
            self.assertEqual(self.client.get(reverse('admin:auth_user_' + page, args=[self.admin.pk])).status_code, 200)
        popup = self.client.get(reverse('admin:auth_user_add'), {'_popup': '1'})
        self.assertNotContains(popup, 'id="vault-sidebar"')

    def test_permissions_and_real_form_submission(self):
        self.client.force_login(self.staff)
        response = self.client.get(reverse('admin:index'))
        self.assertContains(response, reverse('admin:auth_group_changelist'))
        self.assertNotContains(response, reverse('admin:auth_user_changelist'))
        self.assertEqual(self.client.get(reverse('admin:auth_user_changelist')).status_code, 403)
        self.client.force_login(self.admin)
        response = self.client.post(reverse('admin:auth_group_add'), {'name':'Theme test group', '_save':'Save'})
        self.assertEqual(response.status_code, 302)

    def test_static_and_template_resolution(self):
        self.assertIn('vault_admin/templates', get_template('admin/base_site.html').origin.name)
        self.assertTrue(finders.find('vault_admin/theme.css'))
        self.assertTrue(finders.find('vault_admin/theme.js'))

    def test_export_visual_fixtures(self):
        # Opt-in HTML fixtures for local visual inspection; no real project data.
        import os
        destination = os.environ.get('VAULT_PREVIEW_DIR')
        if not destination:
            return
        target = Path(destination)
        target.mkdir(parents=True, exist_ok=True)
        (target/'login.html').write_bytes(self.client.get(reverse('admin:login')).content)
        self.client.force_login(self.admin)
        for name, url in [('index', 'admin:index'), ('list', 'admin:auth_user_changelist'), ('form', 'admin:auth_user_add')]:
            (target/(name+'.html')).write_bytes(self.client.get(reverse(url)).content)
