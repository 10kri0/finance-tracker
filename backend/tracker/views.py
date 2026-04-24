"""Pure Django views — no DRF dependency. Token auth via custom header."""
import json
import hashlib
import secrets
from datetime import date as date_type
from decimal import Decimal, InvalidOperation
from functools import wraps

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Sum

from .models import User, Category, Month, Expense, Income


# ─── Helpers ────────────────────────────────────────────────

def json_body(request):
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return {}


def serialize_user(user):
    return {'id': user.id, 'email': user.email, 'name': user.name,
            'date_joined': user.date_joined.isoformat()}


def serialize_category(cat, now=None):
    if now is None:
        now = timezone.now()
    exp = cat.expenses.filter(date__year=now.year, date__month=now.month
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')
    budget = cat.monthly_budget or Decimal('1')
    usage = float(exp / budget * 100) if budget else 0
    
    remaining_balance = None
    if cat.category_type == 'BALANCE':
        remaining_balance = float(cat.monthly_budget - exp)

    return {'id': cat.id, 'name': cat.name, 'icon': cat.icon,
            'monthly_budget': float(cat.monthly_budget),
            'expense_this_month': float(exp), 'usage': round(usage, 1),
            'remaining_balance': remaining_balance,
            'category_type': cat.category_type,
            'is_protected': cat.is_protected}


def serialize_expense(exp):
    return {'id': exp.id, 'name': exp.name, 'amount': float(exp.amount),
            'date': exp.date.isoformat(),
            'category': exp.category_id,
            'category_name': exp.category.name if exp.category else None,
            'category_icon': exp.category.icon if exp.category else '📁',
            'payment_method': exp.payment_method,
            'month': exp.month_id, 'created_at': exp.created_at.isoformat()}


def serialize_income(inc):
    source_map = dict(Income.SOURCE_CHOICES)
    return {'id': inc.id, 'name': inc.name, 'amount': float(inc.amount),
            'date': inc.date.isoformat(), 'source': inc.source,
            'source_display': source_map.get(inc.source, inc.source),
            'month': inc.month_id, 'created_at': inc.created_at.isoformat()}


def serialize_month(m):
    return {'id': m.id, 'name': m.name, 'year': m.year, 'month': m.month,
            'total_income': float(m.total_income), 'total_expense': float(m.total_expense),
            'cashflow': float(m.cashflow), 'budget_usage': float(m.budget_usage)}


def serialize_month_detail(m):
    d = serialize_month(m)
    d['expenses'] = [serialize_expense(e) for e in m.expenses.select_related('category').all()]
    d['incomes'] = [serialize_income(i) for i in m.incomes.all()]
    return d


# ─── Token store (simple DB-less approach using Django sessions) ───
# We'll use a simple token table approach with the User model.
# Tokens stored in a simple file/dict. For simplicity, we use
# a hashed token stored in user's profile or a simple dict.

_tokens = {}  # token -> user_id (in-memory, reloaded from DB)


def _load_tokens():
    """Load tokens from a simple JSON file."""
    import os
    token_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tokens.json')
    try:
        with open(token_file, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_tokens(tokens):
    import os
    token_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tokens.json')
    with open(token_file, 'w') as f:
        json.dump(tokens, f)


def create_token(user):
    tokens = _load_tokens()
    # Remove old tokens for this user
    tokens = {k: v for k, v in tokens.items() if v != user.id}
    token = secrets.token_hex(20)
    tokens[token] = user.id
    _save_tokens(tokens)
    return token


def delete_token(token):
    tokens = _load_tokens()
    tokens.pop(token, None)
    _save_tokens(tokens)


def get_user_from_token(token):
    tokens = _load_tokens()
    user_id = tokens.get(token)
    if user_id:
        try:
            return User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return None
    return None


# ─── Auth decorator ─────────────────────────────────────────

def login_required_api(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if auth.startswith('Token '):
            token = auth[6:]
            user = get_user_from_token(token)
            if user:
                request.user = user
                request._token = token
                return view_func(request, *args, **kwargs)
        return JsonResponse({'detail': 'Authentication required.'}, status=401)
    return wrapper


# ─── Auth Views ─────────────────────────────────────────────

@require_http_methods(['POST'])
def register_view(request):
    data = json_body(request)
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip()
    password = data.get('password', '')
    password_confirm = data.get('password_confirm', '')

    if not email or not password:
        return JsonResponse({'email': ['Email and password are required.']}, status=400)
    if password != password_confirm:
        return JsonResponse({'password_confirm': ['Passwords do not match.']}, status=400)
    if len(password) < 6:
        return JsonResponse({'password': ['Password must be at least 6 characters.']}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'email': ['A user with this email already exists.']}, status=400)

    user = User.objects.create_user(email=email, password=password, name=name)
    token = create_token(user)

    # Create default categories — Bank Savings and Cash Spending are mandatory
    for cat in [
        {'name': 'Bank Savings',    'icon': '🏦', 'monthly_budget': Decimal('0'), 'category_type': 'BALANCE', 'is_protected': True},
        {'name': 'Cash Spending',   'icon': '💵', 'monthly_budget': Decimal('0'), 'category_type': 'BALANCE', 'is_protected': True},
        {'name': 'Food & Dining',   'icon': '🍴', 'monthly_budget': Decimal('800'), 'category_type': 'EXPENSE', 'is_protected': False},
        {'name': 'Healthcare',      'icon': '🏥', 'monthly_budget': Decimal('250'), 'category_type': 'EXPENSE', 'is_protected': False},
        {'name': 'Bills & Utilities','icon': '⚡', 'monthly_budget': Decimal('1200'), 'category_type': 'EXPENSE', 'is_protected': False},
        {'name': 'Transportation',  'icon': '🚂', 'monthly_budget': Decimal('150'), 'category_type': 'EXPENSE', 'is_protected': False},
        {'name': 'Shopping',        'icon': '🛒', 'monthly_budget': Decimal('400'), 'category_type': 'EXPENSE', 'is_protected': False},
        {'name': 'Entertainment',   'icon': '🎬', 'monthly_budget': Decimal('100'), 'category_type': 'EXPENSE', 'is_protected': False},
    ]:
        Category.objects.create(user=user, **cat)

    now = timezone.now()
    Month.objects.get_or_create(user=user, year=now.year, month=now.month,
                                defaults={'name': now.strftime('%B %Y')})

    return JsonResponse({'token': token, 'user': serialize_user(user)}, status=201)


@require_http_methods(['POST'])
def login_view(request):
    data = json_body(request)
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    user = authenticate(email=email, password=password)
    if not user or not user.is_active:
        return JsonResponse({'non_field_errors': ['Invalid email or password.']}, status=400)
    token = create_token(user)
    return JsonResponse({'token': token, 'user': serialize_user(user)})


@require_http_methods(['POST'])
@login_required_api
def logout_view(request):
    delete_token(request._token)
    return JsonResponse({'detail': 'Logged out.'})


@require_http_methods(['GET'])
@login_required_api
def me_view(request):
    return JsonResponse(serialize_user(request.user))


@require_http_methods(['PUT'])
@login_required_api
def update_profile_view(request):
    data = json_body(request)
    name = (data.get('name') or '').strip()
    if not name:
        return JsonResponse({'error': 'Name is required.'}, status=400)
    if len(name) > 150:
        return JsonResponse({'error': 'Name must be 150 characters or fewer.'}, status=400)
    request.user.name = name
    request.user.save(update_fields=['name'])
    return JsonResponse({'detail': 'Profile updated.', 'user': serialize_user(request.user)})


@require_http_methods(['PUT'])
@login_required_api
def change_password_view(request):
    data = json_body(request)
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_password or not new_password:
        return JsonResponse({'error': 'Both current and new password are required.'}, status=400)
    if not request.user.check_password(current_password):
        return JsonResponse({'error': 'Current password is incorrect.'}, status=400)
    if len(new_password) < 6:
        return JsonResponse({'error': 'New password must be at least 6 characters.'}, status=400)

    request.user.set_password(new_password)
    request.user.save(update_fields=['password'])
    return JsonResponse({'detail': 'Password changed successfully.'})


# ─── Dashboard ──────────────────────────────────────────────

@require_http_methods(['GET'])
@login_required_api
def dashboard_view(request):
    user = request.user
    
    month_id = request.GET.get('month_id')
    if month_id:
        try:
            target_month = Month.objects.get(id=month_id, user=user)
            from datetime import date
            now = date(target_month.year, target_month.month, 1)
        except Month.DoesNotExist:
            now = timezone.now()
    else:
        now = timezone.now()

    current_month, _ = Month.objects.get_or_create(
        user=user, year=now.year, month=now.month,
        defaults={'name': now.strftime('%B %Y')})

    months = Month.objects.filter(user=user)
    categories = Category.objects.filter(user=user)
    
    # All expenses and incomes for the selected month (supports time-machine view)
    recent_expenses = Expense.objects.filter(
        user=user, date__year=now.year, date__month=now.month
    ).select_related('category', 'month').order_by('-date', '-created_at')
    
    recent_incomes = Income.objects.filter(
        user=user, date__year=now.year, date__month=now.month
    ).select_related('month').order_by('-date', '-created_at')

    total_income = Income.objects.filter(user=user).aggregate(t=Sum('amount'))['t'] or Decimal('0')
    total_expense = Expense.objects.filter(user=user).aggregate(t=Sum('amount'))['t'] or Decimal('0')

    cat_breakdown = list(Expense.objects.filter(
        user=user, date__year=now.year, date__month=now.month
    ).values('category__name', 'category__icon').annotate(
        total=Sum('amount')).order_by('-total'))
    # Convert Decimal to float in breakdown
    for item in cat_breakdown:
        item['total'] = float(item['total'])

    return JsonResponse({
        'current_month': serialize_month_detail(current_month),
        'months': [serialize_month(m) for m in months],
        'categories': [serialize_category(c, now) for c in categories],
        'recent_expenses': [serialize_expense(e) for e in recent_expenses],
        'recent_incomes': [serialize_income(i) for i in recent_incomes],
        'total_income_all': float(total_income),
        'total_expense_all': float(total_expense),
        'total_cashflow_all': float(total_income - total_expense),
        'category_breakdown': cat_breakdown,
    })


# ─── CRUD: Expenses ────────────────────────────────────────

@require_http_methods(['GET', 'POST'])
@login_required_api
def expenses_list(request):
    if request.method == 'GET':
        qs = Expense.objects.filter(user=request.user).select_related('category', 'month')
        return JsonResponse([serialize_expense(e) for e in qs], safe=False)

    data = json_body(request)
    try:
        d = date_type.fromisoformat(data['date'])
        amt = Decimal(str(data['amount']))
    except (KeyError, ValueError, InvalidOperation):
        return JsonResponse({'error': 'Invalid data'}, status=400)

    month, _ = Month.objects.get_or_create(
        user=request.user, year=d.year, month=d.month,
        defaults={'name': d.strftime('%B %Y')})

    cat_id = data.get('category')
    cat = None
    if cat_id:
        try:
            cat = Category.objects.get(id=cat_id, user=request.user)
        except Category.DoesNotExist:
            pass

    payment_method = data.get('payment_method', 'cash')

    if not cat:
        if payment_method == 'savings':
            cat = Category.objects.filter(user=request.user, name__iexact='Bank Savings').first()
        elif payment_method == 'cash':
            cat = Category.objects.filter(user=request.user, name__iexact='Cash Spending').first()
        elif payment_method == 'salary':
            cat = Category.objects.filter(user=request.user, name__iexact='Salary').first()

    exp = Expense.objects.create(
        user=request.user, name=data.get('name', ''), amount=amt,
        date=d, category=cat, month=month,
        payment_method=payment_method
    )
    return JsonResponse(serialize_expense(exp), status=201)


@require_http_methods(['DELETE'])
@login_required_api
def expenses_detail(request, pk):
    try:
        exp = Expense.objects.get(id=pk, user=request.user)
    except Expense.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    exp.delete()
    return JsonResponse({'detail': 'Deleted'}, status=200)


# ─── CRUD: Incomes ─────────────────────────────────────────

@require_http_methods(['GET', 'POST'])
@login_required_api
def incomes_list(request):
    if request.method == 'GET':
        qs = Income.objects.filter(user=request.user).select_related('month')
        return JsonResponse([serialize_income(i) for i in qs], safe=False)

    data = json_body(request)
    try:
        d = date_type.fromisoformat(data['date'])
        amt = Decimal(str(data['amount']))
    except (KeyError, ValueError, InvalidOperation):
        return JsonResponse({'error': 'Invalid data'}, status=400)

    month, _ = Month.objects.get_or_create(
        user=request.user, year=d.year, month=d.month,
        defaults={'name': d.strftime('%B %Y')})

    inc = Income.objects.create(
        user=request.user, name=data.get('name', ''), amount=amt,
        date=d, source=data.get('source', 'other'), month=month)
    return JsonResponse(serialize_income(inc), status=201)


@require_http_methods(['DELETE'])
@login_required_api
def incomes_detail(request, pk):
    try:
        inc = Income.objects.get(id=pk, user=request.user)
    except Income.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    inc.delete()
    return JsonResponse({'detail': 'Deleted'}, status=200)


# ─── CRUD: Categories ──────────────────────────────────────

@require_http_methods(['GET', 'POST'])
@login_required_api
def categories_list(request):
    if request.method == 'GET':
        now = timezone.now()
        cats = Category.objects.filter(user=request.user)
        return JsonResponse([serialize_category(c, now) for c in cats], safe=False)

    data = json_body(request)
    cat = Category.objects.create(
        user=request.user,
        name=data.get('name', ''),
        icon=data.get('icon', '📁'),
        monthly_budget=Decimal(str(data.get('monthly_budget', 0)))
    )
    return JsonResponse(serialize_category(cat), status=201)


@require_http_methods(['PUT', 'DELETE'])
@login_required_api
def categories_detail(request, pk):
    try:
        cat = Category.objects.get(id=pk, user=request.user)
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'DELETE':
        if cat.is_protected:
            return JsonResponse({'error': f'"{cat.name}" is a protected category and cannot be deleted.'}, status=403)
        cat.delete()
        return JsonResponse({'detail': 'Deleted'}, status=200)

    # PUT
    data = json_body(request)
    cat.name = data.get('name', cat.name)
    cat.icon = data.get('icon', cat.icon)
    try:
        if 'monthly_budget' in data:
            cat.monthly_budget = Decimal(str(data['monthly_budget']))
    except (ValueError, InvalidOperation):
        return JsonResponse({'error': 'Invalid budget amount'}, status=400)
    
    cat.save()
    return JsonResponse(serialize_category(cat, timezone.now()), status=200)
