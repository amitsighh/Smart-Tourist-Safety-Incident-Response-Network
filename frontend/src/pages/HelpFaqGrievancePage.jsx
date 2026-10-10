import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  HelpCircle,
  ShieldCheck,
  PhoneCall,
  Lock,
  FileQuestion,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  AlertTriangle,
  Globe,
  Building2,
  ExternalLink,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Printer,
  Copy,
  Check,
  Sparkles,
  LifeBuoy
} from 'lucide-react';

export default function HelpFaqGrievancePage() {
  const [activeTab, setActiveTab] = useState('lost-passport'); // 'lost-passport' | 'track' | 'grievance' | 'directory' | 'faqs'
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // --- Lost Passport Form State ---
  const [lpName, setLpName] = useState('');
  const [lpNationality, setLpNationality] = useState('United Kingdom');
  const [lpPhone, setLpPhone] = useState('');
  const [lpEmail, setLpEmail] = useState('');
  const [lpLocation, setLpLocation] = useState('');
  const [lpDate, setLpDate] = useState(new Date().toISOString().split('T')[0]);
  const [lpPassportMasked, setLpPassportMasked] = useState('');
  const [lpIssuingCountry, setLpIssuingCountry] = useState('United Kingdom');
  const [lpEmbassyContacted, setLpEmbassyContacted] = useState(false);
  const [lpPoliceStation, setLpPoliceStation] = useState('');
  const [lpDetails, setLpDetails] = useState('');
  const [lpLoading, setLpLoading] = useState(false);
  const [lpResult, setLpResult] = useState(null);
  const [lpError, setLpError] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // --- Case Tracking State ---
  const [searchCaseId, setSearchCaseId] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackedCase, setTrackedCase] = useState(null);
  const [trackError, setTrackError] = useState(null);

  // --- Grievance Form State ---
  const [grvName, setGrvName] = useState('');
  const [grvEmail, setGrvEmail] = useState('');
  const [grvPhone, setGrvPhone] = useState('');
  const [grvCategory, setGrvCategory] = useState('Safety Concern / Hazard Report');
  const [grvLocation, setGrvLocation] = useState('');
  const [grvUrgency, setGrvUrgency] = useState('Urgent');
  const [grvDesc, setGrvDesc] = useState('');
  const [grvLoading, setGrvLoading] = useState(false);
  const [grvResult, setGrvResult] = useState(null);
  const [grvError, setGrvError] = useState(null);

  // --- Directory State ---
  const [directory, setDirectory] = useState(null);

  useEffect(() => {
    api.getConsularResources()
      .then((res) => {
        if (res.success && res.resources) {
          setDirectory(res.resources);
        }
      })
      .catch(console.error);
  }, []);

  // Handle Lost Passport Submit
  const handleLostPassportSubmit = async (e) => {
    e.preventDefault();
    setLpLoading(true);
    setLpError(null);
    try {
      const res = await api.submitLostPassportReport({
        applicantName: lpName,
        nationality: lpNationality,
        contactPhone: lpPhone,
        email: lpEmail,
        lastKnownLocation: lpLocation,
        incidentDate: lpDate,
        passportNumberMasked: lpPassportMasked,
        issuingCountry: lpIssuingCountry,
        embassyContacted: lpEmbassyContacted,
        policeStationVisited: lpPoliceStation,
        details: lpDetails
      });

      if (res.success) {
        setLpResult(res.case);
      } else {
        setLpError(res.error || 'Failed to submit report.');
      }
    } catch (err) {
      setLpError(err.message || 'Network error.');
    } finally {
      setLpLoading(false);
    }
  };

  // Handle Grievance Submit
  const handleGrievanceSubmit = async (e) => {
    e.preventDefault();
    setGrvLoading(true);
    setGrvError(null);
    try {
      const res = await api.submitGrievance({
        touristName: grvName,
        contactEmail: grvEmail,
        contactPhone: grvPhone,
        category: grvCategory,
        location: grvLocation,
        urgency: grvUrgency,
        description: grvDesc
      });

      if (res.success) {
        setGrvResult(res.grievance);
      } else {
        setGrvError(res.error || 'Failed to submit grievance.');
      }
    } catch (err) {
      setGrvError(err.message || 'Network error.');
    } finally {
      setGrvLoading(false);
    }
  };

  // Handle Track Case
  const handleTrackCase = async (idToSearch) => {
    const query = (idToSearch || searchCaseId).trim();
    if (!query) return;
    setTrackLoading(true);
    setTrackError(null);
    setTrackedCase(null);
    try {
      const res = await api.trackCase(query);
      if (res.found && res.data) {
        setTrackedCase({ ...res.data, caseType: res.caseType });
      } else {
        setTrackError(res.error || `No record found for reference "${query}".`);
      }
    } catch (err) {
      setTrackError('Could not find case record with this reference.');
    } finally {
      setTrackLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const faqs = [
    {
      q: 'What should I do immediately if I lose my passport while traveling in India?',
      a: 'First, file a Lost Passport Report right here on SurakshaYatra to generate an instant state police tracking token (LP-2026-XXXX). Then, obtain your official police Lost Document Report (LDR). If you are a foreign national, immediately notify your embassy/consulate to request an Emergency Travel Document / Emergency Certificate, and apply for an Exit Permit via the Ministry of Home Affairs e-FRRO portal (indianfrro.gov.in).'
    },
    {
      q: 'What is the Digital Tourist ID and how does it protect me?',
      a: 'The Digital Tourist ID is a time-bound, cryptographically verifiable digital credential issued at entry checkpoints. It holds your verified e-KYC hash and emergency contacts. During emergencies or lost document scenarios, authorities can instantly verify your authorized transit status without needing paper documents.'
    },
    {
      q: 'How does SurakshaYatra safeguard my privacy under the DPDP Act 2023?',
      a: 'All sensitive personally identifiable information (Aadhaar numbers, unmasked passport numbers, and phone numbers) is encrypted off-chain using AES-256-GCM. Only non-reversible SHA-256 Merkle hashes are anchored on the blockchain ledger. GPS tracking is 100% opt-in and all trip data is automatically anonymized 30 days after trip completion.'
    },
    {
      q: 'How does the Emergency Panic SOS work in remote mountain zones with no mobile network?',
      a: 'The mobile app generates an encrypted Offline SMS Fallback payload and buffers emergency pings locally. In remote sectors (e.g. Dzukou Valley or Sela Pass), checkpoint-distributed LoRa/Satellite IoT receivers continuously monitor safety heartbeats and relay SOS alerts directly to regional police command.'
    },
    {
      q: 'What are Geo-Fence Caution Zones and how am I alerted?',
      a: 'Geo-fences are virtual geographic polygons enclosing restricted defense corridors (e.g. Indo-Myanmar 5km buffer), night freeze curfews (Dzukou Valley), and flood-prone wildlife sectors. If you approach these zones, your app provides automated caution advisories and suggests safe alternative detours.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
          <span>SurakshaYatra Tourist Support & Consular Liaison Cell</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Help Desk, Lost Passport Assistance & Grievances
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Official 24/7 tourist safety assistance, consular coordination, instant lost passport emergency tracking, and rapid grievance redressal under Govt. of India standards.
        </p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white rounded-2xl border border-blue-100 shadow-xs max-w-4xl mx-auto">
        <button
          onClick={() => setActiveTab('lost-passport')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'lost-passport'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Lost Passport Assistance</span>
        </button>

        <button
          onClick={() => setActiveTab('track')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'track'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Track Case / Ticket Status</span>
        </button>

        <button
          onClick={() => setActiveTab('grievance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'grievance'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Lodge Grievance</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'directory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Consulates & FRRO Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'faqs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          <span>FAQs & DPDP Privacy</span>
        </button>
      </div>

      {/* TAB 1: LOST PASSPORT ASSISTANCE WORKFLOW */}
      {activeTab === 'lost-passport' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* STEP-BY-STEP ADVISORY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* For Foreign Nationals */}
            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-blue-700 font-black text-sm">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>For International Tourists / Foreign Nationals</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Follow this mandatory standard operating procedure if your passport is lost or stolen in India:
              </p>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-100">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <span className="font-bold text-slate-900">File SurakshaYatra Loss Report:</span> Fill the form below to alert the State Tourist Police Cell and obtain a digital Case ID.
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-100">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <span className="font-bold text-slate-900">Collect Police LDR Certificate:</span> Obtain the physical/digital Lost Document Report from the nearest Tourist Police outpost.
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-100">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <span className="font-bold text-slate-900">Contact Your Embassy / Consulate:</span> Apply for an Emergency Certificate (EC) or replacement passport with the LDR copy.
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-100">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <span className="font-bold text-slate-900">e-FRRO Exit Permit:</span> Submit an online Exit Visa application at <a href="https://indianfrro.gov.in" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">indianfrro.gov.in</a> before international departure.
                  </div>
                </div>
              </div>
            </div>

            {/* For Indian Citizens */}
            <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-indigo-700 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>For Indian Citizens (Domestic / In-Transit)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you lose your Indian passport or government ID document during travel in the Northeast region:
              </p>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <span className="font-bold text-slate-900">Register Loss Report:</span> Submit the loss details below to block misused credentials and alert local checkposts.
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <span className="font-bold text-slate-900">Passport Seva Kendra (PSK):</span> Book an urgent appointment for re-issuance under Tatkaal scheme on <a href="https://passportindia.gov.in" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">passportindia.gov.in</a>.
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <span className="font-bold text-slate-900">Carry Annexure-F & Identity Proof:</span> Present standard affidavit of lost passport along with your SurakshaYatra Digital ID.
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <span className="font-bold text-slate-900">Transit Verification:</span> Your active Digital Tourist ID serves as a valid photo credential across domestic hotel and airport desks.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REPORT SUBMISSION FORM OR SUCCESS CONFIRMATION */}
          {lpResult ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-400 shadow-md space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      Lost Passport Assistance Case Registered
                    </h2>
                    <p className="text-xs text-slate-500">
                      Case dispatched to Northeast Tourist Police Special Assistance Desk (Guwahati HQ).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(lpResult.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied ID' : 'Copy Case ID'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Acknowledgment</span>
                  </button>
                </div>
              </div>

              {/* Case Details Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Case Reference ID:</span>
                  <span className="font-mono font-black text-base text-blue-700">{lpResult.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Applicant Name:</span>
                  <span className="font-bold text-slate-900">{lpResult.applicantName} ({lpResult.nationality})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                    {lpResult.status}
                  </span>
                </div>
              </div>

              {/* Actionable Next Steps Checklist */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Immediate Actionable Checklist For Applicant</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {lpResult.nextSteps?.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-slate-800 leading-relaxed font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setLpResult(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
                >
                  File Another Report
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Official Lost Passport / Travel Document Report Form</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  All submissions are immediately logged with the North-East Tourist Police Control Room and shared with consular liaison officers.
                </p>
              </div>

              {lpError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{lpError}</span>
                </div>
              )}

              <form onSubmit={handleLostPassportSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Applicant Full Name *
                    </label>
                    <input
                      type="text"
                      value={lpName}
                      onChange={(e) => setLpName(e.target.value)}
                      placeholder="e.g. Lucas Vance"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nationality *
                    </label>
                    <select
                      value={lpNationality}
                      onChange={(e) => {
                        setLpNationality(e.target.value);
                        setLpIssuingCountry(e.target.value);
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="Indian">Indian Citizen</option>
                      <option value="Other Foreign National">Other Foreign National</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Contact Phone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={lpPhone}
                      onChange={(e) => setLpPhone(e.target.value)}
                      placeholder="e.g. +44 7700 900888"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={lpEmail}
                      onChange={(e) => setLpEmail(e.target.value)}
                      placeholder="e.g. lucas.vance@example.com"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Last Known Location / Trail *
                    </label>
                    <input
                      type="text"
                      value={lpLocation}
                      onChange={(e) => setLpLocation(e.target.value)}
                      placeholder="e.g. Cherrapunji Living Root Bridge, Meghalaya"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Estimated Date of Loss *
                    </label>
                    <input
                      type="date"
                      value={lpDate}
                      onChange={(e) => setLpDate(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Masked Passport No. (e.g. GB***912)
                    </label>
                    <input
                      type="text"
                      value={lpPassportMasked}
                      onChange={(e) => setLpPassportMasked(e.target.value)}
                      placeholder="e.g. GB****89"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Issuing Country
                    </label>
                    <input
                      type="text"
                      value={lpIssuingCountry}
                      onChange={(e) => setLpIssuingCountry(e.target.value)}
                      placeholder="e.g. United Kingdom"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nearest Police Station Visited
                    </label>
                    <input
                      type="text"
                      value={lpPoliceStation}
                      onChange={(e) => setLpPoliceStation(e.target.value)}
                      placeholder="e.g. Sohra Tourist Police Outpost"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">
                    Loss Circumstances / Key Details
                  </label>
                  <textarea
                    value={lpDetails}
                    onChange={(e) => setLpDetails(e.target.value)}
                    rows={3}
                    placeholder="Describe where and how the document was lost or misplaced..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="embassyCheck"
                    checked={lpEmbassyContacted}
                    onChange={(e) => setLpEmbassyContacted(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="embassyCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                    I have already initiated contact with my country's Embassy / Consulate in India.
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={lpLoading}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {lpLoading ? (
                      <span>Submitting Report...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Lost Document Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: TRACK ANY CASE / TICKET STATUS */}
      {activeTab === 'track' && (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-600" />
                <span>Real-Time Case & Grievance Status Tracker</span>
              </h2>
              <p className="text-xs text-slate-500">
                Track real-time progress for Lost Passport Cases (LP-XXXX), Grievance Tickets (GRV-XXXX), or Emergency Alert IDs (ALT-XXXX).
              </p>
            </div>

            {/* Quick Demo Reference Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Quick Search Demos:</span>
              <button
                onClick={() => {
                  setSearchCaseId('LP-2026-3304');
                  handleTrackCase('LP-2026-3304');
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono font-bold border border-blue-200"
              >
                LP-2026-3304 (Lost Passport)
              </button>
              <button
                onClick={() => {
                  setSearchCaseId('ALT-2026-9901');
                  handleTrackCase('ALT-2026-9901');
                }}
                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-mono font-bold border border-red-200"
              >
                ALT-2026-9901 (SOS Dispatch)
              </button>
              <button
                onClick={() => {
                  setSearchCaseId('ALT-2026-9902');
                  handleTrackCase('ALT-2026-9902');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono font-bold border border-amber-200"
              >
                ALT-2026-9902 (Geofence Breach)
              </button>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchCaseId}
                onChange={(e) => setSearchCaseId(e.target.value)}
                placeholder="Enter Reference (e.g. LP-2026-3304, GRV-2026-9912, ALT-2026-9901)"
                className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                onClick={() => handleTrackCase()}
                disabled={trackLoading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{trackLoading ? 'Searching...' : 'Track'}</span>
              </button>
            </div>

            {/* Error Message */}
            {trackError && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            {/* Tracked Case Result Card */}
            {trackedCase && (
              <div className="p-6 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-6 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-base font-black text-blue-800">
                      {trackedCase.id || trackedCase.firNumber}
                    </span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-600 text-white uppercase">
                      {trackedCase.caseType?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    Status: <span className="text-emerald-700 uppercase">{trackedCase.status}</span>
                  </div>
                </div>

                {/* Grid Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Subject / Applicant:</span>
                    <span className="font-bold text-slate-900">{trackedCase.applicantName || trackedCase.touristName || 'Tourist'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Handling Authority:</span>
                    <span className="font-bold text-slate-900">{trackedCase.assignedDesk || trackedCase.assignedAuthority || trackedCase.assignedUnitName || 'State Tourist Police Control'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Incident / Report Time:</span>
                    <span className="font-medium text-slate-700">
                      {trackedCase.createdAt || trackedCase.reportedAt ? new Date(trackedCase.createdAt || trackedCase.reportedAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Timeline History */}
                {trackedCase.timeline && trackedCase.timeline.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Action Timeline & Investigation Audit</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      {trackedCase.timeline.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-white border border-blue-100 shadow-2xs">
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5"></div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{item.title || item.action}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-normal">
                                {item.time ? new Date(item.time).toLocaleTimeString() : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{item.description || item.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LODGE GRIEVANCE */}
      {activeTab === 'grievance' && (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Lodge Official Tourist Grievance or Safety Hazard</span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct statutory grievance submission to the North-East State Tourism Redressal & Tourist Police Joint Cell.
              </p>
            </div>

            {grvResult ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-black text-slate-900">Grievance Ticket Lodged Successfully</h3>
                <div className="font-mono text-lg font-bold text-emerald-800">{grvResult.id}</div>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your ticket is under review by {grvResult.assignedAuthority}. Expected SLA: {grvResult.estimatedResolutionHours} hours.
                </p>
                <button
                  onClick={() => setGrvResult(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Lodge Another Grievance
                </button>
              </div>
            ) : (
              <form onSubmit={handleGrievanceSubmit} className="space-y-4 text-xs">
                {grvError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                    {grvError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      value={grvName}
                      onChange={(e) => setGrvName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={grvEmail}
                      onChange={(e) => setGrvEmail(e.target.value)}
                      placeholder="e.g. priya@example.com"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={grvPhone}
                      onChange={(e) => setGrvPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={grvCategory}
                      onChange={(e) => setGrvCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white"
                    >
                      <option value="Safety Concern / Hazard Report">Safety Concern / Hazard Report</option>
                      <option value="Harassment / Unsafe Conduct">Harassment / Unsafe Conduct</option>
                      <option value="Overcharging / Fraud">Overcharging / Vendor Fraud</option>
                      <option value="Infrastructure / Road Hazard">Infrastructure / Road Hazard</option>
                      <option value="DPDP Privacy & Consent">DPDP Privacy & Consent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Urgency</label>
                    <select
                      value={grvUrgency}
                      onChange={(e) => setGrvUrgency(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white"
                    >
                      <option value="Normal">Normal (48h Resolution)</option>
                      <option value="Urgent">Urgent (24h Resolution)</option>
                      <option value="Critical">Critical (12h Priority)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incident / Concern Location *</label>
                  <input
                    type="text"
                    value={grvLocation}
                    onChange={(e) => setGrvLocation(e.target.value)}
                    placeholder="e.g. Umiam Lake Viewpoint or Kaziranga Checkpost"
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                  <textarea
                    value={grvDesc}
                    onChange={(e) => setGrvDesc(e.target.value)}
                    rows={4}
                    placeholder="Please explain the issue or grievance in detail..."
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={grvLoading}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{grvLoading ? 'Lodging...' : 'Lodge Grievance'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONSULAR & FRRO DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Helplines Strip */}
          <div className="space-y-3">
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <PhoneCall className="w-5 h-5 text-red-600" />
              <span>National & Northeast Emergency Helplines</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {directory?.emergencyHelplines?.map((h, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">{h.name}</span>
                    <a
                      href={`tel:${h.number.split('/')[0].trim()}`}
                      className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-mono font-black border border-red-200 hover:bg-red-100"
                    >
                      {h.number}
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-600">{h.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FRRO Offices */}
          <div className="space-y-3">
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Foreigners Regional Registration Offices (FRRO)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {directory?.frroOffices?.map((f, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-2">
                  <div className="font-extrabold text-sm text-blue-900">{f.city}</div>
                  <div className="text-slate-700 text-[11px] leading-relaxed flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{f.address}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1 text-slate-600">
                    <span><strong>Phone:</strong> {f.contact}</span>
                    <span><strong>Email:</strong> {f.email}</span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-semibold pt-1">
                    Services: {f.services}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Foreign Embassies & Consulates */}
          <div className="space-y-3">
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>Foreign Diplomatic Missions in India (Consular Assistance)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {directory?.foreignEmbassiesInIndia?.map((emb, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">{emb.country}</span>
                      <a
                        href={emb.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="Official Mission Website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="font-bold text-[11px] text-blue-800">{emb.mission}</div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">{emb.address}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                    <div><strong>Emergency:</strong> {emb.phone}</div>
                    <div className="truncate"><strong>Email:</strong> {emb.emergencyEmail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: FAQS & DPDP PRIVACY */}
      {activeTab === 'faqs' && (
        <div className="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-200">
          <div className="space-y-1 text-center mb-4">
            <h2 className="text-lg font-black text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Key knowledge points for tourists, guides, and authorities.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-blue-100 bg-white overflow-hidden text-xs shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-extrabold text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 text-[11px]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
