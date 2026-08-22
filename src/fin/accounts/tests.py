from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import MemberProfile

User = get_user_model()


class AuthFlowTests(APITestCase):
    def test_register_creates_user_profile_and_token(self):
        res = self.client.post('/api/auth/register/', {
            'username': 'awa',
            'email': 'awa@example.com',
            'first_name': 'Awa',
            'password': 'Str0ngPass!2024',
        }, format='json')

        self.assertEqual(res.status_code, 201)
        self.assertIn('token', res.data)
        user = User.objects.get(username='awa')
        self.assertTrue(MemberProfile.objects.filter(user=user).exists())

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user('a', 'dup@example.com', 'Str0ngPass!2024')
        res = self.client.post('/api/auth/register/', {
            'username': 'b',
            'email': 'dup@example.com',
            'password': 'Str0ngPass!2024',
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_register_rejects_weak_password(self):
        res = self.client.post('/api/auth/register/', {
            'username': 'c',
            'email': 'c@example.com',
            'password': '123',
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_login_and_me(self):
        User.objects.create_user('dara', 'dara@example.com', 'Str0ngPass!2024')
        res = self.client.post('/api/auth/login/', {
            'username': 'dara', 'password': 'Str0ngPass!2024',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        token = res.data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        me = self.client.get('/api/me/')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['username'], 'dara')

    def test_me_requires_auth(self):
        self.assertEqual(self.client.get('/api/me/').status_code, 401)
