# Doordarshan

Open-source video conferencing built with FastAPI for seamless real-time communication.

## Status
Features:
- User registration with duplicate email and username checks
- Secure password hashing using Argon2
- OAuth2 Password Flow login
- JWT access token generation and validation
- Protected API endpoints with current user dependency
- OAuth2 integration in Swagger UI

Architecture:
- Added reusable authentication dependencies
- Separated security, CRUD, schemas, and API layers
- Introduced strongly typed dependency injection
- Improved response model validation

Developer Experience:
- Integrated Ruff, Black, and MyPy
- Added clean OpenAPI authentication support
- Refactored codebase for maintainability and scalability

## Tech Stack
- FastAPI (backend, REST + WebSocket)
- WebRTC (peer connections / media signaling)
- SQLAlchemy + Alembic (ORM + migrations)

## Structure
See project tree for the layout of `app/`, `alembic/`, `tests/`, and `scripts/`.
