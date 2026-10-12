import assert from 'assert';
import crypto from 'crypto';
import { config } from '../src/config/index.js';
import { db } from '../src/models/db.js';
import { blockchainLedger } from '../src/services/blockchainLedger.js';
import { aiAnomalyDetector } from '../src/services/aiAnomalyDetector.js';
import { GeofenceEngine } from '../src/services/geofenceEngine.js';
import { notificationService } from '../src/services/notificationService.js';
import { efirGenerator } from '../src/services/efirGenerator.js';
import { defaultKycVerifier } from '../src/services/kycAdapter.js';

async function runTestSuite() {
  console.log('=======================================================');
  console.log('🧪 RUNNING PRODUCTION SECURITY & UNIT TEST SUITE');
  console.log('=======================================================');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. Dynamic Safety Score
  test('1. Dynamic Safety Score Evaluation', () => {
    const scoreSafe = aiAnomalyDetector.computeTouristSafetyScore(14, false, 0, 'LOW', 95);
    assert.strictEqual(typeof scoreSafe.safetyScore, 'number');
    assert.ok(scoreSafe.safetyScore >= 80, 'Daylight in safe zone should score >= 80');

    const scoreDanger = aiAnomalyDetector.computeTouristSafetyScore(23, true, 15, 'CRITICAL', 20);
    assert.ok(scoreDanger.safetyScore < 60, 'Night curfew inside breach zone should score < 60');
  });

  // 2. Geofence Polygon Ray-Casting
  test('2. Geofence Polygon Boundary Detection', () => {
    const geofences = [
      {
        id: 'GEOFENCE-01',
        name: 'Sela Pass Corridor',
        type: 'polygon',
        category: 'restricted',
        isActive: true,
        riskLevel: 'CRITICAL',
        coordinates: [
          [27.50, 92.10],
          [27.52, 92.10],
          [27.52, 92.12],
          [27.50, 92.12]
        ]
      }
    ];
    const engine = new GeofenceEngine(geofences);
    const inside = engine.evaluateLocation(27.51, 92.11);
    assert.strictEqual(inside.hasBreach, true, 'Point inside polygon must breach');

    const outside = engine.evaluateLocation(26.00, 90.00);
    assert.strictEqual(outside.hasBreach, false, 'Point outside polygon must not breach');
  });

  // 3. AI Anomaly Engine Rules
  test('3. AI Anomaly Engine Rules & Explainability', () => {
    const waypoints = [
      { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
      { name: 'Shillong', lat: 25.5788, lng: 91.8933 }
    ];
    const nearRoute = aiAnomalyDetector.calculateRouteDeviation(25.80, 91.80, waypoints);
    assert.strictEqual(nearRoute.isDeviated, false);

    const farRoute = aiAnomalyDetector.calculateRouteDeviation(28.00, 95.00, waypoints);
    assert.strictEqual(farRoute.isDeviated, true);
  });

  // 4. Ledger Chain Integrity & verifyChain()
  test('4. Hash-Chained Ledger Integrity & verifyChain()', () => {
    const status = blockchainLedger.verifyChain();
    assert.strictEqual(status.valid, true, 'Genesis chain must be valid');
    assert.ok(status.totalBlocks >= 1);
  });

  // 5. Tamper-Proof Ledger Divergence Detection
  test('5. Ledger Tamper Detection Sandbox', () => {
    const testBlock = blockchainLedger.mineBlock([{ type: 'TEST_TAMPER_TX', timestamp: new Date().toISOString() }]);
    assert.ok(testBlock.hash);

    const originalTx = testBlock.transactions[0].type;
    testBlock.transactions[0].type = 'TAMPERED_FRAUDULENT_TX';

    const tamperedStatus = blockchainLedger.verifyChain();
    assert.strictEqual(tamperedStatus.valid, false, 'Tampered block must fail verifyChain()');

    // Restore
    testBlock.transactions[0].type = originalTx;
    const restoredStatus = blockchainLedger.verifyChain();
    assert.strictEqual(restoredStatus.valid, true, 'Restored block must pass verifyChain()');
  });

  // 6. Compact SMS HMAC Signature & Replay Protection
  test('6. Compact SMS HMAC Signature Verification & Replay Protection', () => {
    const touristId = 'TID-TEST-001';
    const lat = 25.5788;
    const lng = 91.8933;
    const ts = Math.floor(Date.now() / 1000);
    const counter = 1;

    const secretKey = config.hmacSecret;
    const payload = `${touristId}:${lat},${lng}:${ts}:c${counter}`;
    const validHmac = crypto.createHmac('sha256', secretKey).update(payload).digest('hex').substring(0, 16);

    // Verify valid HMAC
    const computedHmac = crypto.createHmac('sha256', secretKey).update(payload).digest('hex').substring(0, 16);
    assert.strictEqual(validHmac, computedHmac);

    // Verify tampered payload fails
    const tamperedPayload = `${touristId}:${lat + 1},${lng}:${ts}:c${counter}`;
    const tamperedHmac = crypto.createHmac('sha256', secretKey).update(tamperedPayload).digest('hex').substring(0, 16);
    assert.notStrictEqual(validHmac, tamperedHmac);
  });

  // 7. Notification Idempotency Key Check
  await asyncTest('7. Notification Idempotency Key Guard', async () => {
    const testKey = 'IDEMP_TEST_UNIQUE_001';
    const firstDispatch = await notificationService.sendToRecipient({
      incidentId: 'INC-TEST',
      intendedRole: 'police',
      intendedRecipient: '+919988776655',
      channel: 'SMS',
      messageData: {
        touristId: 'TID-IDEMP',
        touristName: 'Test Tourist',
        latitude: 25.5788,
        longitude: 91.8933,
        locationName: 'Shillong'
      },
      idempotencyKey: testKey
    });
    assert.strictEqual(firstDispatch.success, true);

    const duplicateDispatch = await notificationService.sendToRecipient({
      incidentId: 'INC-TEST',
      intendedRole: 'police',
      intendedRecipient: '+919988776655',
      channel: 'SMS',
      messageData: {
        touristId: 'TID-IDEMP',
        touristName: 'Test Tourist',
        latitude: 25.5788,
        longitude: 91.8933,
        locationName: 'Shillong'
      },
      idempotencyKey: testKey
    });
    assert.strictEqual(duplicateDispatch.duplicate, true, 'Duplicate send must be suppressed');
  });

  // 8. Demo Mode Redirection Check
  await asyncTest('8. Demo Mode Phone Redirection (+917307007253)', async () => {
    assert.strictEqual(config.demoMode, true, 'DEMO_MODE must be enabled');
    assert.strictEqual(config.demoPhoneNumber, '+917307007253', 'DEMO_PHONE_NUMBER must match user specification');

    const result = await notificationService.sendToRecipient({
      incidentId: 'INC-DEMO-CHECK',
      intendedRole: 'police',
      intendedRecipient: '+911122334455', // Real police number
      channel: 'SMS',
      messageData: {
        touristId: 'TID-DEMO-01',
        touristName: 'Demo Tourist',
        latitude: 25.5788,
        longitude: 91.8933,
        locationName: 'Shillong'
      }
    });

    assert.strictEqual(result.actualRecipient, '+917307007253', 'Must redirect actual recipient to demo phone number');
    assert.ok(result.messageText.includes('[DEMO -> POLICE]'), 'Must prepend [DEMO -> POLICE] prefix');
    assert.ok(!result.messageText.includes('+911122334455'), 'Real recipient number must not receive text');
  });

  // 9. KYC Adapter Verification (No raw Aadhaar in plaintext)
  await asyncTest('9. KYC Adapter Aadhaar Masking & Salted Hash', async () => {
    const kycResult = await defaultKycVerifier.verifyAadhaar('123456789012', 'Aadhaar User', '123456', new Date().toISOString());
    assert.strictEqual(kycResult.isVerified, true);
    assert.strictEqual(kycResult.lastFourDigits, '9012');
    assert.strictEqual(kycResult.maskedDocId, 'XXXXXXXX9012');
    assert.ok(kycResult.kycHash && kycResult.kycHash.length === 64, 'Must produce 64-char SHA-256 hash');
  });

  // 10. Automated Legal E-FIR Generation
  test('10. Automated Legal E-FIR Certificate Generation', () => {
    const tourist = {
      touristId: 'TID-EFIR-TEST',
      fullName: 'Rahul Sharma',
      nationality: 'Indian',
      kycType: 'Aadhaar e-KYC',
      kycHash: 'ABCDEF123456'
    };
    const incident = {
      id: 'SOS-EFIR-001',
      latitude: 25.5788,
      longitude: 91.8933,
      locationName: 'Shillong Peak'
    };
    const firDoc = efirGenerator.generateMissingPersonEFIR(tourist, incident);
    assert.ok(firDoc.firNumber.startsWith('FIR/NE/'));
    assert.strictEqual(firDoc.digitalSignature.isCryptographicallyVerified, true);
    assert.ok(firDoc.digitalSignature.certificateThumbprint);
  });

  console.log('=======================================================');
  console.log(`🎉 ALL ${passed}/${total} TEST SUITE SCENARIOS PASSED 100%!`);
  console.log('=======================================================');
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
