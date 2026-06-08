from .base import *

DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*").split(",")

SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

STATIC_ROOT = "/app/staticfiles"
MEDIA_ROOT = "/app/media"

# Connection pooling — reutilizar conexiones a la DB
DATABASES["default"]["CONN_MAX_AGE"] = config("DB_CONN_MAX_AGE", default=60, cast=int)
DATABASES["default"]["OPTIONS"] = {
    "options": "-c search_path=public",
    "pool": True,
}

# Cache con Redis
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": config("REDIS_URL", default="redis://redis:6379/0"),
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

# Cache REST Framework
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = [
    "rest_framework.throttling.AnonRateThrottle",
    "rest_framework.throttling.UserRateThrottle",
]
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "anon": "100/hour",
    "user": "1000/hour",
}

# Session backend en cache
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Compression
MIDDLEWARE.insert(0, "django.middleware.gzip.GZipMiddleware")
