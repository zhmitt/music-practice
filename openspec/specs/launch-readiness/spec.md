# Launch Readiness

## Purpose

This capability defines the production-readiness checks that SHALL be confirmed
before a repository ships to production for the first time (MVP launch). The
checks are derived from common, recurring causes of post-launch incidents:
missing load tests, in-memory session state, direct file uploads to app
servers, missing rate limiting, untested backups, and similar.

The capability is structured into three buckets reflecting how each check is
verified: code & configuration hygiene, infrastructure posture, and
operational drills.

## Requirements

### Requirement: Code and configuration hygiene
The application SHALL satisfy a baseline of code- and configuration-level
production readiness before launch.

#### Scenario: Secrets and environment configuration
- **WHEN** the deployment pipeline and runtime configuration are reviewed
- **THEN** no production secrets SHALL be hardcoded in scripts, CI logs, or
  committed files
- **AND** secrets SHALL be sourced from a secret manager or runtime-injected
  environment

#### Scenario: Database schema basics
- **WHEN** the schema is reviewed against expected query patterns
- **THEN** foreign key columns SHALL be indexed
- **AND** queries used in user-facing search SHALL be parameterized and
  indexed for the expected production data volume

#### Scenario: Multi-step writes
- **WHEN** an operation performs more than one persistent write
- **THEN** the operation SHALL run inside a database transaction or use an
  idempotent saga / outbox pattern so that partial failure does not leave
  permanently inconsistent data

#### Scenario: Outbound HTTP calls
- **WHEN** the application makes outbound HTTP calls
- **THEN** every call SHALL declare an explicit connection timeout and read
  timeout
- **AND** calls to dependencies on the request hot path SHOULD be guarded by
  a circuit breaker or bulkhead

#### Scenario: Response shaping
- **WHEN** API responses are returned to clients
- **THEN** responses SHALL be compressed at the edge or app server (gzip or
  brotli) where the payload exceeds a small threshold

#### Scenario: Health endpoint
- **WHEN** the load balancer queries the application
- **THEN** a dedicated health-check endpoint SHALL exist
- **AND** the endpoint SHALL reflect the readiness of critical runtime
  dependencies, not only process liveness

#### Scenario: Background work and email
- **WHEN** the application sends email or executes work that can block a
  request
- **THEN** the work SHALL be enqueued to a background queue
- **AND** API request handlers SHALL NOT block on third-party email or
  notification providers

#### Scenario: Session storage
- **WHEN** the application is deployed across more than one instance
- **THEN** session state SHALL live in a shared store (database, cache,
  signed cookie) and NOT in process memory

### Requirement: Infrastructure posture
The deployment topology SHALL be configured to survive routine production
conditions.

#### Scenario: Static assets
- **WHEN** static assets are served to end users
- **THEN** assets SHALL be served via a CDN, not directly by the application
  server

#### Scenario: File uploads
- **WHEN** users upload files
- **THEN** uploads SHALL be persisted to object storage and NOT to the
  application server's local disk

#### Scenario: Database scaling posture
- **WHEN** the database serves production traffic
- **THEN** a read replica SHALL be configured, or an architectural decision
  SHALL be recorded explaining why a single primary is acceptable for this
  launch

#### Scenario: Schema migrations under multi-instance deploys
- **WHEN** the application is deployed to more than one instance
- **THEN** schema migrations SHALL NOT run automatically on app start in
  every instance
- **AND** migrations SHALL be applied through a single coordinated step

#### Scenario: Rate limiting
- **WHEN** the application exposes public API endpoints
- **THEN** rate limiting SHALL be configured for those endpoints

#### Scenario: Long-running processes
- **WHEN** worker or server processes run for extended periods
- **THEN** memory limits and a restart policy SHALL be defined to bound the
  impact of slow leaks

#### Scenario: Real-time / WebSockets
- **WHEN** the application uses WebSockets or other stateful real-time
  protocols
- **THEN** the real-time tier SHALL run on a service compatible with
  horizontal scaling and reconnection

#### Scenario: Logging
- **WHEN** the application writes logs
- **THEN** logs SHALL be shipped to a durable backend or log aggregator and
  NOT retained only on local disk

#### Scenario: Error alerting
- **WHEN** the application enters production
- **THEN** error alerting SHALL be configured for crashes, unhandled
  exceptions, and elevated error rates
- **AND** at least one human SHALL receive the alerts on a defined channel

### Requirement: Operational drills
Operational readiness SHALL be confirmed through drills, not assumed.

#### Scenario: Load testing
- **WHEN** the launch readiness gate is closed
- **THEN** a load test SHALL have been executed against a production-like
  environment
- **AND** the result (target load, observed bottleneck, mitigation) SHALL be
  recorded as evidence

#### Scenario: Backup restore
- **WHEN** the launch readiness gate is closed
- **THEN** a database backup restore SHALL have been performed end-to-end at
  least once
- **AND** the restore evidence SHALL include the backup source, restore
  target, and a verification step confirming data integrity

#### Scenario: Graceful shutdown
- **WHEN** the application is deployed to production
- **THEN** the deploy mechanism SHALL drain in-flight requests on shutdown
- **AND** this behavior SHALL have been verified in at least one rehearsed
  deploy

#### Scenario: Third-party API dependencies
- **WHEN** the application depends on an external API on its critical path
- **THEN** the project SHALL have a documented fallback, degradation, or
  circuit-breaker plan for that dependency

#### Scenario: Incident runbook
- **WHEN** an on-call responder is paged after launch
- **THEN** a runbook SHALL exist covering at minimum: full outage, deploy
  rollback, database connectivity loss, and data corruption suspicion
