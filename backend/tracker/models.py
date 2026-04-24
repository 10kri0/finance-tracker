from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator
from decimal import Decimal


class UserManager(BaseUserManager):
    """Custom manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email as the primary identifier."""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class Category(models.Model):
    """Expense category with monthly budget."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='📁')
    monthly_budget = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    CATEGORY_TYPES = [
        ('EXPENSE', 'Expense'),
        ('BALANCE', 'Balance'),
    ]
    category_type = models.CharField(max_length=10, choices=CATEGORY_TYPES, default='EXPENSE')
    is_protected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Month(models.Model):
    """Represents a calendar month for tracking."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='months')
    name = models.CharField(max_length=50)  # e.g. "January 2026"
    year = models.IntegerField()
    month = models.IntegerField()  # 1-12
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['user', 'year', 'month']

    def __str__(self):
        return self.name

    @property
    def total_income(self):
        return self.incomes.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

    @property
    def total_expense(self):
        return self.expenses.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

    @property
    def cashflow(self):
        return self.total_income - self.total_expense

    @property
    def budget_usage(self):
        total_budget = Category.objects.filter(user=self.user).aggregate(
            total=models.Sum('monthly_budget')
        )['total'] or Decimal('1.00')
        if total_budget == 0:
            return Decimal('0.00')
        return (self.total_expense / total_budget) * 100


class Expense(models.Model):
    """Individual expense transaction."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    name = models.CharField(max_length=200)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date = models.DateField()
    PAYMENT_CHOICES = [
        ('cash', 'Cash'),
        ('savings', 'Savings'),
        ('salary', 'Salary'),
    ]
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default='cash'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='expenses'
    )
    month = models.ForeignKey(
        Month,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.name} - ${self.amount}"

    def save(self, *args, **kwargs):
        # Auto-assign month based on date
        if self.date and self.user_id:
            month_obj, _ = Month.objects.get_or_create(
                user=self.user,
                year=self.date.year,
                month=self.date.month,
                defaults={
                    'name': self.date.strftime('%B %Y')
                }
            )
            self.month = month_obj
        super().save(*args, **kwargs)


class Income(models.Model):
    """Individual income transaction."""
    SOURCE_CHOICES = [
        ('salary', 'Salary'),
        ('freelance', 'Freelance'),
        ('digital_products', 'Digital Products'),
        ('real_estate', 'Real Estate'),
        ('ecommerce', 'Ecommerce'),
        ('affiliates', 'Affiliates'),
        ('investments', 'Investments'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    name = models.CharField(max_length=200)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date = models.DateField()
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        default='other'
    )
    month = models.ForeignKey(
        Month,
        on_delete=models.CASCADE,
        related_name='incomes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.name} - ${self.amount}"

    def save(self, *args, **kwargs):
        # Auto-assign month based on date
        if self.date and self.user_id:
            month_obj, _ = Month.objects.get_or_create(
                user=self.user,
                year=self.date.year,
                month=self.date.month,
                defaults={
                    'name': self.date.strftime('%B %Y')
                }
            )
            self.month = month_obj
        super().save(*args, **kwargs)
