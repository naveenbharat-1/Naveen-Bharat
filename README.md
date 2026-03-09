# Sadhguru Coaching Centre - LMS Platform

> A modern Learning Management System built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- A Supabase project (already configured)

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Build for Production
```bash
npm run build
```
The output will be in the `dist/` folder.

### Preview Production Build Locally
```bash
npm run preview
```

---

## 📦 Deployment on Replit

### Step 1: Import the Repository
1. Go to [replit.com](https://replit.com) and click **"Create Repl"**.
2. Choose **"Import from GitHub"** and paste your repo URL.
3. Select **"Node.js"** as the language/template.

### Step 2: Configure the Repl
In the **Shell**, run:
```bash
npm install
npm run build
```

### Step 3: Set the Run Command
In your `.replit` file or Replit's "Run" configuration, set:
```
run = "npx serve dist -s -l 3000"
```
This serves the built static files with client-side routing support.

### Step 4: Environment Variables
The Supabase credentials are configured in `src/integrations/supabase/client.ts`. No additional environment variables needed for basic deployment.

### Step 5: Deploy
Click the **"Run"** button. Replit will serve your app on a public `.repl.co` URL.

For a custom domain, use Replit's **Deployments** feature (paid plan).

---

## 🏗 Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **State:** React Query + Context API

### Key Features
- **Student UI:** Breadcrumb navigation, tabbed content filtering (All/Lectures/Notes/Tests), smart Google Drive/PDF viewer with inline embeds
- **Admin Panel:** Course management with thumbnail uploads, 5-type content upload (Video/PDF/DPP/Notes/Test), real-time dashboard stats from Supabase, payment approval workflow
- **Performance:** React.memo on list items, lazy-loaded routes, optimized React Query caching

### Content Types
| Type | DB Value | Description |
|------|----------|-------------|
| Lecture | `VIDEO` | YouTube/video URL |
| PDF | `PDF` | Uploaded PDF file |
| DPP | `DPP` | Daily Practice Problems |
| Notes | `NOTES` | Study notes/files |
| Test | `TEST` | External test URL |

### Database (Supabase)
Key tables: `courses`, `lessons`, `chapters`, `enrollments`, `profiles`, `payment_requests`, `user_progress`, `lecture_notes`

All tables have Row-Level Security (RLS) policies configured.

---

## 📁 Project Structure
```
src/
├── components/     # Reusable UI components
│   ├── course/     # Course-specific (Breadcrumbs, LectureCard, DriveEmbedViewer)
│   ├── lecture/    # Lecture view components
│   ├── video/      # Video players
│   └── ui/         # shadcn/ui primitives
├── contexts/       # Auth, Theme, Batch contexts
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client & types
├── pages/          # Route pages
└── lib/            # Utilities
```

## License
Private - Mahima Academy
