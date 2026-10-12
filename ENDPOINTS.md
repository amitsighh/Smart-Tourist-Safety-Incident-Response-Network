# API Endpoint Inventory & Role-Based Access Control (RBAC)

This document provides a comprehensive inventory of all endpoints in the **SurakshaYatra - Smart Tourist Safety Monitoring & Incident Response System** and their access control policies.

| HTTP Method | Path | Required Role(s) | Auth Required | Rate Limited | Description |
|---|---|---|---|---|---|
| `GET` | `/health` | Public | No | Standard | Health check & gateway node status |
| `POST` | `/api/auth/register` | Public | No | Strict (authLimiter) | User registration (enforces 12-char min password) |
| `POST` | `/api/auth/login` | Public | No | Strict (authLimiter) | Login with Argon2id/bcrypt; triggers MFA for authority roles |
| `POST` | `/api/auth/verify-mfa` | Public | No | Strict (authLimiter) | MFA verification (TOTP / SMS OTP sandbox) |
| `GET` | `/api/auth/me` | Any Authenticated | Yes (JWT) | Standard | Return current authenticated user profile |
| `POST` | `/api/tourist-id/request-aadhaar-otp` | Public / Tourist | No | Strict (authLimiter) | Request UIDAI Aadhaar sandbox OTP |
| `POST` | `/api/tourist-id/issue` | Public / Operator | Optional | Standard | Issue Digital Tourist ID, salted KYC hash & blockchain anchor |
| `GET` | `/api/tourist-id/my-id` | `tourist` | Yes (JWT) | Standard | Retrieve caller's Digital Tourist ID and proof |
| `GET` | `/api/tourist-id/all` | `operator`, `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | Audit-logged list of all active tourist IDs |
| `GET` | `/api/tourist-id/:touristId` | Owner OR `operator`, `police`, `tourism_official`, `admin` | Yes (JWT) | Standard | IDOR-protected fetch of specific tourist ID |
| `POST` | `/api/tourist-id/verify-qr` | Public / Authorized | No | Standard | Checkpoint QR verification returning official card details |
| `GET` | `/api/tourist-id/verify-public/:touristId` | Public | No | Standard | Zero-PII public verify (returns status & first name only) |
| `PUT` | `/api/tourist-id/:touristId/itinerary` | Owner OR Authority | Yes (JWT) | Standard | Update itinerary checkpoints & recalculate route |
| `POST` | `/api/tourist-id/:touristId/check-in` | Owner OR Authority | Yes (JWT) | Standard | Record safe trek checkpoint check-in |
| `PUT` | `/api/tourist-id/:touristId/tracking-consent` | Owner OR Authority | Yes (JWT) | Standard | DPDP Act granular tracking consent toggle |
| `POST` | `/api/tracking/ping` | Device / App | No | Standard | GPS telemetry ping (geofence & route evaluation) |
| `POST` | `/api/tracking/sos` | Device / App | No | Generous (emergencySosLimiter) | Immediate panic SOS distress trigger & dispatch |
| `GET` | `/api/tracking/live-map` | `police`, `operator`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | Live GIS map coordinates of opted-in tourists & patrols |
| `GET` | `/api/incidents` | `police`, `operator`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | Incident alert triage queue |
| `PUT` | `/api/incidents/:alertId/acknowledge` | `police`, `admin` | Yes (JWT + MFA) | Standard | Acknowledge emergency alert |
| `PUT` | `/api/incidents/:alertId/assign-unit` | `police`, `admin` | Yes (JWT + MFA) | Standard | Dispatch nearest patrol unit with ETA |
| `PUT` | `/api/incidents/:alertId/resolve` | `police`, `admin` | Yes (JWT + MFA) | Standard | Close and resolve incident with notes |
| `POST` | `/api/efir/generate` | `police`, `admin` | Yes (JWT + MFA) | Standard | Generate legal Missing Person E-FIR (BNS 2023) |
| `GET` | `/api/efir` | `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | List all generated legal E-FIR documents |
| `GET` | `/api/efir/:id` | `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | View official E-FIR document & digital signature |
| `GET` | `/api/geofences` | Public | No | Standard | List active geofence polygons and boundaries |
| `POST` | `/api/geofences` | `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | Create custom geofence polygon & schedule |
| `PATCH` | `/api/geofences/:id/toggle` | `police`, `admin` | Yes (JWT + MFA) | Standard | Toggle geofence active status |
| `DELETE` | `/api/geofences/:id` | `admin` | Yes (JWT + MFA) | Standard | Delete geofence polygon |
| `GET` | `/api/anomaly/scan` | `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | Trigger AI anomaly scan on active tourists |
| `GET` | `/api/anomaly/explain/:touristId` | `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | Anomaly explainability breakdown modal |
| `POST` | `/api/anomaly/feedback` | `police`, `admin` | Yes (JWT + MFA) | Standard | Submit operator confirmation or dismissal feedback |
| `GET` | `/api/blockchain/status` | Public | No | Standard | PoA Consensus status & chain validation |
| `GET` | `/api/blockchain/blocks` | Public | No | Standard | Full blockchain ledger block explorer |
| `GET` | `/api/blockchain/blocks/:index` | Public | No | Standard | Get specific block by height |
| `GET` | `/api/blockchain/verify/:touristId` | Public | No | Standard | Cryptographic Merkle inclusion proof verification |
| `POST` | `/api/blockchain/test-tamper` | `admin` | Yes (JWT + MFA) | Standard | Tamper detection sandbox demonstration |
| `GET` | `/api/admin/stats` | `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | System KPIs & high-level monitoring metrics |
| `GET` | `/api/admin/audit-logs` | `admin` | Yes (JWT + MFA) | Standard | Immutable security and DPDP access audit logs |
| `POST` | `/api/admin/run-dpdp-purge` | `admin` | Yes (JWT + MFA) | Standard | Execute DPDP expired record retention purge |
| `GET` | `/api/admin/users` | `admin` | Yes (JWT + MFA) | Standard | User account administration |
| `GET` | `/api/wearables` | `operator`, `police`, `admin` | Yes (JWT + MFA) | Standard | IoT wearable safety band list |
| `POST` | `/api/wearables/pair` | `operator`, `admin` | Yes (JWT + MFA) | Standard | Pair BLE band with Tourist ID |
| `POST` | `/api/wearables/unpair` | `operator`, `admin` | Yes (JWT + MFA) | Standard | Unpair and return band |
| `POST` | `/api/wearables/telemetry` | Public / IoT Gateway | No | Standard | Simulated heart-rate, battery & fall telemetry |
| `GET` | `/api/advisories` | Public | No | Standard | View official weather/curfew advisories |
| `POST` | `/api/advisories` | `tourism_official`, `police`, `admin` | Yes (JWT + MFA) | Standard | Broadcast emergency advisory |
| `POST` | `/api/help/lost-passport` | Public / Tourist | No | Standard | Submit Lost Passport Emergency Report |
| `POST` | `/api/help/grievances` | Public / Tourist | No | Standard | Submit Tourist Safety Grievance Ticket |
| `GET` | `/api/help/track/:caseId` | Public | No | Standard | Track case status (`LP-2026-XXXX`, `GRV-2026-XXXX`) |
| `GET` | `/api/help/resources` | Public | No | Standard | Consular, FRRO & 24/7 emergency contact directory |
| `GET` | `/api/news` | Public | No | Standard | Location news & field situation reports feed |
| `GET` | `/api/news/nearby` | Public | No | Standard | Proximity news lookup via Haversine distance |
| `POST` | `/api/news` | `police`, `tourism_official`, `operator`, `admin` | Yes (JWT + MFA) | Standard | Broadcast verified location news bulletin |
| `DELETE` | `/api/news/:id` | `police`, `tourism_official`, `admin` | Yes (JWT + MFA) | Standard | Archive/delete news bulletin |
| `GET` | `/api/notifications/logs` | `police`, `tourism_official`, `medical`, `disaster_response`, `admin` | Yes (JWT + MFA) | Standard | Dispatched notifications, delivery status & demo routing |
| `POST` | `/api/notifications/sms-inbound` | Public / SMS Webhook | No | Standard | Inbound SMS webhook ('1' ack or compact signed SOS) |
| `POST` | `/api/notifications/webhook` | Public / Provider Webhook | No | Standard | Delivery receipt status callback webhook |
| `POST` | `/api/notifications/simulate-scenario` | `police`, `tourism_official`, `operator`, `admin` | Yes (JWT + MFA) | Standard | Trigger real test scenarios (SOS online, SMS inbound, etc.) |
