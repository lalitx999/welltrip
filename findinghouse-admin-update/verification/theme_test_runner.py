from django.test.runner import DiscoverRunner
from django.db.models.signals import post_save, post_delete

class ThemeTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        # Existing global audit receivers attempt DB writes during migrations,
        # before the audit table exists. Pause only during test DB creation.
        from audit.signals import audit_post_save, audit_post_delete
        post_save.disconnect(audit_post_save)
        post_delete.disconnect(audit_post_delete)
        try:
            return super().setup_databases(**kwargs)
        finally:
            post_save.connect(audit_post_save)
            post_delete.connect(audit_post_delete)
