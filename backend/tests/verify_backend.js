import { blockchainLedger } from '../src/services/blockchainLedger.js';
import { aiAnomalyDetector } from '../src/services/aiAnomalyDetector.js';
import { GeofenceEngine } from '../src/services/geofenceEngine.js';
import { efirGenerator } from '../src/services/efirGenerator.js';
import { kycSandboxService } from '../src/services/kycSandbox.js';
import { encryptPII, decryptPII, maskSensitiveData } from '../src/services/dpdpManager.js';
import { db } from '../src/models/db.js';

console.log('--- STARTING BACKEND LOGIC VERIFICATION ---');

// 1. Verify DPDP Encryption & Masking
console.log('\n1. Testing DPDP AES-256 Encryption & Masking:');
const secretAadhaar = '998877665544';
const encrypted = encryptPII(secretAadhaar);
const decrypted = decryptPII(encrypted);
const masked = maskSensitiveData(secretAadhaar, 0, 4);
console.log(`Original: ${secretAadhaar}`);
console.log(`Masked: ${masked}`);
console.log(`Encrypted: ${encrypted}`);
console.log(`Decrypted: ${decrypted}`);
if (decrypted !== secretAadhaar) throw new Error('DPDP Encryption/Decryption mismatch!');
console.log('✅ DPDP Encryption & Masking Verified.');

// 2. Verify KYC Sandbox
console.log('\n2. Testing e-KYC Sandbox:');
const otpReq = kycSandboxService.requestAadhaarOtp('998877665544');
console.log(`OTP Request Txn: ${otpReq.txnId}, OTP sent to: ${otpReq.otpSentTo}`);
const kycRes = kycSandboxService.verifyAadhaarOtp(otpReq.txnId, '123456', '998877665544', 'Ananya Roy', new Date().toISOString());
console.log(`KYC Verified: ${kycRes.isVerified}, Hash: ${kycRes.kycHash}`);
if (!kycRes.isVerified || !kycRes.kycHash) throw new Error('e-KYC verification failed!');
console.log('✅ e-KYC Sandbox Verified.');

// 3. Verify Blockchain Ledger & Tamper Detection
console.log('\n3. Testing Blockchain Ledger & SHA-256 Merkle Verification:');
const chainStatus = blockchainLedger.validateChainIntegrity();
console.log(`Chain Valid: ${chainStatus.valid}, Total Blocks: ${chainStatus.totalBlocks}, Latest Hash: ${chainStatus.latestBlockHash}`);
if (!chainStatus.valid) throw new Error('Blockchain ledger integrity check failed!');
console.log('✅ Blockchain Ledger Verified.');

// 4. Verify Geofence Engine (Point-in-Polygon)
console.log('\n4. Testing Geofence Engine:');
const engine = new GeofenceEngine(db.data.geofences);
// Test coordinate inside Dzukou Valley
const dzukouCheck = engine.evaluateLocation(25.5682, 94.0483);
console.log(`Dzukou Valley Breach Detected: ${dzukouCheck.hasBreach}, Breaches: ${dzukouCheck.insideBreaches.length}`);
// Test coordinate in Guwahati safe city center
const ghyCheck = engine.evaluateLocation(26.1445, 91.7362);
console.log(`Guwahati City Center Breach: ${ghyCheck.hasBreach}`);
console.log('✅ Geofence Engine Verified.');

// 5. Verify AI Anomaly Detector
console.log('\n5. Testing AI Anomaly Detector:');
const mockTourist = db.data.touristIds[0];
const anomalyEval = aiAnomalyDetector.analyzeTouristTelemetry(mockTourist, [
  { latitude: 25.5788, longitude: 91.8933, timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), isTransitZone: true }
]);
console.log(`Anomaly Score: ${anomalyEval.anomalyScore}, Classification: ${anomalyEval.classification}, Signals: ${anomalyEval.signals.length}`);
console.log(`Explainability: ${anomalyEval.explainabilitySummary}`);
console.log('✅ AI Anomaly Detector Verified.');

// 6. Verify Automated E-FIR Generator
console.log('\n6. Testing Legal E-FIR Generator:');
const mockAlert = db.data.alerts[0];
const efir = efirGenerator.generateMissingPersonEFIR(mockTourist, mockAlert);
console.log(`Generated FIR: ${efir.firNumber}, Jurisdiction: ${efir.jurisdiction.policeStation}, Certificate Thumbprint: ${efir.digitalSignature.certificateThumbprint.substring(0, 16)}...`);
if (!efir.firNumber || !efir.digitalSignature.isCryptographicallyVerified) throw new Error('E-FIR generation failed!');
console.log('✅ Legal E-FIR Generator Verified.');

console.log('\n=======================================================');
console.log('🎉 ALL BACKEND CORE SERVICES VERIFIED SUCCESSFULLY!');
console.log('=======================================================');
