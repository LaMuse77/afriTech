#!/usr/bin/env bash

set -o errexit

pip install -r requirements.txt

python src/fin/manage.py collectstatic --no-input

python src/fin/manage.py migrate

