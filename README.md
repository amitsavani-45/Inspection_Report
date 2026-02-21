# 📋 Setup & Patrol Inspection Report System

A full-stack web application for managing **Setup & Patrol Inspection Reports** used in manufacturing quality control. Built with **React** (frontend) and **Django REST Framework** (backend).



## 🖥️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React.js, React Router DOM        |
| Backend   | Django 4+, Django REST Framework  |
| Database  | SQLite (default) / PostgreSQL     |
| Styling   | Plain CSS (custom)                |



## 📁 Project Structure


project-root/
│
├── backend/                  # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── inspectionform/           # Django app
│   ├── models.py             # DB models: InspectionReport, InspectionItem, ScheduleEntry
│   ├── serializers.py        # DRF serializers
│   ├── views.py              # API ViewSets with filter support
│   ├── urls.py               # API routes
│   ├── admin.py
│   └── migrations/           # All DB migrations
│
└── src/                      # React frontend
    ├── App.js                # Main app — routing, state, API calls
    ├── Inspection.js         # Inspection report view (read-only display)
    ├── Inspection.css
    ├── Form.js               # Data entry form
    ├── Form.css
    ├── services/
    │   └── api.js            # Axios/fetch API service layer
    └── image/
        └── atomone.jpg       # Company logo


## ⚙️ Features

- 📄 **Setup & Patrol Inspection Report** — full printable report view
- 🔍 **Filter Reports** — by Date, Part Name, Operation Name, Customer Name
- 📅 **Header Date Fixed** — report header date stays locked to the originally loaded report, unaffected by filters
- 📋 **Form Entry** — add/update inspection items and schedule entries
- 🕐 **Schedule Table** — SETUP / 4HRS / LAST time slots with UP (row_order=0) and DOWN (row_order=1) rows
- 💾 **Django REST API** — full CRUD for reports, items, and schedule entries
- 🖨️ **Print Ready** — `.no-print` class hides UI controls during print



## 🗄️ Database Models

### `InspectionReport`
Stores report metadata — doc number, date, part info, customer name.

### `InspectionItem`
Stores inspection items linked to a report — SR no, item name, spec, tolerance, instrument.  
- SR 1–10 → **Product** items  
- SR 11–20 → **Process** items

### `ScheduleEntry`
Stores schedule measurement data — time slot (SETUP/4HRS/LAST), row order (UP=0/DOWN=1), up to 14 measured values per row.

---

## 🚀 Getting Started

### 1. Backend Setup (Django)

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers

# Run migrations
python manage.py migrate

# Start backend server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`



### 2. Frontend Setup (React)

```bash
# Install dependencies
npm install

# Start React dev server
npm start
```

Frontend runs at: `http://localhost:3000`



## 🔌 API Endpoints

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/reports/`             | List all reports (supports filters)|
| GET    | `/api/reports/?date=YYYY-MM-DD` | Filter by date                 |
| GET    | `/api/reports/?part_name=X` | Filter by part name                |
| GET    | `/api/reports/?operation_name=X` | Filter by operation           |
| GET    | `/api/reports/?customer_name=X`  | Filter by customer            |
| GET    | `/api/reports/{id}/`        | Get single report with full data   |
| POST   | `/api/reports/`             | Create new report                  |
| PUT    | `/api/reports/{id}/`        | Update full report                 |
| DELETE | `/api/reports/{id}/`        | Delete report                      |



## 🔄 Recent Updates

### ✅ Header Date Fix
- The `DATE` field in the report header is now **permanently fixed** to the date of the first loaded report.
- Uses `localStorage` to persist the date across filter changes and component re-renders/remounts.
- Filtering by date or any other field no longer affects the header date display.
- `localStorage` key `headerDate` is cleared only on **Filter Reset**.

### ✅ Schedule Table — UP/DOWN Row Logic
- Each time slot (SETUP, 4HRS, LAST) has **2 rows**: UP (`row_order=0`) and DOWN (`row_order=1`).
- Total 6 rows per SR entry — matches Django `ScheduleEntry` model exactly.
- `SLOT_ORDER` array in `Inspection.js` defines the correct render order.

### ✅ Filter Panel
- Filter by: **Date**, **Part Name**, **Operation Name**, **Customer Name**
- Active filter indicator (●) shown on filter button
- Filter date is independent of header display date

### ✅ Logo Brightness
- Company logo (`atomone.jpg`) supports CSS `brightness` filter for display contrast control.



## 🖨️ Print Support

The UI buttons (Filter, Form) are hidden during print via `.no-print` CSS class.  
To print, use browser `Ctrl+P` or `Cmd+P`.



## 📌 Notes

- CORS is configured to allow React (`localhost:3000`) to connect to Django (`localhost:8000`).
- `ALLOWED_HOSTS = ['*']` is set for development — restrict in production.
- All API calls are centralized in `src/services/api.js`.
