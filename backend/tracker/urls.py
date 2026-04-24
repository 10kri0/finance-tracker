from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),
    path('auth/update-profile/', views.update_profile_view, name='update-profile'),
    path('auth/change-password/', views.change_password_view, name='change-password'),
    # Dashboard
    path('dashboard/', views.dashboard_view, name='dashboard'),
    # Expenses
    path('expenses/', views.expenses_list, name='expenses-list'),
    path('expenses/<int:pk>/', views.expenses_detail, name='expenses-detail'),
    # Incomes
    path('incomes/', views.incomes_list, name='incomes-list'),
    path('incomes/<int:pk>/', views.incomes_detail, name='incomes-detail'),
    # Categories
    path('categories/', views.categories_list, name='categories-list'),
    path('categories/<int:pk>/', views.categories_detail, name='categories-detail'),
]
