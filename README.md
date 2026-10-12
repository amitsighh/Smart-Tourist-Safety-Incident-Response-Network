# SurakshaYatra: Smart Tourist Safety Monitoring & Incident Response System

A production-grade, government-compliant web platform engineered for real-time tourist safety monitoring, AI-driven anomaly detection, geo-fencing, tamper-proof blockchain ID anchoring, and multi-division emergency response across high-risk and remote tourism destinations.

---

## 🏛️ System Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet GIS Map, PWA Service Worker (`/sw.js`), IndexedDB offline queue.
- **Backend**: Node.js & Express REST + Socket.IO WebSocket server, Helmet security headers, CORS allowlisting, and rate limiting.
- **Security & DPDP Compliance**: AES-256-GCM field encryption, salted SHA-256 KYC hashes, Argon2id/bcrypt 12-round password hashing, mandatory MFA for operational roles.
- **Blockchain Ledger**: Permissioned Sovereign Proof-of-Authority (PoA) consensus ledger simulation with SHA-256 Merkle root hashing and cryptographic chain integrity verification (`verifyChain()`).
- **Notification & Dispatch Service**: Multi-channel emergency broadcast (SMS, WebSockets, email) with provider adapters (Twilio, Fast2SMS, MSG91, Mock), idempotency keys, and inbound SMS webhook parser.

---

## 🚀 Quick Start & Setup

### 1. Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd smart-tourist-safety

# Install dependencies for root, backend, and frontend
npm run render-build
```

### 3. Environment Configuration
Copy the template file to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `JWT_SECRET` | Secret key for session tokens | 64-character random string |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 PII encryption | 64-char hex string |
| `DEMO_MODE` | Enable safe demo redirection mode | `true` |
| `DEMO_PHONE_NUMBER` | Test phone number for redirected alerts | `+917307007253` |
| `SMS_PROVIDER` | SMS adapter (`mock`, `twilio`, `fast2sms`, `msg91`) | `mock` |
| `TWILIO_ACCOUNT_SID` | Optional Twilio Account SID | Twilio SID |
| `TWILIO_AUTH_TOKEN` | Optional Twilio Auth Token | Twilio Token |
| `TWILIO_FROM_NUMBER` | Twilio verified phone number | Twilio Number |

---

## 📱 Demo Mode & Phone Redirection

To allow hands-on demonstration without sending real alerts to emergency divisions:
1. When `DEMO_MODE=true`, **every SMS/notification** intended for Police Control Room, Nearest Patrol Unit, Emergency Contacts, Tourism Officials, Medical Desks, or SDRF is redirected to the number defined in `DEMO_PHONE_NUMBER` (e.g. `+917307007253`).
2. Each message is prefixed with its intended role tag, for example:
   ```
   [DEMO -> POLICE CONTROL ROOM]
   [TOURIST SOS] HIGH
   ID: TID-NE-2026-92868
   Name: Rahul S. | Ph: +91 98XXXXXX10
   Loc: 25.5788,91.8933 (Shillong, +/-12m) 10:42 12-Oct
   Map: https://localhost:5173/s/a8F3kQ
   Via: Internet | Reply 1 to acknowledge
   ```
3. A live **Message Log** page is accessible in the dashboard at `/message-log` and within the Authority portal, displaying exact delivery status, actual recipients, provider message IDs, and full message text.

---

## 📲 SMS Regulatory & DLT Compliance Notice (India)

- **Development / Demonstration**: In sandbox and demo mode, messages are sent via the Mock adapter or a Twilio trial account. With Twilio trial accounts, outgoing SMS can only be delivered to numbers verified in your Twilio Console.
- **Production Deployment in India**:
  Under Telecom Regulatory Authority of India (TRAI) regulations, commercial and emergency bulk SMS dispatch requires **Distributed Ledger Technology (DLT) Registration**:
  1. Entity Registration with a telecom operator portal (e.g., Jio, Airtel, Vodafone Idea, BSNL DLT portal).
  2. Sender ID (Header) Approval (e.g., `SKHYAT`, `TRSTSF`).
  3. Pre-registered Content Templates (SMS messages must match the approved variable templates line-by-line).
  4. Integration with authorized Indian SMS aggregators (e.g., NIC SMS Gateway, CDAC, Fast2SMS, or MSG91).

---

## 🧪 Testing & Verification

Run the automated unit and security verification suite:
```bash
node backend/tests/system_verification.test.js
```
*(Runs 10/10 test scenarios covering safety scoring, geofences, anomaly rules, ledger chain verification, HMAC SMS signature & replay protection, notification idempotency, and demo mode redirection).*

Run the 21-scenario end-to-end integration test suite:
```bash
node backend/tests/e2e_api_test.js
```

---

## 🌐 Endpoints & Security Documentation

- **[ENDPOINTS.md](./ENDPOINTS.md)**: Complete endpoint inventory with required roles, auth headers, and rate limits.
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)**: 13-point security verification report and evidence.
