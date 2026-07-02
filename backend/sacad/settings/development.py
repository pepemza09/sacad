from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

INSTALLED_APPS += ["django_extensions", "debug_toolbar"]
MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
INTERNAL_IPS = ["127.0.0.1", "0.0.0.0", "localhost"]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

current_opts = DATABASES["default"]["OPTIONS"].get("options", "")
DATABASES["default"]["OPTIONS"]["options"] = f"{current_opts} -c search_path=public".strip()
