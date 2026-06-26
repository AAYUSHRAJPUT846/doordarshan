.PHONY: \
	help install dev run serve shell \
	test coverage format lint check \
	revision migrate downgrade reset-db \
	build publish freeze clean

PYTHON := python
PIP := $(PYTHON) -m pip

APP := app.main:app
MODULE := app
SRC := app tests

help:
	@echo ""
	@echo "================ Doordarshan Commands ================"
	@echo ""
	@echo "Development"
	@echo "  make install      Install project"
	@echo "  make dev          Install project with development dependencies"
	@echo "  make run          Run FastAPI development server"
	@echo "  make serve        Run FastAPI without auto reload"
	@echo "  make shell        Open Python shell"
	@echo ""
	@echo "Quality"
	@echo "  make format       Format source code"
	@echo "  make lint         Run linting and type checking"
	@echo "  make test         Run tests"
	@echo "  make coverage     Run tests with HTML coverage report"
	@echo "  make check        Run format, lint, and tests"
	@echo ""
	@echo "Database"
	@echo "  make revision     Create Alembic migration"
	@echo "  make migrate      Apply migrations"
	@echo "  make downgrade    Revert last migration"
	@echo "  make reset-db     Reset database to latest migration"
	@echo ""
	@echo "Packaging"
	@echo "  make build        Build distribution"
	@echo "  make publish      Publish package to PyPI"
	@echo "  make freeze       Export requirements.txt"
	@echo ""
	@echo "Maintenance"
	@echo "  make clean        Remove build/cache files"
	@echo ""
	@echo "======================================================"

install:
	$(PIP) install .

dev:
	$(PIP) install -e ".[dev]"

run:
	uvicorn $(APP) --reload

serve:
	uvicorn $(APP) --host 0.0.0.0 --port 8000

shell:
	$(PYTHON)

test:
	pytest --cov=$(MODULE) --cov-report=term-missing

coverage:
	pytest \
		--cov=$(MODULE) \
		--cov-report=term-missing \
		--cov-report=html

format:
	black $(SRC)
	ruff check $(SRC) --fix

lint:
	ruff check $(SRC)
	mypy app

check: format lint test

revision:
	@read -p "Migration name: " name; \
	alembic revision --autogenerate -m "$$name"

migrate:
	alembic upgrade head

downgrade:
	alembic downgrade -1

reset-db:
	alembic downgrade base
	alembic upgrade head

build:
	$(PYTHON) -m build

publish: build
	twine upload dist/*

freeze:
	$(PIP) freeze > requirements.txt

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type d -name ".tox" -exec rm -rf {} +
	find . -type d -name ".nox" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type f -name "*.py[co]" -delete
	find . -type f -name ".coverage*" -delete
	rm -rf \
		build \
		dist \
		*.egg-info
