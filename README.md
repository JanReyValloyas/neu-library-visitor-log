# NEU Library Visitor Log

A full-stack web application for managing library visitor logs at NEU.

## Core Features
- **Firebase Authentication**: Google Sign-In with automated profile creation.
- **RBAC**: Role-Based Access Control (Admin and Regular User).
- **Visitor Logs**: Easy visit logging with standardized categories and AI-assisted classification.
- **Admin Dashboard**: Comprehensive statistics, visitor tables, and user management.
- **PDF Export**: Generate reports from visit data.
- **GenAI**: AI Classifier for "Other" visit reasons using Genkit and Gemini.

## Setup Instructions

1.  **Clone the repository**.
2.  **Environment Variables**: Create a `.env.local` file with your Firebase credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    GOOGLE_GENAI_API_KEY=your_gemini_key
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Run development server**:
    ```bash
    npm run dev
    ```

## Live Demo
App URL: [https://neu-library-log.vercel.app](https://neu-library-log.vercel.app) (Placeholder)

## Tech Stack
- Next.js 15 (App Router)
- Tailwind CSS
- ShadCN UI
- Firebase (Auth, Firestore)
- Genkit (AI Flows)
- Recharts
