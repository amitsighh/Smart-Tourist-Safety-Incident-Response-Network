import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  UserCheck,
  ShieldCheck,
  FileCheck,
  Calendar,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Phone,
  Heart,
  Globe,
  MapPin,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import DigitalIdCard from '../components/tourist/DigitalIdCard';

export default function RegisterKycPage({ setActivePage }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || 'Priya Sharma');
  const [nationality, setNationality] = useState('Indian');
  const [dob, setDob] = useState('1994-08-22');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('B+ Positive');
  const [phone, setPhone] = useState('+91 98765 43210');

  // KYC State
  const [kycType, setKycType] = useState('AADHAAR_EKYC'); // 'AADHAAR_EKYC' or 'PASSPORT_VERIFICATION'
  const [aadhaarNumber, setAadhaarNumber] = useState('9988 7766 5544');
  const [passportNumber, setPassportNumber] = useState('GB88997789');
  const [otp, setOtp] = useState('123456');
  const [txnId, setTxnId] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState('');

  // Itinerary & Dates
  const [validFrom, setValidFrom] = useState('2026-10-10');
  const [validUntil, setValidUntil] = useState('2026-10-25');
  const [emergencyContactName, setEmergencyContactName] = useState('Rohit Sharma (Brother)');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+91 98765 11223');
  const [optInTracking, setOptInTracking] = useState(true);
  const [trackingRecipients, setTrackingRecipients] = useState('police_and_family');
  const [dpdpConsentAgreed, setDpdpConsentAgreed] = useState(true);

  // Result State
  const [isMining, setIsMining] = useState(false);
  const [issuedDigitalId, setIssuedDigitalId] = useState(null);
  const [blockchainAnchor, setBlockchainAnchor] = useState(null);

  // Send OTP
  const handleRequestOtp = async () => {
    setKycLoading(true);
    setKycError('');
    try {
      const res = await api.requestAadhaarOtp(aadhaarNumber);
      if (res.success) {
        setTxnId(res.txnId);
        setIsOtpSent(true);
      } else {
        setKycError(res.message);
      }
    } catch (e) {
      setKycError(e.message);
    } finally {
      setKycLoading(false);
    }
  };

  // Verify KYC
  const handleVerifyKyc = () => {
    if (kycType === 'AADHAAR_EKYC' && otp !== '123456') {
      setKycError('Please use simulation sandbox OTP: 123456');
      return;
    }
    setIsKycVerified(true);
    setKycError('');
    setStep(3); // move to trip dates & itinerary
  };

  // Final Submission & Blockchain Mining
  const handleIssueId = async (e) => {
    e.preventDefault();
    if (!dpdpConsentAgreed) {
      alert('Please agree to the DPDP Act 2023 Consent terms to proceed.');
      return;
    }

    setIsMining(true);
    try {
      const payload = {
        fullName,
        nationality,
        dob,
        gender,
        bloodGroup,
        photoUrl: gender === 'Female'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        kycType,
        aadhaarNumber,
        passportNumber,
        otp,
        txnId,
        validFrom,
        validUntil,
        emergencyContacts: [
          { name: emergencyContactName, phone: emergencyContactPhone, relation: 'Primary Contact' }
        ],
        itinerary: [
          { name: 'Guwahati Transit Airport Checkpost', lat: 26.1061, lng: 91.5859, arrivalDate: validFrom, status: 'COMPLETED' },
          { name: 'Shillong Peak Eco-Trail', lat: 25.5788, lng: 91.8933, arrivalDate: validFrom, status: 'IN_PROGRESS' },
          { name: 'Cherrapunji Living Root Bridges', lat: 25.2702, lng: 91.7323, arrivalDate: validUntil, status: 'UPCOMING' }
        ],
        optInTracking,
        trackingRecipients
      };

      const res = await api.issueDigitalId(payload);
      if (res.success) {
        setIssuedDigitalId(res.digitalId);
        setBlockchainAnchor(res.blockchainAnchor);
        setStep(5); // Success step
      }
    } catch (err) {
      console.error(err);
      alert('Failed to issue Digital ID: ' + err.message);
    } finally {
      setIsMining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Govt. of India e-KYC & Sovereign ID Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Digital Tourist ID Registration & Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Issue a visit-limited, QR-verifiable digital credential anchored in sovereign blockchain ledger with DPDP Act 2023 compliance.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
        {[
          { num: 1, label: 'Profile & Bio' },
          { num: 2, label: 'e-KYC Verification' },
          { num: 3, label: 'Itinerary & Dates' },
          { num: 4, label: 'DPDP Privacy' }
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-2xl border transition-all ${
              step === s.num
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : step > s.num
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <div className="text-[10px] opacity-80 uppercase tracking-wider">Step {s.num}</div>
            <div className="truncate text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* STEP 1: Personal & Bio Profile */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm space-y-6 animate-in fade-in duration-200 text-xs">
          <div className="font-black text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>Step 1: Personal Identification & Health Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Legal Name (as per Govt ID) *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nationality *</label>
              <select
                value={nationality}
                onChange={(e) => {
                  setNationality(e.target.value);
                  if (e.target.value !== 'Indian') setKycType('PASSPORT_VERIFICATION');
                  else setKycType('AADHAAR_EKYC');
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Indian">Indian Citizen (Domestic)</option>
                <option value="British">British (United Kingdom)</option>
                <option value="American">American (USA)</option>
                <option value="Japanese">Japanese</option>
                <option value="German">German</option>
                <option value="Other International">Other International</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Blood Group (Critical for Rescue Operations)</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white"
              >
                <option value="A+ Positive">A+ Positive</option>
                <option value="A- Negative">A- Negative</option>
                <option value="B+ Positive">B+ Positive</option>
                <option value="B- Negative">B- Negative</option>
                <option value="O+ Positive">O+ Positive</option>
                <option value="O- Negative">O- Negative</option>
                <option value="AB+ Positive">AB+ Positive</option>
                <option value="AB- Negative">AB- Negative</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center space-x-1.5 shadow-sm"
            >
              <span>Continue to e-KYC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: e-KYC Verification */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm space-y-6 animate-in fade-in duration-200 text-xs">
          <div className="font-black text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Step 2: UIDAI Aadhaar / DigiLocker e-KYC Sandbox</span>
            </div>
            <span className="text-xs text-blue-600 font-bold uppercase bg-blue-50 px-2 py-0.5 rounded">
              Sandbox Mode Active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center space-x-2 font-bold cursor-pointer">
              <input
                type="radio"
                name="kycType"
                value="AADHAAR_EKYC"
                checked={kycType === 'AADHAAR_EKYC'}
                onChange={() => setKycType('AADHAAR_EKYC')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Aadhaar e-KYC (Instant OTP Simulation)</span>
            </label>

            <label className="flex items-center space-x-2 font-bold cursor-pointer">
              <input
                type="radio"
                name="kycType"
                value="PASSPORT_VERIFICATION"
                checked={kycType === 'PASSPORT_VERIFICATION'}
                onChange={() => setKycType('PASSPORT_VERIFICATION')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Passport Document Verification</span>
            </label>
          </div>

          {kycType === 'AADHAAR_EKYC' ? (
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">12-Digit Aadhaar Number</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="xxxx xxxx xxxx"
                    className="flex-1 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono"
                  />
                  <button
                    onClick={handleRequestOtp}
                    disabled={kycLoading}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                  >
                    {kycLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                  </button>
                </div>
              </div>

              {isOtpSent && (
                <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="text-blue-800 font-bold">
                    Sandbox OTP Dispatched: Enter <span className="font-mono underline">123456</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className="w-32 p-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-center font-bold text-base"
                    />
                    <span className="text-[11px] text-slate-500">Txn ID: {txnId}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Passport Document Number</label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono"
                />
              </div>
              <div className="text-[11px] text-slate-500">
                Verified against Bureau of Immigration & DigiLocker international transit gateway.
              </div>
            </div>
          )}

          {kycError && (
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl text-xs font-bold">
              {kycError}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Back
            </button>
            <button
              onClick={handleVerifyKyc}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center space-x-1.5 shadow-sm"
            >
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Itinerary & Trip Dates */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm space-y-6 animate-in fade-in duration-200 text-xs">
          <div className="font-black text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Step 3: Trip Dates, Auto-Expiry & Emergency Contacts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trip Start Date (Valid From) *</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Trip End Date (Auto-Expiry & Revocation Date - FR-1.3) *
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-blue-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Contact Name & Relation *</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Contact Phone Number *</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                required
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center space-x-1.5 shadow-sm"
            >
              <span>Privacy & Consent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DPDP Privacy & Consent */}
      {step === 4 && (
        <form onSubmit={handleIssueId} className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm space-y-6 animate-in fade-in duration-200 text-xs">
          <div className="font-black text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>Step 4: DPDP Act 2023 Consent & Granular Tracking Controls</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
            <div className="font-black text-blue-900">
              Opt-In Live Safety Tracking (FR-2.4)
            </div>
            <label className="flex items-center space-x-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={optInTracking}
                onChange={(e) => setOptInTracking(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Enable live GPS geo-fence monitoring during authorized travel period</span>
            </label>

            {optInTracking && (
              <div className="pl-6 space-y-2">
                <div className="text-[11px] text-slate-600 font-semibold">Share Live Location With:</div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="recipients"
                      value="police_and_family"
                      checked={trackingRecipients === 'police_and_family'}
                      onChange={() => setTrackingRecipients('police_and_family')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Police Command + Emergency Contacts</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="recipients"
                      value="police_only"
                      checked={trackingRecipients === 'police_only'}
                      onChange={() => setTrackingRecipients('police_only')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Police Command Only</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600">
            <label className="flex items-start space-x-2 font-semibold cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={dpdpConsentAgreed}
                onChange={(e) => setDpdpConsentAgreed(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                required
              />
              <span>
                I hereby grant consent for Digital Personal Data Protection (DPDP) Act 2023 compliance to verify my identity, anchor travel hashes on the sovereign ledger, and dispatch emergency services if distressed. My data will be automatically purged 30 days post-trip.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isMining || !dpdpConsentAgreed}
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-wider shadow-md shadow-blue-600/20 flex items-center space-x-2"
            >
              {isMining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isMining ? 'Anchoring to Blockchain...' : 'Generate & Anchor Digital ID'}</span>
            </button>
          </div>
        </form>
      )}

      {/* STEP 5: Success & Digital ID Smart Card View */}
      {step === 5 && issuedDigitalId && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-200 shadow-xl space-y-6 animate-in zoom-in duration-300">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              Digital Tourist ID Issued Successfully!
            </h2>
            <p className="text-xs text-slate-500">
              Anchored in Sovereign Ledger Block #{blockchainAnchor?.blockIndex} • SHA-256 Merkle Hash Verified
            </p>
          </div>

          {/* Render 3D Card */}
          <DigitalIdCard digitalId={issuedDigitalId} />

          <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-blue-700 shadow-sm"
            >
              Open Tourist Safety Hub
            </button>
            <button
              onClick={() => setActivePage('blockchain')}
              className="px-6 py-3 rounded-xl bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-slate-700"
            >
              View Blockchain Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
