import os
import re
import sys

# Override DB to SQLite before django.setup() if needed for audit
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.local")

import django
from django.conf import settings

# Configure SQLite in-memory DB for pure standalone API audit
settings.DATABASES["default"] = {
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": ":memory:",
    "OPTIONS": {},
}

django.setup()

from django.core.management import call_command
from django.db import connection

# Run in-memory migrations for all apps
call_command("migrate", interactive=False, verbosity=0)

if "*" not in settings.ALLOWED_HOSTS and "testserver" not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append("testserver")
    settings.ALLOWED_HOSTS.append("localhost")

from django.urls import get_resolver
from rest_framework.test import APIClient
from apps.authentication.models import User, UserRoles

def audit_routes():
    resolver = get_resolver()
    client = APIClient()
    
    print("\n" + "="*105)
    print(" WELLTRIP DJANGO BACKEND API COMPREHENSIVE MASTER AUDIT REPORT")
    print("="*105 + "\n")
    
    routes = []
    
    def extract_urls(url_patterns, prefix=""):
        for pattern in url_patterns:
            if hasattr(pattern, "url_patterns"):
                extract_urls(pattern.url_patterns, prefix + str(pattern.pattern))
            else:
                raw_path = str(pattern.pattern)
                full_path = "/" + (prefix + raw_path).lstrip("^").rstrip("$")
                if full_path.startswith("/api/"):
                    routes.append((full_path, pattern.callback))

    extract_urls(resolver.url_patterns)
    
    print(f"Found total API Endpoints registered: {len(routes)}\n")
    print(f"{'Endpoint Path':<50} | {'View Function / Class':<30} | {'Public GET Status':<22}")
    print("-" * 110)

    crashes = []
    
    for path, callback in routes:
        callback_name = getattr(callback, "__name__", str(callback))
        view_class = getattr(callback, "view_class", None)
        view_name = view_class.__name__ if view_class else callback_name
        
        # Replace route parameters with dummy UUIDs or 1
        test_path = re.sub(r"<(?:str|int|uuid):[^>]+>", "11111111-1111-1111-1111-111111111111", path)
        test_path = test_path.replace("//", "/")
        
        try:
            response = client.get(test_path)
            status = response.status_code
            
            if status in [200, 201]:
                state = "PASS (200/201 OK)"
            elif status in [401, 403]:
                state = "PASS (Guarded 401/403)"
            elif status == 405:
                state = "405 Method Not Allowed"
            elif status == 404:
                state = "404 Not Found"
            elif status >= 500:
                state = f"FAIL ({status} CRASH!)"
                err_detail = getattr(response, 'data', str(response.content))
                crashes.append((path, view_name, status, err_detail))
            else:
                state = f"STATUS: {status}"
                
            print(f"{test_path:<50} | {view_name:<30} | {state:<22}")
            
        except Exception as e:
            state = "FAIL (EXCEPT CRASH!)"
            print(f"{test_path:<50} | {view_name:<30} | {state:<22}")
            crashes.append((path, view_name, "EXCEPT", str(e)))

    print("\n" + "="*105)
    if crashes:
        print(f"⚠️  CRASH SUMMARY ({len(crashes)} failing endpoints):")
        print("="*105)
        for c in crashes:
            print(f"- Endpoint: {c[0]}\n  View: {c[1]}\n  Error: {c[3]}\n")
    else:
        print("✓ ALL ENDPOINTS VERIFIED - 0 CRASHES / 500 ERRORS DETECTED!")
    print("="*105 + "\n")

if __name__ == "__main__":
    audit_routes()
