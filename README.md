# SpendWise Finance Tracker

SpendWise is a full-stack personal finance tracker built with Django and React. It helps you manage income, expenses, monthly budgets, category trends, and account balances in one place.

## Features

- User registration, login, logout, and profile management
- Dashboard with summary cards, monthly stats, charts, and recent transactions
- Add and manage expenses and income
- Budget management with a dedicated monthly budget setup card
- Protected balance categories such as savings and cash spending
- Light and dark theme support
- Demo access with the credentials:
  - Email: demo@finance.com
  - Password: demo1234

## Tech Stack

- Backend: Python, Django, SQLite
- Frontend: React, Vite, React Router, Recharts
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

### 1. Backend setup

From the project root:

```bash
cd backend
c:/finance-tracker/.venv/Scripts/python.exe manage.py migrate
c:/finance-tracker/.venv/Scripts/python.exe manage.py seed_data
c:/finance-tracker/.venv/Scripts/python.exe manage.py runserver
```

The seed command creates the demo user and sample finance data.

### 2. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

- http://localhost:5173

## API Overview

All API endpoints are prefixed with `/api/`.

### Auth

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `PUT /api/auth/update-profile/`
- `PUT /api/auth/change-password/`

### Dashboard and Data

- `GET /api/dashboard/`
- `GET /api/expenses/`
- `POST /api/expenses/`
- `GET /api/incomes/`
- `POST /api/incomes/`
- `GET /api/categories/`
- `POST /api/categories/`
- `PUT /api/categories/<id>/`
- `DELETE /api/categories/<id>/`

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

- If the frontend cannot connect to the backend, make sure the Django server is running on port 8000.
- If the demo login fails, run the seed command again.
- If Windows PowerShell blocks npm scripts, use `npm.cmd`.
- If you see a missing table error, run migrations again.

## Notes

- The app uses SQLite for local development.
- The backend stores authentication tokens in a local JSON file.
- Budget changes are managed through the Manage Budgets page and the new Monthly Budget Setup card.
