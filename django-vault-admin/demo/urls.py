from django.contrib import admin
from django.urls import path
admin.site.site_header = "Workspace"
admin.site.site_title = "Workspace Admin"
urlpatterns = [path("admin/", admin.site.urls)]
