from django.core.management.base import BaseCommand
from tracker.models import User, Category, Month, Expense, Income
from tracker.views import create_token
from datetime import date
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seeds the database with a demo user and sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        email = 'demo@finance.com'
        password = 'demo1234'
        user, created = User.objects.get_or_create(
            email=email, defaults={'name': 'Demo User'})
        if created:
            user.set_password(password)
            user.save()
            create_token(user)
            self.stdout.write(f'  Created user: {email} / {password}')
        else:
            self.stdout.write(f'  User exists: {email}')

        cats_data = [
            {'name': 'Food & Dining', 'icon': '🍴', 'monthly_budget': Decimal('800')},
            {'name': 'Healthcare', 'icon': '🏥', 'monthly_budget': Decimal('250')},
            {'name': 'Bills & Utilities', 'icon': '⚡', 'monthly_budget': Decimal('1200')},
            {'name': 'Transportation', 'icon': '🚂', 'monthly_budget': Decimal('150')},
            {'name': 'Shopping', 'icon': '🛒', 'monthly_budget': Decimal('400')},
            {'name': 'Entertainment', 'icon': '🎬', 'monthly_budget': Decimal('100')},
        ]
        cats = {}
        for c in cats_data:
            obj, _ = Category.objects.get_or_create(user=user, name=c['name'], defaults={**c, 'user': user})
            cats[obj.name] = obj

        months_list = [(2025,10),(2025,11),(2025,12),(2026,1),(2026,2),(2026,3),
                       (2026,4),(2026,5),(2026,6),(2026,7),(2026,8),(2026,9)]
        months = {}
        for y, m in months_list:
            d = date(y, m, 1)
            obj, _ = Month.objects.get_or_create(user=user, year=y, month=m,
                defaults={'name': d.strftime('%B %Y'), 'user': user})
            months[(y,m)] = obj

        expenses = [
            ('Gas Station', '65', date(2026,1,22), 'Transportation'),
            ('Grocery Shopping', '145.50', date(2026,1,24), 'Food & Dining'),
            ('Internet Bill', '79.99', date(2026,1,18), 'Bills & Utilities'),
            ('Restaurant Dinner', '85', date(2026,2,10), 'Food & Dining'),
            ('Uber Ride', '32.50', date(2026,2,10), 'Transportation'),
            ('Doctor Visit', '150', date(2026,2,13), 'Healthcare'),
            ('Streaming Sub', '15.99', date(2026,2,10), 'Entertainment'),
            ('Online Shopping', '100', date(2025,12,7), 'Shopping'),
            ('Electricity Bill', '85', date(2025,12,11), 'Bills & Utilities'),
        ]
        for name, amt, d, cat_name in expenses:
            Expense.objects.get_or_create(user=user, name=name, date=d,
                defaults={'amount': Decimal(amt), 'category': cats[cat_name],
                          'month': months[(d.year, d.month)], 'user': user})

        incomes = [
            ('Monthly Salary', '4500', date(2026,1,1), 'salary'),
            ('October Salary', '4500', date(2026,2,1), 'salary'),
            ('Rental Income', '2000', date(2026,1,5), 'real_estate'),
            ('E-commerce Sales', '1850', date(2026,2,15), 'ecommerce'),
            ('Icon Pack', '800', date(2026,2,20), 'digital_products'),
            ('Affiliate Commission', '450', date(2026,2,25), 'affiliates'),
        ]
        for name, amt, d, src in incomes:
            Income.objects.get_or_create(user=user, name=name, date=d,
                defaults={'amount': Decimal(amt), 'source': src,
                          'month': months[(d.year, d.month)], 'user': user})

        self.stdout.write(self.style.SUCCESS(f'Done! Login: {email} / {password}'))
