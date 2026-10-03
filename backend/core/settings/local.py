"""
Local development settings.

Kept as a thin override file so that production.py can stay independent
of anything development-only. DEBUG is safe to be True here because this
module is only used on a developer machine.
"""
from .base import *  # noqa: F401,F403
from .base import env  # noqa: F401

# Local dev defaults to DEBUG=True unless .env explicitly says otherwise.
DEBUG = env.bool("DJANGO_DEBUG", default=True)
