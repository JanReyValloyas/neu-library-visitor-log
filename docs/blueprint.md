# **App Name**: NEU Library Visitor Log

## Core Features:

- Authentication & User Management: Secure Firebase Google Sign-In with automatic user profile creation in Firestore on first login, including user blocking logic.
- Role-Based Access Control (RBAC): Implementation of 'user' and 'admin' roles stored in Firestore, ensuring protected routes for administrators and a custom 'useAuth' hook for access checks.
- User Profile Onboarding: A dedicated page to collect essential user profile details (program, college, employee status) upon their first successful login.
- Visitor Log System: Allows logged-in users to log their visits to the library by selecting a reason from a dropdown, with an 'Other' text input, and viewing their personal visit history.
- Admin Visits Dashboard & Reporting: A comprehensive dashboard for administrators showing global visit statistics, a detailed table of all visits with extensive filtering and sorting options, and PDF export functionality.
- Admin User Control Panel: Empowers administrators to view and manage all registered users, including toggling their roles between 'user' and 'admin' and blocking/unblocking user access.
- AI Visit Reason Classifier Tool: A generative AI tool designed to assist administrators by processing free-text 'Other' visit reasons into more structured and standardized categories for improved analytics and reporting.

## Style Guidelines:

- Primary Brand Color (UI Elements): A deep Navy Blue (#1a237e). This color brings professionalism and will be used for interactive elements like buttons, primary headings, and key accents. It's explicitly provided from NEU branding.
- Accent Brand Color (Highlights): A vibrant Gold (#ffd700). This color will be used for crucial calls to action, selected states, and highlights to provide strong visual contrast and alignment with NEU branding. It's explicitly provided from NEU branding.
- Background Color (Base): A very light, desaturated blue-gray (#f0f4f5). This subtle, almost white background harmonizes with the Navy Blue primary, maintaining a clean and professional appearance suitable for an academic context, and was derived to share its hue with the primary color while being very light and desaturated.
- Headline and Body Font: 'Inter' (sans-serif). A highly legible and modern sans-serif font ideal for extensive data displays, forms, and general readability across the application, suitable for both headlines and body text due to its versatile design.
- Icons: Use icons exclusively from the 'lucide-react' library for a consistent and professional visual language throughout the application.
- Responsiveness: The application layout will be fully responsive using Tailwind CSS and ShadCN UI components, ensuring optimal viewing and interaction on all device sizes.
- Transitions & Loaders: Implement subtle loading spinners and gentle transition animations for data fetching states and UI element changes to enhance user experience.