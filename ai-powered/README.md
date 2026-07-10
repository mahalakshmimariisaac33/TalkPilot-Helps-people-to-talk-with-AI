# InterviewPilot AI

A full-stack mock interview platform that simulates a **real face-to-face campus placement interview** with a human-like AI interviewer — not a chatbot.

## Features

- **3D animated HR interviewer** — lip sync, eye blinking, head movement, emotion-aware expressions
- **Natural Text-to-Speech** — male/female voice options, adjustable speaking speed
- **Speech-to-Text** — answer questions via microphone (Web Speech API)
- **Intelligent follow-ups** — AI analyzes answers and asks contextual next questions
- **Live transcript** — real-time conversation panel
- **Interview timer** — tracks session duration
- **Confidence & communication scoring** — per-answer and overall analysis
- **HR & Technical interview modes**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Three.js (@react-three/fiber) |
| Backend | Java 17, Spring Boot 3.2 |
| Database | MySQL (H2 in-memory for dev) |
| Speech | Web Speech API (STT + TTS) |
| AI | OpenAI-compatible LLM (optional) |

## Quick Start

### Prerequisites

- Node.js 18+
- Java 17+
- Maven 3.8+
- (Optional) Docker for MySQL
- Chrome or Edge (for speech APIs)

### 1. Start Database (optional — dev uses H2)

```bash
docker compose up -d
```

### 2. Start Backend

```bash
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080`. Dev profile uses in-memory H2 — no MySQL required.

For production MySQL, run without the `dev` profile:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=default
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### 4. Enable AI (optional)

Set your OpenAI API key for smarter questions and analysis:

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-your-key-here"

# Linux/macOS
export OPENAI_API_KEY=sk-your-key-here
```

Without an API key, the app uses built-in fallback interview scripts and heuristic scoring.

## Project Structure

```
ai-powered/
├── backend/          # Spring Boot REST API
├── frontend/         # React + Three.js UI
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews/start` | Start a new interview session |
| POST | `/api/interviews/{id}/answer` | Submit an answer, get next question |
| GET | `/api/interviews/{id}` | Get session state |
| GET | `/api/interviews/health` | Health check |

## Interview Flow

1. Configure name, role, interview type, interviewer voice, and speed
2. Enter the virtual interview room
3. The 3D interviewer speaks the opening question (TTS + lip sync)
4. You answer via microphone; speech is transcribed live
5. Click **Submit Answer** — AI analyzes your response
6. Interviewer reacts with expressions and asks a follow-up
7. After 6 questions, receive overall feedback and scores

## Browser Notes

- **Microphone** is required for speech input
- **Camera** is optional (webcam preview)
- Best experience in **Chrome** or **Edge** (Web Speech API support)
- Allow microphone permissions when prompted

## License

MIT
