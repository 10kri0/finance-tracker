import re
from decimal import Decimal
from pathlib import Path
from datetime import datetime

from django.core.management.base import BaseCommand
from pypdf import PdfReader

from tracker.models import Category, Expense, Income, User
from tracker.views import create_token


class Command(BaseCommand):
    help = 'Import bank statement transactions from the PDF into the requested user account'

    def handle(self, *args, **options):
        workspace_root = Path(__file__).resolve().parents[4]
        pdf_path = workspace_root / 'bank statment.pdf'

        if not pdf_path.exists():
            self.stdout.write(self.style.ERROR(f'PDF not found at {pdf_path}'))
            return

        email = 'krish@admin.com'
        password = 'Krish@2727'
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'name': 'Krish Patel'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created user {email}'))
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        create_token(user)

        self.ensure_categories(user)

        transactions = self.extract_transactions(pdf_path)
        self.stdout.write(f'Parsed {len(transactions)} transactions from the statement')

        category_map = {cat.name: cat for cat in Category.objects.filter(user=user)}
        created_expenses = 0
        created_incomes = 0
        for txn in transactions:
            if txn['kind'] == 'expense':
                Expense.objects.create(
                    user=user,
                    name=txn['description'],
                    amount=txn['amount'],
                    date=txn['date'],
                    category=self.infer_category(txn['description'], category_map),
                    payment_method='cash',
                )
                created_expenses += 1
            else:
                Income.objects.create(
                    user=user,
                    name=txn['description'],
                    amount=txn['amount'],
                    date=txn['date'],
                    source='other',
                )
                created_incomes += 1

        self.stdout.write(self.style.SUCCESS(
            f'Imported {created_expenses} expenses and {created_incomes} incomes for {email}'
        ))

    def ensure_categories(self, user):
        categories = [
            {'name': 'Bank Savings', 'icon': '🏦', 'monthly_budget': Decimal('0.00'), 'category_type': 'BALANCE', 'is_protected': True},
            {'name': 'Cash Spending', 'icon': '💵', 'monthly_budget': Decimal('0.00'), 'category_type': 'BALANCE', 'is_protected': True},
            {'name': 'Food & Dining', 'icon': '🍴', 'monthly_budget': Decimal('800.00'), 'category_type': 'EXPENSE', 'is_protected': False},
            {'name': 'Healthcare', 'icon': '🏥', 'monthly_budget': Decimal('250.00'), 'category_type': 'EXPENSE', 'is_protected': False},
            {'name': 'Bills & Utilities', 'icon': '⚡', 'monthly_budget': Decimal('1200.00'), 'category_type': 'EXPENSE', 'is_protected': False},
            {'name': 'Transportation', 'icon': '🚂', 'monthly_budget': Decimal('150.00'), 'category_type': 'EXPENSE', 'is_protected': False},
            {'name': 'Shopping', 'icon': '🛒', 'monthly_budget': Decimal('400.00'), 'category_type': 'EXPENSE', 'is_protected': False},
            {'name': 'Entertainment', 'icon': '🎬', 'monthly_budget': Decimal('100.00'), 'category_type': 'EXPENSE', 'is_protected': False},
            {'name': 'Miscellaneous', 'icon': '🧾', 'monthly_budget': Decimal('300.00'), 'category_type': 'EXPENSE', 'is_protected': False},
        ]
        for item in categories:
            Category.objects.get_or_create(
                user=user,
                name=item['name'],
                defaults={**item, 'user': user}
            )

    def infer_category(self, description, category_map):
        text = description.lower()
        if any(keyword in text for keyword in ['swiggy', 'restaurant', 'food', 'grocery', 'blinkit', 'dining', 'pizza', 'coffee']):
            return category_map['Food & Dining']
        if any(keyword in text for keyword in ['doctor', 'hospital', 'medical', 'health', 'clinic']):
            return category_map['Healthcare']
        if any(keyword in text for keyword in ['bill', 'electricity', 'water', 'mobile', 'phone', 'internet', 'subscription', 'streaming', 'utility']):
            return category_map['Bills & Utilities']
        if any(keyword in text for keyword in ['uber', 'taxi', 'cab', 'fuel', 'petrol', 'metro', 'train', 'ride']):
            return category_map['Transportation']
        if any(keyword in text for keyword in ['shop', 'shopping', 'amazon', 'flipkart', 'fashion', 'ecommerce']):
            return category_map['Shopping']
        if any(keyword in text for keyword in ['movie', 'cinema', 'entertainment', 'music']):
            return category_map['Entertainment']
        return category_map['Miscellaneous']

    def extract_transactions(self, pdf_path):
        reader = PdfReader(str(pdf_path))
        full_text = '\n'.join(page.extract_text() or '' for page in reader.pages)
        lines = [line.strip() for line in full_text.splitlines()]

        transactions = []
        current = None
        for line in lines:
            date_match = re.match(r'^(\d{2})/(\d{2})/(\d{4})(?:\s+(\d{2})/(\d{2})/(\d{4}))?$', line)
            if date_match:
                if current and current.get('amount') is not None:
                    transactions.append(current)
                current = {
                    'date': datetime.strptime(date_match.group(1) + '/' + date_match.group(2) + '/' + date_match.group(3), '%d/%m/%Y').date(),
                    'kind': None,
                    'description': '',
                    'amount': None,
                }
                continue

            if not current:
                continue

            if line.startswith('WDL TFR'):
                current['kind'] = 'expense'
                continue
            if line.startswith('DEP TFR'):
                current['kind'] = 'income'
                continue

            if line.lower().startswith('page no') or line.startswith('Statement Summary'):
                if current and current.get('amount') is not None:
                    transactions.append(current)
                current = None
                continue

            if line.startswith('Balance') or line.startswith('Brought Forward') or line.startswith('As on'):
                if current and current.get('amount') is not None:
                    transactions.append(current)
                current = None
                continue

            amount_match = re.search(r'(?<!\d)(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})(?!\d)', line)
            if amount_match and current.get('amount') is None:
                current['amount'] = Decimal(amount_match.group(1).replace(',', ''))
                continue

            if line and not line.startswith('---') and 'page' not in line.lower():
                if current['description']:
                    current['description'] = f"{current['description']} | {line}"
                else:
                    current['description'] = line

        if current and current.get('amount') is not None:
            transactions.append(current)

        return transactions
