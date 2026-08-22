from datetime import timedelta

from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Event, Reservation


def make_event(**kwargs):
    defaults = dict(
        title='Fintech After Hours',
        badge='Networking',
        starts_at=timezone.now() + timedelta(days=10),
        status=Event.Status.OPEN,
        join_url='https://meet.example.com/afi',
    )
    defaults.update(kwargs)
    return Event.objects.create(**defaults)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class ReservationTests(APITestCase):
    def test_reserve_creates_reservation_and_sends_email(self):
        event = make_event()
        res = self.client.post('/api/reservations/', {
            'event': event.id,
            'full_name': 'Awa Diallo',
            'email': 'Awa@Example.com',
        }, format='json')

        self.assertEqual(res.status_code, 201)
        reservation = Reservation.objects.get()
        self.assertEqual(reservation.email, 'awa@example.com')  # normalisé
        self.assertTrue(reservation.email_sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(event.join_url, mail.outbox[0].body)

    def test_reserve_rejects_duplicate_email(self):
        event = make_event()
        payload = {'event': event.id, 'full_name': 'A', 'email': 'a@example.com'}
        self.assertEqual(self.client.post('/api/reservations/', payload, format='json').status_code, 201)
        self.assertEqual(self.client.post('/api/reservations/', payload, format='json').status_code, 400)

    def test_reserve_rejects_past_event(self):
        event = make_event(starts_at=timezone.now() - timedelta(days=1))
        res = self.client.post('/api/reservations/', {
            'event': event.id, 'full_name': 'A', 'email': 'a@example.com',
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_events_endpoint_hides_join_url(self):
        make_event()
        res = self.client.get('/api/events/')
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('join_url', res.data['results'][0])
