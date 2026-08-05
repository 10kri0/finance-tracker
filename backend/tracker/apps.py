from django.apps import AppConfig


class TrackerConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'tracker'
