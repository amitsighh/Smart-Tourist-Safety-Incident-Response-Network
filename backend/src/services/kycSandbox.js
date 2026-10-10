import crypto from 'crypto';
import { encryptPII, maskSensitiveData } from './dpdpManager.js';

export class KYCSandboxService {
  // Simulate Aadhaar OTP Request (UIDAI Sandbox)
  requestAadhaarOtp(aadhaarNumber) {
    const cleanNumber = aadhaarNumber.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanNumber)) {
      throw new Error('Invalid Aadhaar number format. Must be 12 numeric digits.');
    }

    const txnId = 'UIDAI-TXN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const maskedAadhaar = maskSensitiveData(cleanNumber, 0, 4);

    return {
      success: true,
      txnId,
      maskedAadhaar,
      otpSentTo: '+91 98****3210 (Registered Mobile)',
      validitySeconds: 600,
      mockOtp: '123456' // provided in sandbox for smooth verification
    };
  }

  // Verify Aadhaar OTP & Generate Verified KYC Record
  verifyAadhaarOtp(txnId, otp, aadhaarNumber, fullName, consentTimestamp) {
    if (otp !== '123456' && otp !== '999999') {
      throw new Error('Invalid OTP. Please enter the OTP provided in the sandbox (123456).');
    }

    const cleanNumber = aadhaarNumber ? aadhaarNumber.replace(/\s+/g, '') : '998877665544';
    const rawKycToken = `UIDAI:${cleanNumber}:${fullName}:${consentTimestamp || new Date().toISOString()}`;
    const kycHash = crypto.createHash('sha256').update(rawKycToken).digest('hex');

    return {
      isVerified: true,
      kycType: 'AADHAAR_EKYC',
      kycHash,
      verificationAgency: 'UIDAI e-KYC Authentication Gateway',
      verifiedName: fullName || 'Verified Citizen',
      maskedDocId: maskSensitiveData(cleanNumber, 0, 4),
      encryptedDocId: encryptPII(cleanNumber),
      consentRecordedAt: consentTimestamp || new Date().toISOString(),
      dpdpConsentScope: ['IDENTITY_VERIFICATION', 'EMERGENCY_SAFETY_DISPATCH', 'BLOCKCHAIN_ANCHORING']
    };
  }

  // Verify Passport Document
  verifyPassport(passportNumber, nationality, fullName, expiryDate) {
    const cleanPass = passportNumber.trim().toUpperCase();
    if (cleanPass.length < 6) {
      throw new Error('Invalid Passport Number format.');
    }

    const rawKycToken = `PASSPORT:${cleanPass}:${nationality}:${fullName}:${expiryDate}`;
    const kycHash = crypto.createHash('sha256').update(rawKycToken).digest('hex');

    return {
      isVerified: true,
      kycType: 'PASSPORT_VERIFICATION',
      kycHash,
      verificationAgency: 'Bureau of Immigration / DigiLocker Travel Gateway',
      verifiedName: fullName,
      nationality: nationality || 'International',
      maskedDocId: maskSensitiveData(cleanPass, 2, 2),
      encryptedDocId: encryptPII(cleanPass),
      consentRecordedAt: new Date().toISOString(),
      dpdpConsentScope: ['IDENTITY_VERIFICATION', 'EMERGENCY_SAFETY_DISPATCH', 'BLOCKCHAIN_ANCHORING']
    };
  }
}

export const kycSandboxService = new KYCSandboxService();
