.PHONY: help install dev run test lint format check \
        revision migrate downgrade build publish clean

APP=app.main:app
MODULE=app

help:
	@echo "Available commands:"
	@echo "  make install    Install project"
	@echo "  make dev        Install development dependencies"
	@echo "  make run        Run FastAPI development server"
	@echo "  make test       Run test suite"
	@echo "  make format     Format source code"
	@echo "  make lint       Lint and type-check code"
	@echo "  make check      Format, lint, and test"
	@echo "  make revision   Create Alembic migration"
	@echo "  make migrate    Apply database migrations"
	@echo "  make downgrade  Revert one migration"
	@echo "  make build      Build distribution package"
	@echo "  make publish    Publish package to PyPI"
	@echo "  make clean      Remove build and cache files"

install:
	pip install .

dev:
	pip install -e ".[dev]"

run:
	uvicorn $(APP) --reload

test:
	pytest --cov=$(MODULE) --cov-report=term-missing

format:
	black app tests
	ruff check app tests --fix

lint:
	ruff check app tests --fix
	mypy app

check: format lint test

revision:
	alembic revision --autogenerate -m "update"

migrate:
	alembic upgrade head

downgrade:
	alembic downgrade -1

build:
	python -m build

publish: build
	twine upload dist/*

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.py[co]" -delete
	rm -rf \
		build \
		dist \
		*.egg-info \
		.pytest_cache \
		.mypy_cache \
		.ruff_cache \
		htmlcov \
		.coverage \
		.coverage.* \
		.tox \
		.nox