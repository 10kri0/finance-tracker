"""One-time, idempotent import of the legacy SQLite data into MongoDB."""

import sqlite3
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connections

from tracker.models import Category, Expense, Income, Month, User


class Command(BaseCommand):
    help = 'Import users, categories, months, incomes, and expenses from the legacy SQLite database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            default=None,
            help='Path to the legacy SQLite database (defaults to backend/db.sqlite3).',
        )

    def handle(self, *args, **options):
        source = Path(options['source']).resolve() if options['source'] else Path(__file__).resolve().parents[3] / 'db.sqlite3'
        if not source.is_file():
            raise CommandError(f'Legacy SQLite database was not found: {source}')

        source_key = str(source)
        connection = sqlite3.connect(f'file:{source.as_posix()}?mode=ro', uri=True)
        connection.row_factory = sqlite3.Row
        legacy_map = connections['default'].get_collection('sqlite_import_map')

        def imported(kind, legacy_id):
            return legacy_map.find_one({'source': source_key, 'kind': kind, 'legacy_id': legacy_id})

        def remember(kind, legacy_id, target_id):
            legacy_map.insert_one({
                'source': source_key,
                'kind': kind,
                'legacy_id': legacy_id,
                'target_id': str(target_id),
            })

        try:
            users = {}
            categories = {}
            months = {}
            counts = {'users': 0, 'categories': 0, 'months': 0, 'incomes': 0, 'expenses': 0}

            for row in connection.execute('SELECT * FROM tracker_user ORDER BY id'):
                user, created = User.objects.get_or_create(
                    email=row['email'],
                    defaults={
                        'name': row['name'], 'password': row['password'],
                        'is_active': bool(row['is_active']), 'is_staff': bool(row['is_staff']),
                        'is_superuser': bool(row['is_superuser']), 'last_login': row['last_login'],
                    },
                )
                users[row['id']] = user
                if not imported('user', row['id']):
                    remember('user', row['id'], user.id)
                    counts['users'] += int(created)

            for row in connection.execute('SELECT * FROM tracker_category ORDER BY id'):
                user = users.get(row['user_id'])
                if not user:
                    continue
                category, created = Category.objects.get_or_create(
                    user=user, name=row['name'],
                    defaults={
                        'icon': row['icon'], 'monthly_budget': Decimal(str(row['monthly_budget'])),
                        'category_type': row['category_type'], 'is_protected': bool(row['is_protected']),
                    },
                )
                if not created:
                    category.icon = row['icon']
                    category.monthly_budget = Decimal(str(row['monthly_budget']))
                    category.category_type = row['category_type']
                    category.is_protected = bool(row['is_protected'])
                    category.save()
                categories[row['id']] = category
                if not imported('category', row['id']):
                    remember('category', row['id'], category.id)
                    counts['categories'] += int(created)

            for row in connection.execute('SELECT * FROM tracker_month ORDER BY id'):
                user = users.get(row['user_id'])
                if not user:
                    continue
                month, created = Month.objects.get_or_create(
                    user=user, year=row['year'], month=row['month'], defaults={'name': row['name']}
                )
                months[row['id']] = month
                if not imported('month', row['id']):
                    remember('month', row['id'], month.id)
                    counts['months'] += int(created)

            for row in connection.execute('SELECT * FROM tracker_income ORDER BY id'):
                if imported('income', row['id']):
                    continue
                user, month = users.get(row['user_id']), months.get(row['month_id'])
                if not user or not month:
                    continue
                income = Income.objects.create(
                    user=user, name=row['name'], amount=Decimal(str(row['amount'])),
                    date=row['date'], source=row['source'], month=month,
                )
                remember('income', row['id'], income.id)
                counts['incomes'] += 1

            for row in connection.execute('SELECT * FROM tracker_expense ORDER BY id'):
                if imported('expense', row['id']):
                    continue
                user, month = users.get(row['user_id']), months.get(row['month_id'])
                if not user or not month:
                    continue
                expense = Expense.objects.create(
                    user=user, name=row['name'], amount=Decimal(str(row['amount'])), date=row['date'],
                    payment_method=row['payment_method'], category=categories.get(row['category_id']), month=month,
                )
                remember('expense', row['id'], expense.id)
                counts['expenses'] += 1
        finally:
            connection.close()

        self.stdout.write(self.style.SUCCESS(
            'SQLite import complete: ' + ', '.join(f'{name}={count}' for name, count in counts.items())
        ))
