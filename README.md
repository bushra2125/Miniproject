# 🍎 FruitQualityAI

**AI-Based Smart Fruit Sorting, Counting and Quality Assessment System**

An intelligent system that uses computer vision and machine learning to identify fruit varieties,
count fruits, and classify their quality as Healthy, Damaged, or Rotten — via image upload or
live ESP32-CAM integration.

---

## 🗂️ Project Structure

```
FruitQualityAI/
├── frontend/       # React + Vite (user interface)
├── backend/        # Python + FastAPI (REST API + AI + Firebase)
└── esp32/          # Future: ESP32-CAM live stream integration
```

---

## 🛠️ Technology Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React + Vite + JavaScript           |
| Backend    | Python + FastAPI + Uvicorn          |
| Database   | Firebase Firestore                  |
| AI / ML    | Trained fruit classification model  |
| Hardware   | ESP32-CAM (future integration)      |

---

## ✨ Planned Features

- 🍊 **Fruit Variety Identification** — Detect which type of fruit is in the image
- 🔢 **Automatic Fruit Counting** — Count individual fruits in a batch
- 🟢🟡🔴 **Quality Classification** — Healthy / Damaged / Rotten
- 🖼️ **Image Upload** — Manual upload via the web interface
- 📋 **Inspection History** — Browse past inspection records
- 📊 **Analytics Dashboard** — Charts and summaries of quality trends
- 📷 **ESP32-CAM Integration** — Real-time live camera feed (future)

---

## ⚙️ Setup Instructions (Beginner-Friendly)

### Prerequisites

Make sure you have the following installed before you begin:

- [Node.js](https://nodejs.org/) (v18 or newer) — for the frontend
- [Python](https://www.python.org/) (v3.10 or newer) — for the backend
- [Git](https://git-scm.com/) — for version control
- A [Firebase](https://console.firebase.google.com/) account — for the database

---

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd FruitQualityAI
```

---

### Step 2 — Set Up the Backend

```bash
# Navigate to the backend folder
cd backend

# Create a virtual environment (keeps dependencies isolated)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Copy the example file and fill in your own values
cp .env.example .env
```

Open `.env` in a text editor and fill in your Firebase project details.
**Never commit your `.env` file or Firebase service account key to Git.**

#### Run the Backend Server

```bash
uvicorn main:app --reload
```

The API will be available at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

---

### Step 3 — Set Up the Frontend

```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

---

### Step 4 — Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named **FruitQualityAI**
3. Enable **Cloud Firestore** (start in test mode for development)
4. Go to **Project Settings → Service Accounts**
5. Click **Generate new private key** — save the downloaded JSON file as
   `backend/core/firebase-service-account.json`
6. **Never commit this file to Git** (it is already listed in `.gitignore`)

---

### Step 5 — Add Your AI Model (Future)

1. Place your trained model file (`.h5`, `.pt`, `.tflite`, etc.) inside `backend/ml_models/`
2. Update `backend/services/ai_service.py` to load and use your model

---

## 🔒 Security Reminders

- Never share or commit your `.env` file
- Never share or commit your Firebase service account JSON key
- Model files in `ml_models/` are excluded from Git by default

---

## 📄 License

This project is for educational and personal use.
