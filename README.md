# 🚀 SkySource / Rudra Checklist System

![Status](https://img.shields.io/badge/status-production-green)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Supabase%20%7C%20Node-blue)
![Version](https://img.shields.io/badge/version-1.0-purple)
![License](https://img.shields.io/badge/license-internal-lightgrey)

A professional internal **insurance verification platform** designed to
compare **Policy documents with ACORD forms** and generate structured
checklist reports with full **audit trail tracking**.

This system helps insurance teams validate policies faster, reduce
manual errors, and maintain compliance documentation.

------------------------------------------------------------------------

# 🌟 Key Highlights

• Policy vs ACORD validation engine\
• Smart checklist workflow\
• Admin management dashboard\
• Full activity & audit logging\
• Role‑based access control\
• Clean report & Excel export\
• Designed for internal insurance operations

------------------------------------------------------------------------

# 🧠 System Workflow

``` mermaid
flowchart LR
A[Upload Policy] --> B[Upload ACORD Forms]
B --> C[Checklist Validation]
C --> D[Mark Match / Not Match / N/A]
D --> E[Generate Report]
E --> F[Save Activity Log]
F --> G[Admin Audit Trail]
```

------------------------------------------------------------------------

# 🏗 System Architecture

``` mermaid
flowchart TB
UI[Next.js Frontend]

API[Next.js API Routes]

DB[(Supabase PostgreSQL)]

AUTH[Auth & Session]

REPORT[Report Generator]

UI --> API
API --> DB
API --> AUTH
API --> REPORT
```

------------------------------------------------------------------------

# ✨ Features

## 📄 Policy vs ACORD Matching

Users compare policy information against multiple ACORD forms using
structured checklist rules.

Checklist status options:

  Status         Meaning
  -------------- ---------------------
  ✅ Match       Data matches policy
  ❌ Not Match   Data mismatch
  🔍 Not Found   Data missing
  ⚪ N/A         Not applicable

------------------------------------------------------------------------

## 👨‍💼 Admin Dashboard

Admins can:

• Manage users\
• Configure Lines of Business (LOB)\
• View audit logs\
• Monitor system usage\
• Manage checklist configurations

------------------------------------------------------------------------

## 🔐 Role Based Access

  Role           Permissions
  -------------- --------------------------------
  Master Admin   Full system control
  Admin          Manage users and configuration
  User           Perform checklist verification

------------------------------------------------------------------------

## 📊 Audit Trail

Every system action is recorded:

• Login events\
• Checklist updates\
• Data modifications\
• Admin actions

This ensures full traceability of operations.

------------------------------------------------------------------------

# 📊 Report Generation

The system supports multiple report formats:

• Clean report view\
• Excel export\
• Printable report view\
• Snapshot references

------------------------------------------------------------------------

# 🧰 Technology Stack

## Frontend

• Next.js\
• React\
• JavaScript\
• CSS

## Backend

• Node.js\
• Next.js API Routes

## Database

• Supabase (PostgreSQL)

## Deployment

• Vercel (recommended)

------------------------------------------------------------------------

# 📁 Project Structure

    pages/
       api/
          auth/
          users.js
          lobs.js
          audit.js
          activity.js

    lib/
       supabase.js
       session.js

    styles/
       global.css

    README.md
    .env.local
    package.json

------------------------------------------------------------------------

# 🗄 Database Tables

  Table          Purpose
  -------------- ------------------------
  users          System users and roles
  checklists     Checklist data
  lobs           Lines of Business
  audit_trail    System audit log
  activity_log   User activity history

------------------------------------------------------------------------

# ⚙️ Environment Variables

Create `.env.local`

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

------------------------------------------------------------------------

# 🖥 Installation

Clone repository

    git clone https://github.com/your-repo/skysource-checklist.git

Install dependencies

    npm install

Run development server

    npm run dev

Open in browser

    http://localhost:3000

------------------------------------------------------------------------

# 🚀 Deployment

Recommended platform: **Vercel**

Deployment steps:

1.  Push repository to GitHub
2.  Connect repository in Vercel
3.  Add environment variables
4.  Deploy

------------------------------------------------------------------------

# 🔒 Security Features

• Role based permissions\
• Protected API routes\
• Server‑side validation\
• Activity logging\
• Admin controls

------------------------------------------------------------------------

# 📈 Future Roadmap

Planned upgrades:

• AI policy validation assistant\
• OCR extraction from policy PDFs\
• Advanced discrepancy detection\
• Analytics dashboard\
• Multi‑office deployment

------------------------------------------------------------------------

# 👨‍💻 Author

**Rudra Bhatt**

Creator of the **SkySource / Checklist System**.

The platform was developed to improve productivity and accuracy in
insurance policy verification workflows.

------------------------------------------------------------------------

⭐ Internal enterprise tool for operational workflow automation
