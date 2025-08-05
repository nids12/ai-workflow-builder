# AI Workflow Builder

A no-code/low-code platform to build, visualize, and run AI-powered document workflows with PDF upload, knowledge base, and LLM integration.

## Features

- Visual workflow builder (drag-and-drop nodes, connect edges)
- PDF upload and document Q&A
- Knowledge base with vector search (ChromaDB)
- LLM integration (Gemini, OpenAI, etc.)
- End-to-end React frontend and FastAPI backend
- PostgreSQL for document metadata

## Project Structure

```
ai-workflow-builder/
  backend/    # FastAPI backend, database, and API routes
  frontend/   # React frontend (workflow builder, chat, upload)
```

## Dockerized Deployment (Recommended)

### Prerequisites

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux).

### Build and Start All Services

```bash
# In the project root (where docker-compose.yml is)
docker-compose up --build
```

- This will build and start the backend, frontend, and PostgreSQL database in containers.

### Access the App

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Stopping the App

```bash
docker-compose down
```

---

## Setup Instructions (Manual, for development)

### 1. Clone the repository

```bash
git clone https://github.com/nids12/ai-workflow-builder.git
cd ai-workflow-builder
```

### 2. Backend Setup

- Create a `.env` file in `backend/` with your API keys and database URL (see `.env.example`).
- Install dependencies:
  ```bash
  cd backend
  pip install -r requirements.txt
  ```
- Run the backend:
  ```bash
  uvicorn main:app --reload
  ```

### 3. Frontend Setup

- Install dependencies:
  ```bash
  cd ../frontend
  npm install
  ```
- Start the frontend:
  ```bash
  npm start
  ```

### 4. Usage

- Open [http://localhost:3000](http://localhost:3000) for the frontend.
- Open [http://localhost:8000/docs](http://localhost:8000/docs) for backend API docs.

## Assignment Checklist

- [x] Visual workflow builder with node/edge editing
- [x] PDF upload and document Q&A
- [x] LLM integration
- [x] Database and vector search
- [x] All assignment features implemented

## License

MIT
