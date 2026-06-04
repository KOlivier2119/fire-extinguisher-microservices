# Entity Relationship Diagram — TZW LTD FEMS

## Overview

Database-per-service architecture on a single PostgreSQL instance:

- **auth_db** — Users, refresh tokens, password reset tokens
- **extinguisher_db** — Fire extinguishers, inspections, maintenance logs
- **notification_db** — Email notification audit log

## ERD

```mermaid
erDiagram
  User ||--o{ RefreshToken : has
  User ||--o{ PasswordResetToken : has
  FireExtinguisher ||--o{ Inspection : has
  FireExtinguisher ||--o{ MaintenanceLog : has

  User {
    uuid id PK
    string email UK
    string firstName
    string lastName
    string passwordHash
    enum role
    datetime createdAt
    datetime updatedAt
  }

  RefreshToken {
    uuid id PK
    string tokenHash UK
    uuid userId FK
    datetime expiresAt
  }

  PasswordResetToken {
    uuid id PK
    string tokenHash UK
    uuid userId FK
    datetime expiresAt
    boolean used
  }

  FireExtinguisher {
    uuid id PK
    string serialNumber UK
    string location
    enum type
    enum size
    date installationDate
    date expiryDate
    enum status
  }

  Inspection {
    uuid id PK
    uuid extinguisherId FK
    date scheduledDate
    string scheduledTime
    enum status
    uuid assignedInspectorId
    uuid createdById
  }

  MaintenanceLog {
    uuid id PK
    uuid extinguisherId FK
    uuid inspectorId
    string actionTaken
    date maintenanceDate
    text issuesIdentified
    text notes
    text recommendations
  }

  Notification {
    uuid id PK
    string recipientEmail
    string subject
    text body
    enum type
    enum status
    datetime sentAt
  }
```

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| User | email (unique) | Prevent duplicate registrations |
| User | role | Admin user listing |
| FireExtinguisher | serialNumber (unique) | Prevent duplicate equipment |
| FireExtinguisher | expiryDate, status | Compliance queries |
| Inspection | scheduledDate, status | Report generation |
| MaintenanceLog | maintenanceDate | Maintenance frequency reports |
| Notification | status, type, createdAt | Audit queries |
