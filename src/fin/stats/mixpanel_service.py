# stats/mixpanel_service.py
import base64
import json

import requests
from django.conf import settings

# API d'EXPORT BRUT (pas l'API de "requête" /api/2.0/events sur mixpanel.com,
# qui elle est réservée aux plans payants Growth/Enterprise et renvoie 402
# sur le plan Free). Celle-ci renvoie les événements un par un, sur tous
# les plans, y compris Free.
MIXPANEL_EXPORT_URL = "https://data.mixpanel.com/api/2.0/export"


def _auth_header():
    creds = f"{settings.MIXPANEL_SERVICE_ACCOUNT_USERNAME}:{settings.MIXPANEL_SERVICE_ACCOUNT_SECRET}"
    token = base64.b64encode(creds.encode()).decode()
    return {"Authorization": f"Basic {token}"}


def fetch_event_counts(event_name, from_date, to_date):
    """Compte les occurrences d'un seul événement sur une période donnée."""
    return fetch_many_event_counts([event_name], from_date, to_date)[event_name]


def fetch_many_event_counts(event_names, from_date, to_date):
    """
    Compte les occurrences de plusieurs événements en UNE seule requête
    (l'API d'export est limitée en nombre d'appels par heure).

    On télécharge les événements bruts (format JSONL : un objet JSON par
    ligne) puis on compte nous-mêmes par nom d'événement, plutôt que de
    demander à Mixpanel un total déjà calculé (ce qui nécessiterait un plan
    payant). Renvoie {nom_event: nombre}, 0 pour un event jamais reçu.
    """
    params = {
        "from_date": from_date,   # 'YYYY-MM-DD'
        "to_date": to_date,
        "event": json.dumps(list(event_names)),
        "project_id": settings.MIXPANEL_PROJECT_ID,
    }
    resp = requests.get(
        MIXPANEL_EXPORT_URL,
        params=params,
        headers=_auth_header(),
        timeout=30,
        stream=True,
    )
    resp.raise_for_status()

    counts = {name: 0 for name in event_names}
    for line in resp.iter_lines():
        # Lignes ignorées : vides, ou texte brut que Mixpanel renvoie à la
        # place du JSON quand aucun événement ne correspond ("terminated early").
        if not line or not line.lstrip().startswith(b"{"):
            continue
        name = json.loads(line).get("event")
        if name in counts:
            counts[name] += 1
    return counts