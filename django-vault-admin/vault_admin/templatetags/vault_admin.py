from django import template

register = template.Library()

@register.simple_tag
def model_total(apps):
    """Count only model links already authorized by the active AdminSite."""
    return sum(len(app.get("models", [])) for app in (apps or []))
