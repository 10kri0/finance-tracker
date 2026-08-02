# Finance Tracker / SpendWise

Last Updated: 2026-08-02
Module Version: 1.0.1
Status: Active

## Quick Navigation

- [Overview](#what-this-app-does)
- [Tech Stack](#technology-stack)
- [Structure](#project-structure)
- [Backend](#backend-overview)
- [Frontend](#frontend-overview)
- [API](#api-endpoints)
- [Run The App](#how-to-run-the-app)
- [Troubleshooting](#troubleshooting)
- [Notes](#notes)

SpendWise is a full-stack personal finance tracker built with Django and React. It helps you record income, expenses, categories, monthly budgets, and account balances in one place. The app also includes a "pay from" expense flow so spending can be tied to cash, savings, or salary sources.

## What this app does

SpendWise is designed to give a clear monthly picture of your money. The dashboard shows income, expense, cashflow, budget usage, charts, and recent transactions. Categories can be protected, budgets can be edited in bulk, and the profile page lets each user update their name and password.

Main capabilities:

- Email-based registration and login with custom token authentication.
- Dashboard with summary cards, charts, month navigation, and transaction tables.
- Expense entry with a "Pay From" selector for Cash, Savings, or Salary.
- Income entry with multiple income source types.
- Budget management for all categories, including protected balance categories.
- User profile editing and password change.
- Light and dark theme support in the frontend.

## Technology Stack

- Backend: Python 3.14, Django 5, SQLite
- Frontend: React 18, Vite 5, React Router 6, Recharts
- Styling: Plain CSS with a shared theme system

## Project Structure

```
finance-tracker/
|-- backend/
|   |-- config/
|   |   |-- settings.py
|   |   |-- urls.py
|   |-- tracker/
|   |   |-- models.py
|   |   |-- views.py
|   |   |-- urls.py
|   |   |-- middleware.py
|   |   |-- admin.py
|   |   |-- migrations/
|   |-- manage.py
|   |-- requirements.txt
|   |-- db.sqlite3
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- main.jsx
|   |   |-- App.jsx
|   |   |-- index.css
|   |   |-- api/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- components/
|   |-- package.json
|   |-- vite.config.js
|
|-- README.txt
```

## Backend Overview

The backend lives in [backend/tracker/models.py](backend/tracker/models.py) and [backend/tracker/views.py](backend/tracker/views.py).

Data models:

- User: custom email-based user model.
- Category: user-owned categories with an icon, monthly budget, category type, and protection flag.
- Month: a monthly aggregate record used for monthly stats and navigation.
- Expense: dated expense transactions with payment method, category, and month links.
- Income: dated income transactions with source, month links, and monthly aggregation.

Important backend behavior:

- Months are auto-created when an expense or income is saved.
- Protected categories such as Bank Savings and Cash Spending cannot be deleted.
- Token auth is handled by the app and stored in a simple JSON token file.
- Dashboard data is computed server-side for the current month or a selected month.

## Frontend Overview

The frontend is a Vite React application under [frontend/src](frontend/src).

Key screens:

- Login and Register for account access.
- Dashboard for summaries, charts, and transaction tables.
- Profile for name and password updates.
- ManageBudgets for editing category budgets and creating new categories.

Core frontend pieces:

- [frontend/src/App.jsx](frontend/src/App.jsx) handles routing and auth guards.
- [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) manages token and user state.
- [frontend/src/context/ThemeContext.jsx](frontend/src/context/ThemeContext.jsx) manages theme preference.
- [frontend/src/api/api.js](frontend/src/api/api.js) wraps API calls and auth headers.

## API Endpoints

All API routes are prefixed with `/api/`.

Auth:

- `POST /api/auth/register/` - register a new user
- `POST /api/auth/login/` - log in and receive a token
- `POST /api/auth/logout/` - invalidate the current token
- `GET /api/auth/me/` - return the current user
- `PUT /api/auth/update-profile/` - update the display name
- `PUT /api/auth/change-password/` - change the user password

Dashboard:

- `GET /api/dashboard/` - fetch dashboard data for the current month
- `GET /api/dashboard/?month_id=<id>` - fetch dashboard data for a specific month

Expenses:

- `GET /api/expenses/` - list expenses
- `POST /api/expenses/` - create an expense
- `DELETE /api/expenses/<id>/` - delete an expense

Incomes:

- `GET /api/incomes/` - list incomes
- `POST /api/incomes/` - create income
- `DELETE /api/incomes/<id>/` - delete income

Categories:

- `GET /api/categories/` - list categories with monthly usage
- `POST /api/categories/` - create a category
- `PUT /api/categories/<id>/` - update category name, icon, or budget
- `DELETE /api/categories/<id>/` - delete a category

Authentication header:

- `Authorization: Token <your-token>`

## Data Model Notes

Category types:

- EXPENSE: normal spending categories such as Food, Shopping, or Bills.
- BALANCE: protected balance categories such as Bank Savings and Cash Spending.

Expense payment methods:

- cash
- savings
- salary

Income sources:

- salary
- freelance
- digital_products
- real_estate
- ecommerce
- affiliates
- investments
- other

## How To Run The App

Prerequisites:

- Python 3.14 or compatible Python 3.10+
- Node.js 18+
- npm

### Backend

From the project root, or by using the backend folder directly:

```bash
cd c:\finance-tracker\backend
c:\finance-tracker\.venv\Scripts\python.exe manage.py migrate
c:\finance-tracker\.venv\Scripts\python.exe manage.py runserver
```

If you are using a different virtual environment, activate it first and use its Python executable.

### Frontend

In a separate terminal:

```bash
cd c:\finance-tracker\frontend
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if the shell blocks the npm wrapper:

```bash
Set-Location c:\finance-tracker\frontend
npm.cmd install
npm.cmd run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the Django backend.

## Build And Check Commands

- Backend checks: `c:\finance-tracker\.venv\Scripts\python.exe manage.py check`
- Frontend build: `npm run build` from `frontend/`

## Typical User Flow

1. Register or log in with an email and password.
2. Review the dashboard overview for current month totals.
3. Add expenses or income using the modal forms.
4. Click month data or chart points to view past months.
5. Open Manage Budgets to update category budgets in bulk.
6. Visit the profile page to update the user name or password.

## Troubleshooting

- If the frontend says `vite` is missing, run `npm install` in `frontend/` again.
- If PowerShell blocks npm scripts, use `npm.cmd`.
- If Django reports a missing field or table, run migrations again from `backend/`.
- If you get `401 Unauthorized`, log out and log back in so the token refreshes.
- If CORS fails in the browser, make sure both servers are running on the expected ports.

## Notes

- The app uses SQLite, so the database file is local to the workspace.
- The token store is file-based and is regenerated by the backend.
- This repository currently contains only the live web app code and its database, not a separate demo generator or report generator.

## License

This project is intended for educational and personal use.
