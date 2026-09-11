# stats/mixpanel_service.py
import base64
import requests
from django.conf import settings

MIXPANEL_BASE_URL = "https://mixpanel.com/api/2.0"  # ou eu.mixpanel.com selon la région du projet


def _auth_header():
    creds = f"{settings.MIXPANEL_SERVICE_ACCOUNT_USERNAME}:{settings.MIXPANEL_SERVICE_ACCOUNT_SECRET}"
    token = base64.b64encode(creds.encode()).decode()
    return {"Authorization": f"Basic {token}"}


def fetch_event_counts(event_name, from_date, to_date):
    params = {
        "event": event_name,
        "from_date": from_date,   # 'YYYY-MM-DD'
        "to_date": to_date,
        "project_id": settings.MIXPANEL_PROJECT_ID,
    }
    resp = requests.get(f"{MIXPANEL_BASE_URL}/events", params=params, headers=_auth_header(), timeout=10)
    resp.raise_for_status()
    return resp.json()