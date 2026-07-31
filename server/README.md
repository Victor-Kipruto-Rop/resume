# Server Operations & Backend Infrastructure

This directory (`/server`) houses the backend architecture, API services, telemetry processors, and operational scripts supporting the data engineering platform and portfolio.

## Architecture Overview

The backend is designed around production-grade microservices supporting:
* **Real-time Kafka Event Streaming**: Low-latency ingestion and consumer group management.
* **Apache Airflow Orchestration**: Idempotent ETL DAG scheduling and workflow dependencies.
* **PostgreSQL OLTP & Warehousing**: Relational data modeling, SCD Type 2 dimensions, and recursive CTE analytics.
* **CI/CD Automation**: GitHub Actions gating pushes via Pytest unit tests, Black, isort, and mypy[span_0](start_span)[span_0](end_span).

## Security & Compliance
* **Zero-Secrets Policy**: No API keys, database passwords, or JWT secrets are stored in version control. All sensitive configurations are managed via secure environment variables or a secret manager.
* **RBAC & Authentication**: Secure token-based session handling with rate limiting and audit logging.

## Directory Structure
