# Doordarshan

An open-source video conferencing application built with FastAPI, WebRTC, WebSockets, SQLAlchemy, and Alembic. It provides secure authentication, meeting management, participant management, room management, and WebRTC signaling through a scalable backend architecture.

## Features

- JWT Authentication
- Meeting & Room Management
- Participant Management
- WebRTC Signaling (WebSocket)
- PostgreSQL with SQLAlchemy
- Alembic Database Migrations
- Ready for Cloud Deployment

## Tech Stack

- Python 3.11+
- FastAPI
- WebSockets
- WebRTC
- SQLAlchemy
- Alembic
- PostgreSQL (Neon)
- Render
- Metered TURN

## Project Structure

```text
app/
client/
alembic/
.env.example
pyproject.toml
Makefile
```

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/aryanap07/doordarshan.git
cd doordarshan
```

### 2. Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate      # Linux/macOS
.venv\Scripts\activate         # Windows
```

### 3. Install Dependencies

```bash
pip install -e ".[dev]"
```

## Database (Neon)

1. Create a free Neon account.
2. Create a PostgreSQL project.
3. Copy the connection string.
4. Replace `DATABASE_URL` inside `.env`.

Example:

```env
DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST/DATABASE?sslmode=require' #+psycopg
```

## TURN Server (Metered)

1. Create a free Metered account.
2. Create a TURN application.
3. Copy the Username and Credential.
4. Update `.env`.

```env
METERED_USERNAME=YOUR_USERNAME
METERED_CREDENTIAL=YOUR_CREDENTIAL
```

## Database Migration

```bash
alembic upgrade head
```

Create a new migration:(if needed)

```bash
alembic revision --autogenerate -m "message"
```

## Deploy on Render

1. Fork the repository.
2. Create a new **Web Service** on Render.
3. Connect your GitHub repository.
4. Build Command

```bash
pip install -e . && alembic upgrade head
```

5. Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

6. Add all environment variables from `.env`.
7. Deploy.

## Development Workflow

```text
Create Branch
      ↓
Implement Feature
      ↓
Run Alembic Migration (if needed)
      ↓
Open Pull Request
      ↓
Code Review
      ↓
Merge
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Keep changes focused.
4. Follow existing project structure.
5. Update migrations when models change.
6. Submit a Pull Request with a clear description.

## Current Status

- Backend API
- Authentication
- WebSocket Signaling
- Database Models
- Alembic Migrations

Testing has not been added yet and is planned for future development.

## License

Licensed under the MIT License.

