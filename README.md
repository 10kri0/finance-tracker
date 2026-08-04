# SpendWise Finance Tracker

Version: 1.1.0
Last Updated: 2026-08-05

SpendWise is a full-stack personal finance tracker built with Django and React. It helps users manage income, expenses, monthly budgets, category trends, and account balances in a single dashboard-driven experience.

## Overview

This project combines a Django backend with a React frontend to provide a lightweight but practical personal finance application. Users can register, log in, add transactions, review monthly performance, and manage category budgets from a modern web interface.

## Key Features

- Secure email-based authentication and profile management
- Dashboard with summary cards, monthly stats, charts, and recent transactions
- Expense and income entry with monthly organization
- Budget management with category-level editing and a monthly budget setup card
- Protected balance categories such as savings and cash spending
- Light and dark theme support
- Demo access for quick testing:
  - Email: demo@finance.com
  - Password: demo1234

## Technology Stack

- Backend: Python, Django, SQLite
- Frontend: React 18, Vite 5, React Router 6, Recharts
- Styling: Custom CSS with theme support

## Project Structure

```text
finance-tracker/
├── backend/
│   ├── config/
│   ├── tracker/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### 1. Backend Setup

From the project root, run:

```bash
cd backend
c:/finance-tracker/.venv/Scripts/python.exe manage.py migrate
c:/finance-tracker/.venv/Scripts/python.exe manage.py seed_data
c:/finance-tracker/.venv/Scripts/python.exe manage.py runserver
```

The seed command creates the demo user and sample finance data, including starter categories, months, expenses, and incomes.

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The application will be available at:

- http://localhost:5173

## API Overview

All API routes are prefixed with `/api/`.

### Authentication

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `PUT /api/auth/update-profile/`
- `PUT /api/auth/change-password/`

### Core Data Routes

- `GET /api/dashboard/`
- `GET /api/expenses/`
- `POST /api/expenses/`
- `GET /api/incomes/`
- `POST /api/incomes/`
- `GET /api/categories/`
- `POST /api/categories/`
- `PUT /api/categories/<id>/`
- `DELETE /api/categories/<id>/`

## Typical User Flow

1. Register or sign in with an email and password.
2. Review the dashboard overview for the current month.
3. Add expenses and income through the UI.
4. Open the budget page to set monthly limits for categories.
5. Review charts and monthly stats to track progress over time.

## Build and Test Commands

### Backend

```bash
c:/finance-tracker/.venv/Scripts/python.exe manage.py test
```

### Frontend

```bash
cd frontend
npm run build
```

## Troubleshooting

- If the frontend cannot connect to the backend, confirm that the Django server is running on port 8000.
- If the demo login fails, run the seed command again and verify the backend is active.
- If PowerShell blocks npm scripts, use `npm.cmd`.
- If you see a missing table error, run migrations again.

## Notes

- The app uses SQLite for local development.
- Authentication tokens are stored locally by the backend.
- Budget settings are handled through the Manage Budgets page and the Monthly Budget Setup card.

## License

This project is intended for educational and personal finance tracking use.
