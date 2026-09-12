FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn whitenoise psycopg2-binary dj-database-url

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python fin/manage.py migrate --noinput && python fin/manage.py collectstatic --noinput && gunicorn fin.wsgi:application --bind 0.0.0.0:8000 --workers 2"]