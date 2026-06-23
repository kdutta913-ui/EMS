Employee Management System (EMS)

A unified multi-role workplace platform that brings together HR operations, finance management, team collaboration, real-time communication, and AI-powered analytics into a single application. Built with the MERN stack and a Python/Flask AI microservice, EMS supports six distinct user roles — Super Admin, Company Admin, HR, Finance, Team Lead, and Employee — each with a dedicated dashboard and role-specific capabilities.


Features Overview

Multi-Role Dashboards
Each role has its own dashboard with tailored views and permissions. Super Admins manage companies across the platform; Company Admins configure company settings and manage departments; HR handles employee lifecycle; Finance manages payroll and expenses; Team Leads oversee their teams and schedules; Employees access their own data and requests.

Employee Management
Register, view, and manage employees with department assignment, profile management, and role-based access control.

Attendance & Scheduling
Employees can check in/out via the dashboard. Team Leads and HR can view attendance records and manage work schedules.

Leave Management
Employees submit leave requests; HR reviews and approves or rejects them with full leave balance tracking.

Payroll & Finance
Payroll generation, payslip management, expense claims, reimbursements, tax handling, and financial reports — all managed through the Finance role dashboard.

Task Management
Team Leads create and assign tasks to team members. Employees track and update task status from their dashboard.

Performance Management
Performance reviews and ratings are managed by Team Leads and HR, with employee-visible performance summaries.

Training & Development
HR can create training programs and assign them to employees, who can track their training progress.

Onboarding & Offboarding
Checklist-driven onboarding and offboarding workflows managed by HR.

Compliance & HR Documents
HR can upload, manage, and track compliance records and HR documents.

Real-Time Chat
Built-in messaging with channels and direct messages powered by Socket.IO, supporting group and individual conversations across all roles.

AI Analytics (Python/Flask Microservice)
A dedicated AI service provides predictive insights using machine learning models (XGBoost, Gradient Boosting, Random Forest):

Attrition risk prediction
Leave pattern forecasting
Performance scoring
Payroll anomaly/fraud detection
Recruitment fit scoring
Company growth forecasting

Support Tickets
Employees can raise support tickets that are tracked and resolved within the platform.


Setup Instructions:

1. Clone the repository
git clone <repository-url>
cd HNB/EMS


2. Backend Setup
cd backend
npm install

Create a .env file using .env.example as a reference:
PORT=5000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/ems?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8001

Start the backend server:
npm run dev
The backend runs on http://localhost:5000


3. Frontend Setup
cd frontend
npm install
npm start
The frontend runs on http://localhost:3000


4. AI - Microservice setup
cd AI_Models
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate


pip install -r requirements.txt
The requirements.txt includes: pandas, numpy, scikit-learn, xgboost, joblib, flask, flask-cors, pymongo.


Train the ML models (only required on first run or after updating datasets):
python train_attrition.py
python train_leave.py
python train_performance.py
python train_payroll.py
python train_fraud.py
python train_recruitment.py
python train_company_growth.py

Start the AI service:
python api.py
The AI service runs on http://localhost:8001.


Run all three services on separate terminal.
Open http://localhost:3000 in your browser to access the application.
