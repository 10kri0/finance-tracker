"""Custom CORS middleware (replaces django-cors-headers)."""
import os
from urllib.parse import urlparse


class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle preflight
        if request.method == 'OPTIONS':
            from django.http import HttpResponse
            response = HttpResponse()
            response.status_code = 200
        else:
            response = self.get_response(request)

        origin = request.META.get('HTTP_ORIGIN', '')
        allowed = ['http://localhost:5173', 'http://127.0.0.1:5173']
        configured_origins = [
            value.strip() for value in os.environ.get('FRONTEND_ORIGIN', '').split(',') if value.strip()
        ]
        parsed_origin = urlparse(origin)
        # Allow Vercel production and preview deployments. For a custom
        # domain, add its exact origin via FRONTEND_ORIGIN in Vercel settings.
        is_vercel_origin = (
            parsed_origin.scheme == 'https' and parsed_origin.hostname and parsed_origin.hostname.endswith('.vercel.app')
        )
        if origin in allowed or origin in configured_origins or is_vercel_origin:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response['Access-Control-Allow-Credentials'] = 'true'

        return response
