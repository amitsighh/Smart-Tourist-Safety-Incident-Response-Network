import crypto from 'crypto';
import { encryptPII, maskSensitiveData } from './dpdpManager.js';

export class KycAdapter {
  async verifyAadhaar(aadhaarNumber, fullName, otp, consentTimestamp) {
    throw new Error('Method not implemented.');
  }

  async verifyPassport(passportNumber, nationality, fullName, expiryDate) {
    throw new Error('Method not implemented.');
  }
}

export class MockKycVerifier extends KycAdapter {
  async requestAadhaarOtp(aadhaarNumber) {
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
      mockOtp: '123456'
    };
  }

  async verifyAadhaar(aadhaarNumber, fullName, otp, consentTimestamp) {
    if (otp !== '123456' && otp !== '999999') {
      throw new Error('Invalid OTP. Please enter the OTP provided in the sandbox (123456).');
    }

    const cleanNumber = aadhaarNumber ? aadhaarNumber.replace(/\s+/g, '') : '998877665544';
    const salt = crypto.randomBytes(8).toString('hex');
    const saltedHash = crypto.createHash('sha256').update(salt + cleanNumber).digest('hex');
    const lastFour = cleanNumber.slice(-4);

    return {
      isVerified: true,
      kycType: 'AADHAAR_EKYC',
      kycHash: saltedHash,
      verificationAgency: 'UIDAI e-KYC Authentication Gateway',
      verifiedName: fullName || 'Verified Citizen',
      maskedDocId: `XXXXXXXX${lastFour}`,
      lastFourDigits: lastFour,
      encryptedDocId: encryptPII(cleanNumber),
      consentRecordedAt: consentTimestamp || new Date().toISOString(),
      dpdpConsentScope: ['IDENTITY_VERIFICATION', 'EMERGENCY_SAFETY_DISPATCH', 'BLOCKCHAIN_ANCHORING']
    };
  }

  async verifyPassport(passportNumber, nationality, fullName, expiryDate) {
    const cleanPass = passportNumber.trim().toUpperCase();
    if (cleanPass.length < 6) {
      throw new Error('Invalid Passport Number format.');
    }

    const salt = crypto.randomBytes(8).toString('hex');
    const saltedHash = crypto.createHash('sha256').update(salt + cleanPass).digest('hex');
    const lastFour = cleanPass.slice(-4);

    return {
      isVerified: true,
      kycType: 'PASSPORT_VERIFICATION',
      kycHash: saltedHash,
      verificationAgency: 'Bureau of Immigration / DigiLocker Travel Gateway',
      verifiedName: fullName,
      nationality: nationality || 'International',
      maskedDocId: maskSensitiveData(cleanPass, 2, 2),
      lastFourDigits: lastFour,
      encryptedDocId: encryptPII(cleanPass),
      consentRecordedAt: new Date().toISOString(),
      dpdpConsentScope: ['IDENTITY_VERIFICATION', 'EMERGENCY_SAFETY_DISPATCH', 'BLOCKCHAIN_ANCHORING']
    };
  }
}

export const defaultKycVerifier = new MockKycVerifier();
