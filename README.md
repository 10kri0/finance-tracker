# SpendWise Finance Tracker

Version: 1.2.0  
Last Updated: 2026-08-05 UTC 11:00:00 AM

SpendWise is a full-stack personal finance tracker built with Django and React. It helps users manage income, expenses, monthly budgets, category trends, account balances, and downloadable financial reports.

## Key Features

- Secure email-based authentication and profile management
- Dashboard with summary cards, monthly stats, charts, and recent transactions
- Expense and income entry with monthly organization
- Budget management with category-level editing and protected balance categories
- Light and dark theme support
- **Downloads** tab in the dashboard header for custom date-range reports
- PDF (`.pdf`) reports containing the selected range, financial summary, budget overview, income, and expenses
- Excel (`.xlsx`) workbooks with Summary, Budget, Income, and Expenses worksheets
- Clear feedback when the selected date range has no income or expense data
- Demo access for quick testing:
  - Email: `demo@finance.com`
  - Password: `demo1234`

## Recent Updates (August 2026)

- Added the **Downloads** header tab. Users select a start date and end date, then download only the matching transactions.
- Added on-demand PDF and Excel generation. The report libraries are loaded only when a download is requested, keeping the main dashboard bundle smaller.
- Added server-side date filtering to the expenses and incomes APIs.
- Removed unused Django REST Framework and django-cors-headers requirements; the app uses Django views and its own CORS middleware.

## Technology Stack

- Backend: Python, Django, MongoDB Atlas (official Django MongoDB backend)
- Frontend: React 18, Vite 5, React Router 6, Recharts, jsPDF, jsPDF-AutoTable, SheetJS (xlsx)
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
│   │   ├── components/CustomDownloadSection.jsx
│   │   └── utils/exportReport.js
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Backend Setup

From the project root:

```bash
cd backend
c:/finance-tracker/.venv/Scripts/python.exe -m pip install -r requirements.txt
c:/finance-tracker/.venv/Scripts/python.exe manage.py migrate
c:/finance-tracker/.venv/Scripts/python.exe manage.py seed_data
c:/finance-tracker/.venv/Scripts/python.exe manage.py runserver
```

MongoDB is configured with the `MONGODB_URI` value in the project-root `.env` file. If the URI does not name a database, the app uses `spendwise`; optionally set `MONGODB_DATABASE` to override it.

### Migrating Existing SQLite Data

The old `backend/db.sqlite3` is preserved as a backup. After running MongoDB migrations, import its existing users and finance records once with:

```bash
cd backend
c:/finance-tracker/.venv/Scripts/python.exe manage.py migrate_sqlite_to_mongodb
```

The importer is idempotent and records imported legacy IDs, so rerunning it does not duplicate transactions.

The seed command creates the demo user and sample finance data, including starter categories, months, expenses, and incomes.

### Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The application is available at <http://localhost:5173>.

## Downloading Reports

1. Sign in and select **Downloads** from the dashboard header.
2. Choose an inclusive start date and end date.
3. Select **Download PDF** or **Download Excel**.

The selected range must contain at least one income or expense. PDF and Excel files are generated in the browser and download automatically; they are not stored by the backend.

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
- `GET`, `POST /api/expenses/`
- `GET /api/expenses/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET`, `POST /api/incomes/`
- `GET /api/incomes/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET`, `POST /api/categories/`
- `PUT`, `DELETE /api/categories/<id>/`

Date filters are optional, must use ISO dates (`YYYY-MM-DD`), and require a start date no later than the end date.

## Typical User Flow

1. Register or sign in with an email and password.
2. Review the current month on the dashboard overview.
3. Add expenses and income through the UI.
4. Open the budget page to set monthly limits for categories.
5. Open **Downloads**, choose a date range, and export a PDF or Excel report.
6. Review charts and monthly stats to track progress over time.

## Build and Test Commands

### Backend

```bash
c:/finance-tracker/.venv/Scripts/python.exe manage.py check
c:/finance-tracker/.venv/Scripts/python.exe manage.py test
```

### Frontend

```bash
cd frontend
npm run build
```

## Troubleshooting

- If the frontend cannot connect to the backend, confirm that Django is running on port 8000.
- If the demo login fails, run the seed command again and verify the backend is active.
- If PowerShell blocks npm scripts, use `npm.cmd`.
- If a custom download reports no data, verify that transactions exist in the selected inclusive date range.
- If you see a missing table error, run migrations again.

## License

This project is intended for educational and personal finance tracking use.
