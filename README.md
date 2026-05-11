# EvalAI — AI-Powered Oral Performance Assessment Platform

<div align="center">


![EvalAI](https://img.shields.io/badge/EvalAI-Oral%20Intelligence-DC2626?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-DC2626?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen?style=flat-square)
![Node](https://img.shields.io/badge/node-18%2B-339933?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/mongodb-Atlas-47A248?style=flat-square&logo=mongodb)

![EvalAI Logo](pi/front/public/logo.svg)

**AI-Supported Web Platform for Oral Performance Assessment**  

[Live Demo](https://evalai-wz24.onrender.com) · [API Docs](#api-endpoints) · [Quick Start](#getting-started)

</div>

---

## Overview

EvalAI was developed as part of the **PIDEV – 4th Year Engineering Program** at **Esprit School of Engineering** (Academic Year 2025–2026).

It is a full-stack web application that brings objective, scalable oral performance assessment to higher education. The platform combines two specialised AI engines — AssemblyAI for speech-layer analysis and DeepSeek for content and CEFR evaluation — into a single institutional tool used by students, instructors, and administrators.

**Benchmark result:** the EvalAI AI pipeline achieves a Mean Absolute Error of **8.85** vs. **19.72** for the Whisper + ML baseline — **2.2× more accurate** on a 0–100 scale.

---

## Features

### Student
- Real-time audio recording with waveform visualisation and live captions
- AI feedback: CEFR level, fluency, pronunciation, speaking pace, confidence
- Self-practice mode with full diagnostic report and improvement suggestions
- Submission history with session-by-session progress tracking
- Messaging with instructors and reclamation submission

### Instructor
- AI-assisted evaluation with five-dimension rubric (1–10 sliders)
- CEFR level selection with instructor override control
- Excel roster upload and export with CEFR results per student
- Class-level analytics dashboard and pending evaluation queue
- Real-time messaging with students

### Administrator
- Full user management (create, edit, suspend accounts)
- System-wide performance analytics and reports
- Reclamation review and resolution workflow
- Role-based access configuration

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| TypeScript | Static typing |
| React Router v7 | Client-side routing |
| Axios | HTTP client |
| Recharts | Data visualisation |
| Lucide React | Icon system |
| Socket.IO Client | Real-time communication |
| react-i18next | Internationalisation (EN · FR · AR) |
| html2canvas + jsPDF | PDF export |
| CSS Modules | Scoped styling |

### Backend
| Technology | Purpose |
|---|---|
| NestJS (Node.js + TypeScript) | API framework |
| MongoDB + Mongoose | Database and ODM |
| Passport.js (JWT + OAuth2) | Authentication |
| Socket.IO | Real-time events |
| Multer + GridFS | Audio file upload and storage |
| Nodemailer | Transactional email |

### AI Services
| Service | Role |
|---|---|
| AssemblyAI | Audio transcription with word-level timestamps |
| DeepSeek | CEFR classification, grammar, vocabulary, coherence |
| Whisper (local FastAPI) | Alternative transcription engine (EvalAI tab) |
| faster-whisper | Optimised local inference |

### Infrastructure
| Tool | Purpose |
|---|---|
| Render | Backend and frontend deployment |
| MongoDB Atlas | Cloud database |
| Docker + docker-compose | Local orchestration |
| GitHub Actions | CI/CD pipeline |

---

## Architecture

```
pi/
├── back/                          # Backend — NestJS
│   └── src/
│       ├── auth/                  # JWT + OAuth2 (Google, GitHub)
│       ├── users/                 # User management and profiles
│       ├── oral-performance/      # AI evaluation pipeline
│       ├── evaluation/            # CEFR scoring and metrics
│       ├── communication/         # Socket.IO messaging and notifications
│       └── reclamations/          # Complaint management
│
├── front/                         # Frontend — React + Vite
│   └── src/
│       ├── pages/
│       │   ├── admin/             # Admin dashboard and management
│       │   ├── student/           # Practice, dashboard, reports
│       │   └── teacher/           # Evaluate, EvalAI, dashboard
│       ├── components/            # Shared UI components
│       ├── hooks/                 # useAudioRecorder, useEvaluation, etc.
│       ├── context/               # Auth, notification, i18n providers
│       ├── styles/                # CSS modules and design system
│       └── i18n/                  # EN / FR / AR translation files
│
├── whisper-service/               # Local FastAPI — faster-whisper
│   ├── main.py                    # Transcription + speech metrics
│   └── evaluator.py               # CEFR rule-based fallback
│
└── docker-compose.yaml            # Full stack local orchestration
```

**AI Evaluation Pipeline:**

```
Audio input
    └─► AssemblyAI transcription (word timestamps)
            └─► DeepSeek content analysis
                    ├── CEFR classification (A1–C2)
                    ├── Grammar score (0–10)
                    ├── Vocabulary richness (B1/B2/C1 lexical bands)
                    ├── Coherence score
                    └── Holistic oral index (0–100)
                            └─► Instructor review + optional override
                                        └─► CEFR sent to student record
```

---

## Contributors

| Name | Role |
|---|---|
| Ahmed Fatnassi | Full-stack development, AI pipeline |
| Hedi Goui | Full-stack development, UI/UX |
| Aziz Azizi | Backend, authentication, deployment |
| Hazem Charef | Frontend, data visualisation, accessibility |

---

## Academic Context

Developed at **Esprit School of Engineering – Tunisia**  
PIDEV – 4TWIN | Academic Year 2025–2026  
Supervised by: *[RIM DOUSS]*

**Keywords:** oral assessment · CEFR · speech AI · NLP · AssemblyAI · DeepSeek · full-stack · NestJS · React · MongoDB

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Git

### Backend

```bash
# Clone the repository
git clone https://github.com/hedigoui/Esprit-PIDEV-4TWIN8-2026-EvalAI.git
cd evalai/back

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — see Environment Variables section below

# Start development server (port 3000)
npm run dev
```

### Frontend

```bash
cd evalai/front

# Install dependencies
npm install

# Start development server (port 5173)
npm run dev
```

### Whisper Service (optional — for EvalAI tab)

```bash
cd evalai/whisper-service
pip install -r requirements.txt
python main.py   # Runs on port 8000
```

### Docker (full stack)

```bash
docker-compose up --build
```

---

## Environment Variables

### Backend `.env`

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/evalai

# Authentication
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173

# OAuth2 — Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# OAuth2 — GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# AI Services
ASSEMBLYAI_API_KEY=your-assemblyai-key
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:3000
```

### Frontend `.env.production`

```env
VITE_API_URL=https://pi-backend-k23t.onrender.com
```

---

## Available Scripts

### Backend

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # ESLint
```

### Frontend

```bash
npm run dev          # Development server
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build locally
npm run lint         # ESLint
```

---

## API Endpoints

### Authentication
| Method | Route | Description |
|---|---|---|
| `GET` | `/auth/google` | Google OAuth redirect |
| `GET` | `/auth/github` | GitHub OAuth redirect |
| `POST` | `/auth/login` | Email + password login |
| `POST` | `/auth/register` | New user registration |

### Users
| Method | Route | Description |
|---|---|---|
| `GET` | `/users/profile` | Get authenticated user profile |
| `PATCH` | `/users/profile` | Update profile |
| `POST` | `/users/change-password` | Change password |
| `GET` | `/users/students` | List all students (instructor/admin) |

### Oral Performance
| Method | Route | Description |
|---|---|---|
| `POST` | `/oral-performances` | Create new performance record |
| `POST` | `/oral-performances/:id/audio` | Upload audio file |
| `GET` | `/oral-performances/:id` | Get performance details |
| `GET` | `/oral-performances` | List instructor performances |
| `PATCH` | `/oral-performances/:id/scores` | Update instructor scores |
| `PATCH` | `/oral-performances/:id/feedback` | Save feedback and CEFR |

### Communication
| Method | Route | Description |
|---|---|---|
| `GET` | `/communication/conversations` | Get all conversations |
| `POST` | `/communication/messages` | Send a message |
| `GET` | `/communication/notifications` | Get notifications |

### Reclamations
| Method | Route | Description |
|---|---|---|
| `GET` | `/reclamations` | List all reclamations (admin) |
| `GET` | `/reclamations/me` | Get current user's reclamations |
| `POST` | `/reclamations` | Submit a reclamation |
| `PATCH` | `/reclamations/:id/status` | Update reclamation status |

---

## Deployment

### Render — Backend

1. Push code to GitHub
2. Create a new **Web Service** on Render
3. Set build command: `npm run build`
4. Set start command: `npm run start`
5. Add all environment variables from `.env`

### Render — Frontend

1. Create a new **Static Site** on Render
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

---

## Performance

| Metric | Target | Achieved |
|---|---|---|
| AI MAE (0–100 scale) | < 15 | **8.85** |
| Baseline MAE | — | 19.72 (2.2× worse) |
| API response p95 | < 800 ms | ✅ |
| Frontend first paint | < 1.5 s | ✅ |
| AI transcription time | < 4 min | ✅ |
| Audio storage | Scalable | GridFS |

---

## Accessibility

EvalAI meets **WCAG 2.1 Level AA** standards:

- Full keyboard navigation and ARIA labels throughout
- High-contrast mode, font-size scaling (100% / 125% / 150%)
- Colour-blind filters: Deuteranopia, Protanopia, Tritanopia
- Screen reader optimised with semantic HTML5
- Voice assistant with Web Speech API (EN, FR, AR)
- RTL layout support for Arabic
- Keyboard shortcuts: `Alt+A` (accessibility panel), `Alt+L` (language switcher)

---

## Troubleshooting

**Backend not connecting**
- Verify `MONGODB_URI` is correct and the cluster allows your IP
- Check CORS config in `main.ts` — `FRONTEND_URL` must match exactly

**Frontend API calls failing**
- Confirm `VITE_API_URL` is set correctly for your environment
- Check browser console for CORS or network errors

**OAuth not working**
- Verify callback URLs in Google/GitHub OAuth app settings match `.env`
- Ensure `FRONTEND_URL` is whitelisted in OAuth app settings

**Audio upload failing**
- Check Multer file-size limits in the backend config
- Verify GridFS is configured for binary storage

---

##  Pilotage et Indicateurs (Analytics)

###  Indicateurs de Production

| Indicateur | Description |
|---|---|
| **Nombre total de repos publics** | Comptabiliser tous les dépôts publics du compte ou de l'organisation GitHub |
| **Nombre moyen de commits par projet** | Calculer `total des commits / nombre de projets` sur la période mesurée |

###  Indicateurs de Qualité

| Indicateur | Critères de conformité |
|---|---|
| **% de repos avec README structuré** | ✓ Titre · ✓ Description · ✓ Installation · ✓ Structure du projet · ✓ Contributing |
| **% de repos avec topics conformes** | ✓ esprit-school-of-engineering · ✓ academic-project · ✓ esprit-[PI] · ✓ Année universitaire · ✓ Technologie principale |

###  Indicateurs d'Impact

| Indicateur | Source |
|---|---|
| **Nombre total de stars** | GitHub profile · Additionner les stars de tous les dépôts publics |
| **Nombre de forks** | GitHub profile · Additionner les forks de tous les dépôts publics |
| **Nombre de clones** | GitHub Insights · Statistiques de trafic par dépôt |

### How to Track

1. Accéder à GitHub (profil ou organisation)
2. Auditer chaque dépôt public : **Code** > **Settings > General > About**
3. Valider README, topics, description et visibilité
4. Consulter **Insights** pour stars/forks/clones
5. Reporter les valeurs dans un tableau de suivi mensuel ou trimestriel

---

## Acknowledgments

- [AssemblyAI](https://www.assemblyai.com/) — audio transcription engine
- [DeepSeek](https://www.deepseek.com/) — LLM for content and CEFR evaluation
- [Council of Europe](https://www.coe.int/en/web/common-european-framework-reference-languages) — CEFR descriptor framework
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) — local ASR inference
- [NestJS](https://nestjs.com/) · [React](https://react.dev/) · [MongoDB Atlas](https://www.mongodb.com/atlas)

---

<div align="center">

**Esprit School of Engineering — PIDEV 4TWIN8 — 2025–2026**

Made with dedication by Ahmed Fatnassi · Hedi Goui · Aziz Azizi · Hazem Charef

</div>
