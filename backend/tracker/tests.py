import json

from django.test import TestCase
from django.urls import reverse

from tracker.models import User


class AuthViewsTests(TestCase):
    def test_demo_login_creates_demo_user_when_missing(self):
        response = self.client.post(
            reverse('login'),
            data=json.dumps({'email': 'demo@finance.com', 'password': 'demo1234'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.filter(email='demo@finance.com').exists())
        body = response.json()
        self.assertIn('token', body)
        self.assertEqual(body['user']['email'], 'demo@finance.com')
