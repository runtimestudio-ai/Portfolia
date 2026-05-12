

# 🚀 Portfolia – Smart Internship Portfolio Builder

**Portfolia** is a futuristic, AI-powered platform that helps users create stunning, professional portfolios by importing internship projects, extracting key skills, and generating AI-enhanced descriptions. Built with cutting-edge frontend design and scalable backend APIs.

---

## 📦 Tech Stack

### 🖥️ Frontend

* **Framework**: React (Vite) + TypeScript
* **Styling**: TailwindCSS (SaaS-like glassmorphism + neumorphism)
* **UI Framework**: ShadCN-style reusable components
* **Routing**: React Router
* **State Management**: Context API (if needed)

### ⚙️ Backend

* **Framework**: FastAPI (Python)
* **Database**: PostgreSQL
* **ORM**: SQLAlchemy
* **API Auth**: GitHub API with Personal Access Token
* **LLM Integration**: OpenAI or other LLMs (in progress)
* **Environment Config**: `.env` based setup

---

## 🎯 Features

### 🔗 GitHub Integration

* Import public internship/project repos
* Fetch details like name, stars, forks, description, and README content
* Extract live deployed URL if mentioned in the README
* Secure GitHub API usage via `.env`

### 🧠 AI-Powered Enhancements (LLM)

* **Smart Portfolio Co-Pilot**: Real-time analysis of your portfolio content with tailored suggestions based on your target role.
* **AI-Enhanced Descriptions**: Generate professional, ATS-optimized project descriptions with multiple variants (Short, Medium, Long).
* **Automated Tech Stack Extraction**: Identifies and tags technologies directly from project data.
* **Resume Intelligence**: Parses PDFs to extract achievements and skills with AI-driven proficiency tagging.

### 📄 Portfolio Builder

* **Dual-Pane Sidebar Editor**: A unified workspace combining manual CRUD forms and AI suggestions.
* **Interactive Live Preview**: Click-to-edit sections that automatically open and focus the sidebar editor.
* **Dynamic Template System**: High-fidelity templates (Classic, Modern, Creative) with real-time style switching.
* **Robust Data Management**: Integrated handling for Projects, Skills, Achievements, and Certifications.
* **Export & Sharing**: Export to PDF or share via a public URL (in progress).

### 🧩 Pages

* Landing Page
* Login / Signup
* Dashboard (Activity timeline, quick actions)
* Projects (GitHub/manual entries)
* Achievements (Resume parser + manual entry)
* Skills (AI + manual skills)
* Portfolio Preview (Live editable)
* Export Page
* Profile Page

---

## 📁 Folder Structure

```bash
Portfolia/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── utils/
│       └── App.tsx
├── backend/
│   ├── app/
│   │   ├── api/v1/routes/github.py
│   │   ├── schemas/github.py
│   │   ├── crud/github.py
│   │   └── db/models/
│   ├── main.py
│   └── .env  (GITHUB_API_TOKEN=...)
```

---

## 🔒 Security

* `.env` is ignored using `.gitignore`
* Secrets never exposed in repo history (BFG used if leaked)
* Token sharing guidelines for collaborators (local `.env` setup)

---

## 🧪 Testing Instructions

### 🖥️ Backend

```bash
# Setup
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run
uvicorn app.main:app --reload

# Example Endpoint
GET /api/v1/github/repo-info?repo_url=https://github.com/muneeb50/Dynamic-Scheduler-and-Route-Planner
```

### 💻 Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🤝 Team Roles

| Name     | Role                                     |
| -------- | ---------------------------------------- |
| Riyaz    | Frontend + Backend Lead + LLM Architect  |
| Ramitha  | Backend API Integration + AI             |

---

## 📌 Project Status

* ✅ Frontend UI & UX Overhaul Complete
* ✅ AI Assistant Sidebar & Dual-Pane Editor Integrated
* ✅ GitHub API Integration (Import, README Fetch)
* ✅ Groq AI Integration (Descriptions, Variants)
* ✅ Resume Parsing & Skill Detection
* 🔄 PDF Export & Public Sharing Implementation

---

## 📬 Setup for Collaborators

1. Clone the repo
2. Create `.env` in `/backend` with:

   ```
   GITHUB_API_TOKEN=your_token_here
   ```
3. Run backend + frontend separately as described above.

---

## 🏁 Final Goal

Create the **most visually explosive and intelligent internship portfolio builder** seen in hackathons — one that impresses recruiters, judges, and teammates alike.

---
