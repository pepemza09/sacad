from .base import *

DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*").split(",")

SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SESSION_COOKIE_SECURE = SECURE_SSL_REDIRECT
CSRF_COOKIE_SECURE = SECURE_SSL_REDIRECT
if SECURE_SSL_REDIRECT:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

STATIC_ROOT = "/app/staticfiles"
MEDIA_ROOT = "/app/media"

# Reutilizar conexiones a la DB (evita overhead de handshake por request)
DATABASES["default"]["CONN_MAX_AGE"] = 60
DATABASES["default"]["OPTIONS"] = {
    "options": "-c search_path=public",
}

# Cache con Redis (opcional, si REDIS_URL está configurado)
REDIS_URL = config("REDIS_URL", default=None)
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "CONNECTION_POOL_CLASS": "redis.BlockingConnectionPool",
                "CONNECTION_POOL_CLASS_KWARGS": {
                    "max_connections": 50,
                    "timeout": 20,
                },
                "MAX_CONNECTIONS": 1000,
                "PICKLE_VERSION": -1,
            },
            "KEY_PREFIX": "sacad",
        }
    }

    # Session backend en cache (solo si hay Redis)
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"

# Compression
MIDDLEWARE.insert(0, "django.middleware.gzip.GZipMiddleware")
