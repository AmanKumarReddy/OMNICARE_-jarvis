# OmniStock Cloud Enterprise - Cloud Infrastructure & Deployment Guide

This document outlines production deployment strategies for OmniStock Cloud Enterprise on Amazon Web Services (AWS) and Docker Compose.

---

## 1. System Architecture on AWS

```
                    [ Users & Warehouse Handhelds ]
                                  │
                                  ▼
                   [ AWS Route 53 (DNS / Anycast) ]
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
   [ CloudFront CDN (Static Assets) ]   [ Application Load Balancer (ALB) ]
                 │                                 │
                 ▼                                 ▼
         [ S3 Frontend Bucket ]          [ AWS ECS Fargate Cluster ]
                                        ┌───────────┴───────────┐
                                        ▼                       ▼
                                 [ Go Task 1 ]           [ Go Task 2 ]
                                        │                       │
                                        └───────────┬───────────┘
                                                    │
                                                    ▼
                                    [ Amazon RDS PostgreSQL (Multi-AZ) ]
                                    ┌───────────────────────┐
                                    │ Primary (Read/Write)  │
                                    │ Replica (Standby)     │
                                    └───────────────────────┘
```

---

## 2. Docker Compose Deployment (Self-Hosted / Staging)

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+

### Steps to Run
1. Clone the repository and configure environment:
   ```bash
   cp .env.example .env
   ```
2. Build and launch all services:
   ```bash
   docker compose up -d --build
   ```
3. Check container status:
   ```bash
   docker compose ps
   ```
4. Verify logs:
   ```bash
   docker compose logs -f backend
   ```
5. Access the services:
   - **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
   - **Backend REST API**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
   - **OpenAPI Documentation**: [http://localhost:8080/api/docs](http://localhost:8080/api/docs)
   - **PostgreSQL Database**: `localhost:5432` (User: `omnistock`, DB: `omnistock_db`)

---

## 3. Production Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | HTTP listener port | `8080` |
| `APP_ENV` | Application environment (`production` / `staging` / `development`) | `production` |
| `DB_TYPE` | Storage driver (`postgres` or `sqlite`) | `postgres` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@rds-host:5432/omnistock_db?sslmode=require` |
| `JWT_SECRET` | 256-bit cryptographically secure secret key | *(generate with `openssl rand -base64 32`)* |
| `ALLOW_ORIGINS` | Permitted CORS origins | `https://app.omnistock.io` |

---

## 4. Production Database Migrations & Backup Strategy

### Running Migrations
Database migrations execute automatically upon server boot. For manual migration execution via CLI:
```bash
# Apply up migrations
psql -h <RDS_ENDPOINT> -U omnistock -d omnistock_db -f backend/migrations/000001_init_schema.up.sql
psql -h <RDS_ENDPOINT> -U omnistock -d omnistock_db -f backend/migrations/000002_seed_data.up.sql
```

### Automated Backup Strategy
1. **Automated RDS Snapshots**: Enable Daily automated backups with a 35-day retention window and point-in-time recovery (PITR) with 5-minute granularity.
2. **Scheduled Logical Dump (pg_dump)**:
   ```bash
   pg_dump -h <RDS_HOST> -U omnistock -F c -b -v -f omnistock_backup_$(date +%Y%m%d_%H%M%S).dump omnistock_db
   aws s3 cp omnistock_backup_*.dump s3://omnistock-enterprise-backups/database/
   ```

---

## 5. Security & Compliance Checklist

- [x] **Zero Plaintext Passwords**: Passwords hashed with bcrypt cost 10 (or Argon2id).
- [x] **Multi-Tenant Isolation**: Queries scoped by `org_id`.
- [x] **Relational Concurrency Locks**: Transactions with balance checks preventing negative inventory.
- [x] **Non-Root Container Execution**: Go containers run as unprivileged `appuser`.
- [x] **Tamper-Proof Audit Logging**: State transitions logged with timestamp, user ID, IP address, and JSON diffs.
- [x] **Strict CORS Policy**: Restricted to authorized SaaS domains.
