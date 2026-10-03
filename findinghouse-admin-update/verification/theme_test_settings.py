"""Isolated checks only: never imports production settings or .env."""
from pathlib import Path
import os
BASE_DIR = Path(os.environ['FH_TEST_BACKEND'])
SECRET_KEY = 'isolated-admin-theme-tests-not-production'
DEBUG = True
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']
INSTALLED_APPS = ['django.contrib.contenttypes','django.contrib.auth','django.contrib.admin','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','properties','inquiries','reviews','crm','audit','chat']
MIDDLEWARE = ['django.contrib.sessions.middleware.SessionMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware']
ROOT_URLCONF = 'theme_test_urls'
TEMPLATES = [{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[BASE_DIR/'templates'],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages','config.context_processors.admin_dashboard_stats']}}]
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR/'static']
STATIC_ROOT = '/tmp/findinghouse-admin-preview/static'
MEDIA_ROOT = '/tmp/findinghouse-admin-test-media'
USE_TZ = True
LANGUAGE_CODE = 'th'
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
FINDINGHOUSE_SITE_URL = 'https://example.invalid'
TEST_RUNNER = 'theme_test_runner.ThemeTestRunner'
