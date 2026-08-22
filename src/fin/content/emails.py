"""Envoi des emails liés aux événements."""
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.formats import date_format


def send_reservation_email(reservation):
    """Envoie au visiteur la confirmation + le lien de l'événement.

    Renvoie True si l'email est parti, False sinon (jamais d'exception :
    une réservation reste valide même si l'email échoue).
    """
    event = reservation.event
    when = date_format(
        timezone.localtime(event.starts_at),
        format='l j F Y à H:i',
        use_l10n=True,
    )

    lines = [
        f'Bonjour {reservation.full_name},',
        '',
        f'Votre place pour « {event.title} » est bien réservée.',
        f'Date : {when}',
    ]
    if event.location:
        lines.append(f'Lieu : {event.location}')
    if event.join_url:
        lines += ['', f'Votre lien d\'accès : {event.join_url}']
    lines += ['', 'À très bientôt,', "L'équipe Africa Fintech Inside"]

    try:
        send_mail(
            subject=f'Confirmation — {event.title}',
            message='\n'.join(lines),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[reservation.email],
            fail_silently=False,
        )
        return True
    except Exception:  # SMTP indisponible, etc. — on ne bloque pas la réservation.
        return False
