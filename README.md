# NewTrivia 🎮

NewTrivia is a full-stack, AI-powered real-time trivia game platform. It allows users to generate custom quizzes on any topic using Google Gemini, host games for friends or students, and compete in real-time with live leaderboards.

## ✨ Features

- **🧠 AI-Powered Quiz Generation**: Create custom quizzes instantly on any topic with adjustable difficulty and question quantity using Google Gemini Pro.
- **⚡ Real-time Multiplayer**: Synchronized gameplay across all players using WebSockets for a seamless competitive experience.
- **🏠 Host Dashboard**: Complete control over game flow, including question timing, intermission periods, and host-controlled progression.
- **🔐 Secure Authentication**: Integrated with Clerk for robust user management and social logins.
- **🏆 Dynamic Leaderboards**: Interactive podium views and rank reveal animations at the end of every game.
- **🎨 Visual Avatars**: Personalized player avatars powered by DiceBear.
- **📜 Game History**: Track previous game sessions, participants, and final rankings.

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy with SQLite
- **Real-time**: WebSockets
- **AI Integration**: Google GenAI (Gemini)
- **Auth**: Clerk Backend API

### **Frontend**
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Auth**: Clerk React SDK
- **Icons/Avatars**: DiceBear
- **Routing**: React Router

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- npm (or yarn/pnpm)
- [Clerk Account](https://clerk.com/) (for API keys)
- [Google AI Studio API Key](https://aistudio.google.com/) (for Gemini)

---

### **1. Backend Setup**

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   # Using uv (recommended)
   uv sync

   # Or using standard pip
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   ALLOW_ORIGINS=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=sqlite:///./trivia.db
   ```
4. Start the server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

---

### **2. Frontend Setup**

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

---

## 🏗️ Architecture

- **`backend/`**: Contains the FastAPI server, database models, game management logic, and AI integration utilities.
- **`frontend/`**: Contains the React application, organized by components, contexts, and pages for better maintainability.
- **`game_manager.py`**: The heart of the real-time logic, managing room states and broadcasting messages to players and hosts.

## 📝 License

This project is licensed under the MIT License.
