# fin/cron_utils.py
def minutes_to_cron(minutes: int) -> str:
    """Convertit un intervalle en minutes en expression cron standard.

    Accepte soit un diviseur de 60 (5, 10, 15, 20, 30...), soit un multiple
    de 60 (60, 120, 180, 360, 1440 pour 1 jour...). Toute autre valeur lève
    une erreur explicite plutôt que de générer un cron silencieusement faux.
    """
    if minutes <= 0:
        raise ValueError("SYNC_INTERVAL_MINUTES doit être positif.")

    if minutes < 60:
        if 60 % minutes != 0:
            raise ValueError(
                "En dessous de 60, SYNC_INTERVAL_MINUTES doit diviser 60 "
                "exactement (5, 10, 15, 20, 30...)."
            )
        return f"*/{minutes} * * * *"

    hours, rem = divmod(minutes, 60)
    if rem != 0:
        raise ValueError(
            "Au-dessus de 60, SYNC_INTERVAL_MINUTES doit être un multiple "
            "de 60 (120, 180, 360, 1440...)."
        )
    if hours < 24:
        return f"0 */{hours} * * *"

    days, hour_rem = divmod(hours, 24)
    if hour_rem != 0:
        raise ValueError(
            "Au-dessus de 24h, SYNC_INTERVAL_MINUTES doit être un multiple "
            "de 1440 (1 jour)."
        )
    return f"0 0 */{days} * *"