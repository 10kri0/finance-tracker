"""Django settings for config project."""
import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

# MongoDB Atlas credentials stay outside source control in the project-level
# .env file. MONGODB_URI must include the target database name.
load_dotenv(PROJECT_ROOT / '.env')

SECRET_KEY = 'django-insecure-_^23c9!+g-q5k#_d0nvm94jckvl1d$*2de6rj&3cwq+zo4ed2%'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'config.apps.MongoAdminConfig',
    'config.apps.MongoAuthConfig',
    'config.apps.MongoContentTypesConfig',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_mongodb_backend',
    'tracker.apps.TrackerConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'tracker.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

MONGODB_URI = os.environ.get('MONGODB_URI', '')
MONGODB_DATABASE = (
    os.environ.get('MONGODB_DATABASE')
    or os.environ.get('MONGODB_DB_NAME')
    or urlparse(MONGODB_URI).path.strip('/').split('/')[0]
    or 'spendwise'
)

DATABASES = {
    'default': {
        'ENGINE': 'django_mongodb_backend',
        'HOST': MONGODB_URI,
        'NAME': MONGODB_DATABASE,
    }
}

if not MONGODB_URI:
    raise RuntimeError('MONGODB_URI is required. Add it to the project-level .env file.')

DATABASE_ROUTERS = ['django_mongodb_backend.routers.MongoRouter']

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django_mongodb_backend.fields.ObjectIdAutoField'

# MongoDB versions of the migrations are kept separate from the former SQLite
# migrations, allowing this deployment to initialise a clean Atlas database.
MIGRATION_MODULES = {
    'admin': 'mongo_migrations.admin',
    'auth': 'mongo_migrations.auth',
    'contenttypes': 'mongo_migrations.contenttypes',
    'tracker': 'mongo_migrations.tracker',
}

# Custom User Model
AUTH_USER_MODEL = 'tracker.User'
