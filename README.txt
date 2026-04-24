================================================================================
                         SPENDWISE — README
================================================================================

Project      : SpendWise – Smart Expense & Budget Management System
Created by   : Tilak Badgujar, Sahil Rajput, Krish Patel
Built with   : Django (Backend) + React / Vite (Frontend)
Last Updated : April 2026 (v4 – SpendWise rebranding, full transaction view,
               demo seeding, Word report generation)

================================================================================
  1. PROJECT OVERVIEW
================================================================================

SpendWise is a full-stack web application for managing personal finances.
It tracks income, expenses, savings, and budgets with a smart "Pay From"
system that automatically deducts from the correct money pool.

Key Capabilities:
  - Secure email-based authentication (custom token auth, no third-party libs).
  - Dashboard with stats, charts (Recharts), and monthly time-machine view.
  - Smart expense tracking with "Pay From" (Cash / Savings / Salary).
  - Mandatory balance categories: Bank Savings & Cash Spending.
  - Full CRUD for expenses, incomes, and budget categories.
  - Budget management page with save-all and protected categories.
  - User profile with name editing and password change.
  - Dark / Light theme toggle persisted in localStorage.
  - Demo account seeder (seed_demo.py) with full April 2026 data.
  - Word report generator (make_report.py) → SpendWise_Project_Report.docx.

================================================================================
  2. TECH STACK
================================================================================

  Backend:   Python 3.10+, Django 4.2+, SQLite 3, Custom token auth
  Frontend:  React 18, Vite 5, React Router DOM 6, Recharts 2.12, Vanilla CSS

================================================================================
  3. FOLDER STRUCTURE
================================================================================

  finance-tracker/
  |
  |-- backend/                          # Django backend
  |   |-- config/
  |   |   |-- settings.py               # DB, middleware, AUTH_USER_MODEL
  |   |   |-- urls.py                   # Root URLs (includes /api/ routes)
  |   |-- tracker/
  |   |   |-- models.py                 # User, Category, Month, Expense, Income
  |   |   |-- views.py                  # All API views (auth, dashboard, CRUD)
  |   |   |-- urls.py                   # API URL routes
  |   |   |-- middleware.py             # Custom CORS middleware
  |   |   |-- admin.py                  # Django admin registration
  |   |   |-- migrations/              # Database migrations
  |   |-- manage.py
  |   |-- db.sqlite3                    # SQLite database
  |   |-- .tokens.json                  # Token storage (auto-generated)
  |
  |-- frontend/
  |   |-- public/
  |   |   |-- spendwise-logo.png        # SpendWise brand logo (SW monogram)
  |   |-- src/
  |   |   |-- main.jsx                  # App entry point
  |   |   |-- App.jsx                   # Routes & auth guards
  |   |   |-- index.css                 # Full design system (dark/light)
  |   |   |-- api/
  |   |   |   |-- api.js                # Fetch wrapper + auth headers
  |   |   |-- context/
  |   |   |   |-- AuthContext.jsx       # Auth state (token, user, login/logout)
  |   |   |   |-- ThemeContext.jsx      # Dark/light theme toggle
  |   |   |-- pages/
  |   |   |   |-- Login.jsx             # Login page
  |   |   |   |-- Register.jsx          # Registration page
  |   |   |   |-- Dashboard.jsx         # Main dashboard (3 tabs)
  |   |   |   |-- Profile.jsx           # User profile management
  |   |   |   |-- ManageBudgets.jsx     # Set Expense Budgets page
  |   |   |-- components/
  |   |       |-- StatsCards.jsx        # 4 summary cards (income/expense/etc)
  |   |       |-- Charts.jsx            # Pie + Bar charts (Recharts)
  |   |       |-- ExpenseTable.jsx      # All month expenses with payment badge
  |   |       |-- IncomeTable.jsx       # All month incomes table
  |   |       |-- BudgetTable.jsx       # Budget overview with balance bars
  |   |       |-- MonthlyStats.jsx      # Month-by-month stats table
  |   |       |-- AddExpenseModal.jsx   # Add expense with "Pay From" picker
  |   |       |-- AddIncomeModal.jsx    # Add income modal
  |   |-- vite.config.js                # Proxy /api -> Django
  |   |-- index.html                    # Title: SpendWise, favicon: logo PNG
  |
  |-- seed_demo.py                      # Creates demo account + April 2026 data
  |-- make_report.py                    # Generates SpendWise_Project_Report.docx
  |-- SpendWise_Project_Report.docx     # Generated Word project report
  |-- Project_Report_Final.pdf          # Original PDF project report
  |-- README.txt                        # This file

================================================================================
  4. DATA MODELS (backend/tracker/models.py)
================================================================================

  User (Custom, email-based)
  --------------------------
  Fields: email (unique), name, is_active, is_staff, date_joined.
  Uses email as USERNAME_FIELD (no username). Custom UserManager handles
  create_user() and create_superuser().

  Category
  --------
  Fields: user (FK), name, icon (emoji), monthly_budget, category_type,
          is_protected, created_at.
  Two types:
    - BALANCE: "Bank Savings" and "Cash Spending" are mandatory/protected.
      Their monthly_budget = total balance. Expenses deduct from it.
    - EXPENSE: Food & Dining, Shopping, etc. monthly_budget = spending limit.

  Month
  -----
  Fields: user (FK), name ("April 2026"), year, month (1-12).
  Unique together: (user, year, month). Auto-created on expense/income save().
  Computed: total_income, total_expense, cashflow, budget_usage.

  Expense
  -------
  Fields: user, name, amount, date, payment_method, category (FK), month (FK).
  payment_method choices: cash, savings, salary.
  Month AUTO-ASSIGNED on save() from the expense date.

  Income
  ------
  Fields: user, name, amount, date, source, month (FK).
  source choices: salary, freelance, digital_products, real_estate,
                  ecommerce, affiliates, investments, other.

================================================================================
  5. API ENDPOINTS (backend/tracker/urls.py + views.py)
================================================================================

  All endpoints prefixed with /api/. Protected = requires Authorization header.

  Auth:
    POST /api/auth/register/        Register (email, name, password, password_confirm)
    POST /api/auth/login/           Login (email, password) -> token + user
    POST /api/auth/logout/          Invalidate token [Protected]
    GET  /api/auth/me/              Get current user [Protected]
    PUT  /api/auth/update-profile/  Update name [Protected]
    PUT  /api/auth/change-password/ Change password [Protected]

  Dashboard:
    GET /api/dashboard/             Full dashboard data [Protected]
    GET /api/dashboard/?month_id=X  Time-machine: view a specific month

  Expenses:
    GET    /api/expenses/           List all expenses [Protected]
    POST   /api/expenses/           Create expense [Protected]
           Body: { name, amount, date, category, payment_method }
    DELETE /api/expenses/<id>/      Delete expense [Protected]

  Incomes:
    GET    /api/incomes/            List all incomes [Protected]
    POST   /api/incomes/            Create income [Protected]
    DELETE /api/incomes/<id>/       Delete income [Protected]

  Categories:
    GET    /api/categories/         List categories with usage stats [Protected]
    POST   /api/categories/         Create category [Protected]
    PUT    /api/categories/<id>/    Update category (name, icon, budget) [Protected]
    DELETE /api/categories/<id>/    Delete category [Protected]
           Note: "Bank Savings" and "Cash Spending" are protected → 403.

  Auth Header: Authorization: Token <your-token-here>

================================================================================
  6. APPLICATION SECTIONS
================================================================================

  6.1  AUTHENTICATION (Login / Register)
  -----------------------------------------------
  - Register with email + name + password. Django creates user, token, and
    auto-creates 10 default categories (Bank Savings, Cash Spending + 8 more).
  - Token stored in localStorage; all API calls include it as Authorization header.

  6.2  DASHBOARD — OVERVIEW TAB
  -----------------------------------------------
  - Greeting, New Expense / New Income buttons.
  - StatsCards: Monthly Income, Monthly Expenses, Monthly Cashflow, Budget Used %.
  - Charts: Bar chart (monthly income vs expense, clickable for time-travel) +
    Pie chart (expense breakdown by category this month).
  - BudgetTable: Balance categories (fuel-gauge bar) + Expense categories (usage bar).
  - MonthlyStats: Clickable rows to time-travel to any past month.

  6.3  DASHBOARD — TRANSACTIONS TAB
  -----------------------------------------------
  - ExpenseTable: ALL expenses for selected month (no 10-item cap).
    Shows "Expenses — April 2026" heading with month context.
  - IncomeTable: ALL incomes for selected month.
  - Delete button on each row. "+ Add" buttons open modals.

  6.4  DASHBOARD — BUDGET TAB
  -----------------------------------------------
  - Expanded BudgetTable + MonthlyStats.
  - "⚙️ Manage Budgets & Categories" button → /budgets page.

  6.5  ADD EXPENSE MODAL — "PAY FROM" SYSTEM
  -----------------------------------------------
  - Pay From picker: 💵 Cash → Cash Spending | 🏦 Savings → Bank Savings
    | 💼 Salary → Salary category.
  - Each card shows live remaining balance.
  - Category auto-selected based on Pay From choice.
  - Date input restricted to today or past (future dates blocked).

  6.6  ADD INCOME MODAL
  -----------------------------------------------
  - Fields: Name, Amount, Date, Source (salary/freelance/investments/etc).

  6.7  SET EXPENSE BUDGETS PAGE (/budgets)
  -----------------------------------------------
  - Batch-edit all category budgets. Save Changes appears only when modified.
  - Protected categories show 🔒 and cannot be deleted.

  6.8  USER PROFILE PAGE (/profile)
  -----------------------------------------------
  - View user info (avatar, name, email, join date).
  - Edit display name. Change password (with server-side current password check).
  - Sign Out button.

  6.9  DARK / LIGHT THEME
  -----------------------------------------------
  - ☀️/🌙 toggle in navbar. Saved in localStorage. Smooth 0.3s transitions.

================================================================================
  7. DEMO ACCOUNT
================================================================================

  Run seed_demo.py to create a fully populated demo account:

    python3 seed_demo.py

  Demo credentials:
    Email    : demo@financetracker.app
    Password : Demo@1234
    Name     : Alex Demo

  Seeds for April 2026:
    - 10 categories (Bank Savings ₹85,000, Cash Spending ₹12,000 + 8 expense)
    - 7 income entries  → ₹1,13,000 total
    - 33 expense entries → ₹30,818 total
    - Cashflow: ₹82,182 ✅

================================================================================
  8. WORD REPORT GENERATION
================================================================================

  Generates a complete project report Word document:

    pip3 install python-docx
    python3 make_report.py

  Output: SpendWise_Project_Report.docx
  Includes: Title page, Certificate, Declaration, Index, all 11 sections,
            budget/stats tables with real data, all 5 screenshots from PDF,
            SpendWise logo, and bibliography.

================================================================================
  9. HOW TO RUN
================================================================================

  PREREQUISITES: Python 3.10+, Node.js 18+, npm 9+

  # Terminal 1 — Backend
  cd finance-tracker/backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  python manage.py makemigrations tracker
  python manage.py migrate
  python manage.py runserver           # -> http://127.0.0.1:8000

  # Terminal 2 — Frontend
  cd finance-tracker/frontend
  npm install
  npm run dev                          # -> http://localhost:5173

  Open http://localhost:5173 in your browser.

  # Optional: Seed demo account
  python3 seed_demo.py                 # from project root

================================================================================
  10. ARCHITECTURE
================================================================================

  +---------------------+          +---------------------+
  |   React Frontend    |   HTTP   |   Django Backend    |
  |   (Vite, port 5173) | -------> |   (port 8000)       |
  |                     | <------- |                     |
  +---------------------+   JSON   +---------------------+
          |                                  |
    localStorage                        SQLite DB
    (token, theme)                     (db.sqlite3)
                                             |
                                    +--------+--------+
                                    |  Tables:        |
                                    |  - User         |
                                    |  - Category     |
                                    |  - Month        |
                                    |  - Expense      |
                                    |  - Income       |
                                    +-----------------+

  Expense Flow (Pay From):
  1. User picks "Pay From" (e.g., Savings) in AddExpenseModal.
  2. Category auto-selects "Bank Savings".
  3. POST /api/expenses/ with payment_method=savings.
  4. Dashboard refreshes → BudgetTable shows updated balance.

================================================================================
  11. TROUBLESHOOTING
================================================================================

  "no such column: tracker_expense.payment_method"
    -> Run: python manage.py makemigrations tracker && python manage.py migrate

  "CORS error" in browser console
    -> Ensure backend on port 8000 and frontend on port 5173.

  "401 Unauthorized"
    -> Token expired. Log out and log back in.

  Budget not updating after expense
    -> Verify expense has correct category assigned (check Transactions tab).

  Transactions tab shows empty
    -> Fixed in v4: [:10] cap removed, all month transactions now returned.

================================================================================
  12. LICENSE
================================================================================

  This project was built for educational / personal use (MCA Python Lab).
  Feel free to modify and use it as needed.

================================================================================
                            END OF README
================================================================================
