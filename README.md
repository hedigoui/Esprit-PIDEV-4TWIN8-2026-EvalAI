# PI - Oral AI Performance Evaluation System

A full-stack web application for evaluating oral English performance using advanced AI technologies. The system compares two audio analysis approaches and provides comprehensive evaluation metrics with real-time feedback.

## 📊 Performance Comparison

**PI System Results (2.2x more accurate)**
- PI System: 8.85 MAE (Mean Absolute Error)
- Baseline: 19.72 MAE
- Scale: 0-100

The PI system uses AssemblyAI + DeepSeek for semantic analysis, achieving significantly better accuracy than traditional Whisper + ML approaches.

## ✨ Features

### For Students
- 🎤 **Real-time Audio Recording** - Record and analyze English speech
- 📊 **Performance Metrics** - Detailed evaluation scores and feedback
- 💬 **Messaging System** - Communicate with instructors
- 📝 **Reclamations** - Submit feedback and complaints
- 🔐 **User Profile** - Manage account settings and preferences
- 🌍 **Internationalization** - Support for multiple languages

### For Instructors
- 👥 **Student Management** - View and manage student progress
- 📈 **Performance Analytics** - Track student improvement over time
- 💬 **Real-time Messaging** - Direct communication with students
- 📋 **Reclamation Management** - Handle student complaints
- 🎯 **Dashboard** - Overview of class performance metrics

### For Admins
- 🔧 **System Management** - Manage all users and content
- 📊 **Advanced Analytics** - System-wide performance reports
- 👤 **User Administration** - Create, edit, and manage user accounts
- 🚨 **Complaint Management** - Review and resolve reclamations
- ⚙️ **Configuration** - System settings and preferences

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: MongoDB with TypeORM
- **Authentication**: Passport.js (JWT + OAuth2)
- **Real-time Communication**: Socket.IO
- **AI Services**: 
  - AssemblyAI (Audio Transcription)
  - DeepSeek (Semantic Analysis)
- **Email**: Nodemailer
- **Deployment**: Render

### Frontend
- **Framework**: React 19 + Vite
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **UI Components**: Lucide React Icons
- **Charts**: Recharts
- **Internationalization**: React-i18next
- **Real-time**: Socket.IO Client
- **PDF Export**: html2canvas, jsPDF
- **Routing**: React Router v7
- **Deployment**: Render (Static Site)

## 📁 Project Structure

```
pi/
├── back/                          # Backend (NestJS)
│   ├── src/
│   │   ├── app.module.ts         # Root module
│   │   ├── main.ts               # Bootstrap
│   │   ├── auth/                 # Authentication
│   │   ├── users/                # User management
│   │   ├── communication/        # Messaging & notifications
│   │   ├── reclamations/         # Complaint management
│   │   ├── oral-performance/     # AI evaluation logic
│   │   └── evaluation/           # Evaluation metrics
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── front/                         # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/            # Admin pages
│   │   │   ├── student/          # Student pages
│   │   │   ├── teacher/          # Instructor pages
│   │   │   └── ...
│   │   ├── components/           # Reusable components
│   │   ├── config/               # Configuration
│   │   ├── context/              # React Context
│   │   ├── styles/               # CSS modules
│   │   └── i18n/                 # Translations
│   ├── index.html
│   ├── vite.config.js
│   ├── .env
│   ├── .env.production
│   └── package.json
└── docker-compose.yaml           # Docker orchestration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd pi/back
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your credentials
   # Required:
   # - MONGODB_URI
   # - JWT_SECRET
   # - FRONTEND_URL
   # - AI service keys (AssemblyAI, DeepSeek, etc.)
   # - OAuth credentials (Google, GitHub)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd pi/front
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # .env (local development)
   VITE_API_URL=http://localhost:3000
   
   # .env.production (production build)
   VITE_API_URL=https://pi-backend-k23t.onrender.com
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# OAuth2 - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# OAuth2 - GitHub
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

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 📦 Build & Deployment

### Local Build
```bash
# Frontend
cd pi/front
npm run build
npm run preview

# Backend
cd pi/back
npm run build
```

### Deploy to Render

**Backend:**
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables
5. Deploy

**Frontend:**
1. Set build command: `VITE_API_URL=https://your-backend-url npm run build`
2. Set publish directory: `dist`
3. Add environment variable: `VITE_API_URL=https://your-backend-url`
4. Deploy

## 📝 Available Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run linter
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

## 🔑 Key Features

### Authentication
- **OAuth2 Integration**: Google & GitHub login
- **JWT Tokens**: Secure session management
- **Role-based Access**: Admin, Instructor, Student

### Real-time Communication
- **Socket.IO**: Live messaging and notifications
- **Real-time Updates**: Instant feedback on actions
- **Notification Center**: Alert system for events

### Audio Processing
- **AssemblyAI**: Professional audio transcription
- **DeepSeek AI**: Semantic analysis for better accuracy
- **Automatic Scoring**: Real-time performance metrics

### Accessibility
- **Multi-language Support**: English, French, Arabic
- **Voice Assistant**: Accessibility features
- **Dark Mode**: Theme customization

## 🧪 API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth
- `POST /auth/github` - GitHub OAuth

### Users
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update profile
- `POST /users/change-password` - Change password

### Reclamations
- `GET /reclamations` - List reclamations (Admin)
- `GET /reclamations/me` - Get user's reclamations
- `POST /reclamations` - Submit reclamation
- `PATCH /reclamations/:id/status` - Update reclamation status

### Communication
- `GET /communication/conversations` - Get conversations
- `POST /communication/messages` - Send message
- `GET /communication/notifications` - Get notifications

### Oral Performance
- `POST /oral-performance/evaluate` - Evaluate audio
- `GET /oral-performance/results` - Get evaluation results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Team

- **Developers**: Ahmed Fatnassi, Hedi Goui, Aziz Azizi, Hazem Charef
- **Project Type**: Full-stack Web Application
- **Status**: Production Ready

## 🐛 Troubleshooting

### Backend Connection Issues
- Verify MongoDB URI is correct
- Check if backend is running on the correct port
- Verify CORS settings in `main.ts`

### Frontend API Calls Failing
- Check `VITE_API_URL` environment variable
- Verify backend is running and accessible
- Check browser console for errors

### OAuth Issues
- Verify OAuth credentials in .env
- Ensure callback URLs match GitHub/Google OAuth settings
- Check CORS configuration

## 📚 Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Socket.IO Documentation](https://socket.io/docs/)

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Last Updated**: May 7, 2026
**Version**: 1.0.0
