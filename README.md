# EduTrack — Cloud-Based Student Record Management System

## Overview
EduTrack is a modern, responsive, and robust student record management system designed for educational institutions. It allows administrators and staff to seamlessly manage student details, course enrollments, and academic grades with ease. Built without file uploads, it offers a clean, secure, and deployment-friendly architecture.

## Features
- Full CRUD for student records (Personal details, Academic info, Address, Guardian).
- JWT-based login with Admin and Staff roles.
- Course management and student enrollment system.
- Grade entry with automatic GPA computation and letter grade assignment.
- Advanced search, filter, and sort capabilities on the student list.
- Dashboard with dynamic charts (bar + pie) using `recharts`.
- CSV export of student records (admin only feature).
- Reports page with detailed analytics (admin only feature).
- Responsive, modern UI using Tailwind CSS and `react-hook-form` + `yup` validation.
- Secure backend with rate limiting and security headers (`helmet`).
- No file uploads — clean, deployment-friendly architecture.

## Tech Stack
| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, React Router v6, TailwindCSS, React Hook Form, Yup, Recharts, Axios |
| **Backend** | Node.js, Express.js, JWT Authentication, bcryptjs, express-validator, helmet, morgan |
| **Database** | MongoDB Atlas via Mongoose ODM |
| **Export** | json2csv |

## Local Setup
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd student-record-system
   ```
2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file (see Environment Variables section below)
   npm run seed # Populate database with sample data
   npm run dev
   ```
3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## Environment Variables
Create a `.env` file in the `backend` directory with the following configuration:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | The port the backend server runs on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://<user>:<password>@cluster0...` |
| `JWT_SECRET` | Secret key for JWT signing | `your_strong_jwt_secret_here` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

## API Reference

| Method | Route | Auth | Role | Description |
| --- | --- | --- | --- | --- |
| **POST** | `/api/auth/register` | None | Any | Register a new user |
| **POST** | `/api/auth/login` | None | Any | Login and receive JWT |
| **GET** | `/api/auth/me` | Required | Any | Get current user profile |
| **GET** | `/api/students` | Required | Any | Get students with pagination & filters |
| **POST** | `/api/students` | Required | Any | Create a new student |
| **GET** | `/api/students/stats/overview` | Required | Any | Get dashboard stats & charts data |
| **GET** | `/api/students/export/csv` | Required | Admin | Download students CSV |
| **GET** | `/api/students/:id` | Required | Any | Get student details |
| **PUT** | `/api/students/:id` | Required | Any | Update student details |
| **DELETE** | `/api/students/:id` | Required | Admin | Delete student |
| **POST** | `/api/students/:id/enroll/:courseId` | Required | Any | Enroll student in a course |
| **DELETE** | `/api/students/:id/enroll/:courseId` | Required | Any | Unenroll student from a course |
| **GET** | `/api/courses` | Required | Any | Get all courses |
| **GET** | `/api/courses/:id` | Required | Any | Get course details |
| **POST** | `/api/courses` | Required | Admin | Create a new course |
| **PUT** | `/api/courses/:id` | Required | Admin | Update a course |
| **DELETE** | `/api/courses/:id` | Required | Admin | Delete a course |
| **GET** | `/api/grades/student/:studentId` | Required | Any | Get all grades for a student |
| **GET** | `/api/grades/report/:studentId` | Required | Any | Get full grade report + GPA |
| **POST** | `/api/grades` | Required | Any | Create or update a grade |
| **PUT** | `/api/grades/:id` | Required | Any | Update a specific grade |
| **DELETE** | `/api/grades/:id` | Required | Admin | Delete a grade |

## Deployment Guide

### GitHub
1. Initialize git and commit all code.
2. Push to your GitHub repository.

### Azure Backend (App Service)
1. Create an **App Service** (Node 18 LTS, Linux).
2. Set all environment variables (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL`) in **Configuration -> Application Settings**.
3. Under **Deployment Center**, link your GitHub repo and select the `/backend` folder.
4. Set the **Startup Command** to `node server.js` or `npm start`.
5. Test the deployment by visiting `GET https://<your-backend-app>.azurewebsites.net/api/health`.

### Azure Frontend (Static Web App)
1. Create a **Static Web App** (Free tier is sufficient).
2. Link your GitHub repo.
3. Set **App location** to `/frontend`.
4. Set **Build command** to `npm run build`.
5. Set **Output location** to `dist`.
6. GitHub Actions CI/CD will be auto-configured.
7. SPA routing is automatically handled by the `staticwebapp.config.json` file in `/frontend/public`.

### Post-Deploy Steps
- Ensure to update the `CLIENT_URL` in the backend App Settings to your frontend Azure URL.
- Run the seed command `node seedData.js` (either locally pointing to the production DB, or via Azure console) to create initial data and users.
- Login using the generated credentials: `admin@edutrack.com` / `Admin@123`.
