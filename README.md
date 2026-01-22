# 🚀 AI-Powered Customer Support Platform

An enterprise-grade AI customer support platform built with React, Node.js, and Google Gemini AI. Features real-time streaming responses, document-based RAG, and a stunning glassmorphic dark UI.

![AI Support Platform](https://img.shields.io/badge/Status-Ready-green) ![Node.js](https://img.shields.io/badge/Node.js-18+-blue) ![React](https://img.shields.io/badge/React-18+-blue)

## ✨ Features

### 🔐 Authentication System
- Email/password registration with email verification (Brevo)
- Google OAuth integration
- Password reset flow
- JWT with refresh token rotation
- Account lockout after failed attempts

### 💬 AI Chat
- Real-time streaming responses (word-by-word like ChatGPT)
- Conversation history with MongoDB
- Context-aware responses using RAG
- Markdown support with syntax highlighting

### 📄 RAG Pipeline
- PDF, DOCX, TXT document processing
- Automatic text chunking
- Keyword-based semantic search
- Context injection into AI prompts

### 👨‍💼 Admin Dashboard
- Document upload and management
- FAQ creation and editing
- Role-based access control

### 🎨 Premium UI
- Glassmorphic dark theme
- Smooth animations (Framer Motion)
- Fully responsive design
- Custom scrollbars and styling

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB with Mongoose |
| **AI** | Google Gemini 1.5 Flash |
| **Email** | Brevo (Sendinblue) |
| **Auth** | JWT, Passport.js, Google OAuth |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Gemini API key
- Brevo API key (optional for email)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env`:

```env
# MongoDB Atlas - Get from mongodb.com/atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-support

# JWT Secrets - Generate random strings
JWT_SECRET=your-64-char-random-string
JWT_REFRESH_SECRET=your-other-64-char-random-string

# Google Gemini - Get from ai.google.dev
GEMINI_API_KEY=your-gemini-api-key

# Brevo Email (optional) - Get from brevo.com
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 4. Open Browser

Visit `http://localhost:5173`

## 📁 Project Structure

```
ai-support/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── stores/            # Zustand state
│   │   ├── services/          # API client
│   │   └── index.css          # Global styles
│   └── package.json
│
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, rate limit
│   │   └── app.js             # Entry point
│   └── package.json
│
└── README.md
```

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/google` | Google OAuth |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/conversations` | Create conversation |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/:id` | Get conversation |
| POST | `/api/chat/conversations/:id/stream` | Send message (streaming) |

### Documents (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Upload document |
| GET | `/api/documents` | List documents |
| DELETE | `/api/documents/:id` | Delete document |

### FAQs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/faqs` | Create FAQ (admin) |
| GET | `/api/faqs` | List FAQs |
| PUT | `/api/faqs/:id` | Update FAQ (admin) |
| DELETE | `/api/faqs/:id` | Delete FAQ (admin) |

## 🎯 Creating an Admin User

1. Register a new user normally
2. Connect to MongoDB and update the user:

```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin", isVerified: true } }
)
```

## 📝 License

MIT License - Feel free to use for any purpose.

---

Built with ❤️ for the AI Support Platform Assignment
