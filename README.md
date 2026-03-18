# NEU Library Visitor Log

A full-stack web application for managing library 
visitor logs at New Era University (NEU).

## 🌐 Live Application
[https://neu-library-visitor-log-omega.vercel.app](https://neu-library-visitor-log-omega.vercel.app)

## 📋 Features
- Google Sign-In (NEU accounts only)
- Student ID / RFID quick check-in
- Role-based access (Admin & Regular User)
- Visitor log with reason for visit
- Admin dashboard with statistics
- Export to PDF
- Block/unblock users
- Real-time notifications

## 👤 Account Roles
- **Regular User** - Check-in with reason for visit
- **Admin** - View statistics, manage users, export PDF

## 🛠️ Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Firebase (Auth + Firestore)
- Vercel (Deployment)

## 🚀 Setup Instructions

1. Clone the repository
git clone https://github.com/JanReyValloyas/studio.git

2. Install dependencies
npm install

3. Create .env.local file
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

4. Run development server
npm run dev

## 📱 Pages
- `/` - Login page
- `/complete-profile` - First time profile setup
- `/checkin` - Quick check-in via Student ID
- `/dashboard` - User check-in page
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/analytics` - Visit analytics
- `/admin/settings` - Settings

## 🏫 Developed for
New Era University - Library Management System
© 2024 NEU
