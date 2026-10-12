import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { blockchainLedger } from '../services/blockchainLedger.js';
import { encryptPII } from '../services/dpdpManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.data = {
      users: [],
      touristIds: [],
      itineraries: [],
      trackingPings: [],
      geofences: [],
      alerts: [],
      efirRecords: [],
      patrolUnits: [],
      wearables: [],
      auditLogs: [],
      advisories: [],
      lostPassports: [],
      grievances: [],
      locationNews: [],
      notificationLogs: []
    };
    this.load();
    if (this.data.users.length === 0) {
      this.seedInitialData();
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading db.json, initializing fresh state:', err);
    }
    if (!this.data.lostPassports) this.data.lostPassports = [];
    if (!this.data.grievances) this.data.grievances = [];
    if (!this.data.notificationLogs) this.data.notificationLogs = [];
    if (!this.data.locationNews || this.data.locationNews.length === 0) {
      this.data.locationNews = this.getDefaultLocationNews();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  getDefaultLocationNews() {
    return [
      {
        id: 'NEWS-2026-001',
        headline: 'BRO Clears Black Ice on NH-13; Night Curfew Enforced From 17:00',
        locationName: 'Sela Pass Corridor (13,700 ft)',
        region: 'Tawang Route, Arunachal Pradesh',
        state: 'Arunachal Pradesh',
        latitude: 27.5052,
        longitude: 92.1039,
        category: 'ROAD_TRANSIT',
        severity: 'CRITICAL',
        sourceAgency: 'Border Roads Organisation (BRO) Project Vartak',
        summary: 'Snow clearing dozers have restored one-way convoy traffic on Sela Pass. Anti-skid chains mandatory for 4x4 vehicles. Civilian traffic strictly halted post 17:00 IST.',
        travelAdvice: 'Transit only in official morning convoys. Ensure adequate anti-freeze, thermal rations, and portable oxygen before leaving Dirang.',
        isBreaking: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-002',
        headline: 'Flash Rain Warning: Wet Trail Alert for Double Decker Root Bridges',
        locationName: 'Nongriat & Cherrapunji Canyon',
        region: 'East Khasi Hills, Meghalaya',
        state: 'Meghalaya',
        latitude: 25.2505,
        longitude: 91.6850,
        category: 'WEATHER_DISASTER',
        severity: 'WARNING',
        sourceAgency: 'IMD Shillong & SDMA Meghalaya',
        summary: 'Sudden precipitation of 85mm recorded. Steps from Tyrna to Nongriat are extremely slippery. Forest department cautionary advisory active.',
        travelAdvice: 'Do not attempt return trek after 16:00. Hire certified local Khasi village guides and carry trekking poles.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-003',
        headline: 'Speed Limit 40 km/h on NH-715 Wildlife Corridors Active via Sensor Cameras',
        locationName: 'Kaziranga National Park (Kohora Range)',
        region: 'Golaghat & Nagaon, Assam',
        state: 'Assam',
        latitude: 26.5800,
        longitude: 93.3800,
        category: 'WILDLIFE_PARKS',
        severity: 'INFO',
        sourceAgency: 'Assam Forest Department (Eastern Wildlife Division)',
        summary: 'Wildlife crossing activity observed between Kohora and Bagori ranges. Automated sensor speed interceptors and patrol squads active.',
        travelAdvice: 'Maintain strict 40 km/h speed limit. Do not alight from tourist vehicles on the highway strip.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-004',
        headline: 'River Ferry & Brahmaputra Aerial Ropeway Running on Normal Schedule',
        locationName: 'Guwahati Inland Waterway Terminal / Ropeway Ghat',
        region: 'Kamrup Metropolitan, Assam',
        state: 'Assam',
        latitude: 26.1850,
        longitude: 91.7450,
        category: 'INFRASTRUCTURE',
        severity: 'INFO',
        sourceAgency: 'Inland Waterways Authority of India (IWAI)',
        summary: 'River water levels stable at 48.2 meters. Passenger ro-pax vessels and aerial ropeway operational till 18:30 IST for Kamakhya-North Guwahati transit.',
        travelAdvice: 'Carry SurakshaYatra Digital Tourist ID for express digital boarding pass scanning at ghat counters.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-005',
        headline: 'Sub-Zero Temperatures (-3°C) Overnight; Mandatory Check-in at Dzukou Rest House',
        locationName: 'Dzukou Valley Alpine Trail (Viswema & Jakhama)',
        region: 'Kohima & Senapati Border, Nagaland',
        state: 'Nagaland',
        latitude: 25.5682,
        longitude: 94.0483,
        category: 'WEATHER_DISASTER',
        severity: 'CRITICAL',
        sourceAgency: 'Nagaland Tourism & Southern Angami Youth Organisation (SAYO)',
        summary: 'Sudden frost front approaching alpine valley. Solo campers must register with SAYO guide desk at Viswema trailhead before ascending.',
        travelAdvice: 'Trekking prohibited after 15:30. Carry high-altitude rated sleeping gear and satellite emergency beacons.',
        isBreaking: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-006',
        headline: 'Shillong Peak Eco-Walk Open; One-Way Traffic Loop from Upper Shillong',
        locationName: 'Shillong Peak & Laitkor Sector',
        region: 'East Khasi Hills, Meghalaya',
        state: 'Meghalaya',
        latitude: 25.5788,
        longitude: 91.8933,
        category: 'ROAD_TRANSIT',
        severity: 'INFO',
        sourceAgency: 'East Khasi Hills Traffic Police & Meghalaya Tourism',
        summary: 'Weekend tourist influx managed with smooth one-way loop. Parking capacity currently at 65%. Viewpoint security desk active.',
        travelAdvice: 'Electronic toll payment via FASTag and SurakshaYatra Tourist ID QR accepted for express vehicle entry.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-007',
        headline: '5km Border Defense Corridor: Valid Inner Line Permit (ILP) Mandatory',
        locationName: 'Longwa Village & Mon Border Corridor',
        region: 'Mon District, Nagaland',
        state: 'Nagaland',
        latitude: 25.8000,
        longitude: 95.0000,
        category: 'CIVIL_SAFETY',
        severity: 'WARNING',
        sourceAgency: 'Assam Rifles & Mon District Magistrate',
        summary: 'Enhanced patrol checkpoints active along international boundary. Tourist movement permitted on designated cultural trail only with registered village guides.',
        travelAdvice: 'Keep SurakshaYatra Digital ID and ILP QR code ready for quick scanning at defense gates.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-008',
        headline: 'Crystal Clear Water Conditions at Dawki; Boatman Safety Gear Mandatory',
        locationName: 'Dawki Umngot River & Tamabil Border Point',
        region: 'West Jaintia Hills, Meghalaya',
        state: 'Meghalaya',
        latitude: 25.1856,
        longitude: 92.0191,
        category: 'WILDLIFE_PARKS',
        severity: 'INFO',
        sourceAgency: 'Meghalaya Tourism Development Corporation (MTDC)',
        summary: 'Visibility depth exceeds 5 meters. All tourist boats equipped with life vests and emergency geo-tags.',
        travelAdvice: 'Avoid crossing designated international maritime buoy line marked with orange flags.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
        verified: true
      }
    ];
  }

  seedInitialData() {
    const salt = bcrypt.genSaltSync(12);
    const defaultPasswordHash = bcrypt.hashSync('Suraksha@2026', salt);

    // 1. Seed Users
    this.data.users = [
      {
        id: 'usr-tourist-01',
        email: 'priya.sharma@example.com',
        passwordHash: defaultPasswordHash,
        fullName: 'Priya Sharma',
        role: 'tourist',
        phone: '+91 98765 43210',
        mfaEnabled: false,
        createdAt: '2026-10-01T08:00:00.000Z'
      },
      {
        id: 'usr-tourist-02',
        email: 'john.miller@example.co.uk',
        passwordHash: defaultPasswordHash,
        fullName: 'John Miller',
        role: 'tourist',
        phone: '+44 7700 900123',
        mfaEnabled: false,
        createdAt: '2026-10-02T10:00:00.000Z'
      },
      {
        id: 'usr-operator-01',
        email: 'operator.airport@surakshayatra.gov.in',
        passwordHash: defaultPasswordHash,
        fullName: 'Inspector Animesh Roy',
        role: 'operator',
        badgeNumber: 'ASM-ENTRY-771',
        stationName: 'Guwahati LGBI Airport Checkpost',
        mfaEnabled: true,
        createdAt: '2026-09-15T09:00:00.000Z'
      },
      {
        id: 'usr-police-01',
        email: 'control.room@police.gov.in',
        passwordHash: defaultPasswordHash,
        fullName: 'DSP Bimal Das',
        role: 'police',
        badgeNumber: 'ASM-POL-009',
        stationName: 'North-East Integrated Command & Control Center (ICCC)',
        mfaEnabled: true,
        createdAt: '2026-09-10T09:00:00.000Z'
      },
      {
        id: 'usr-tourism-01',
        email: 'director@tourism.gov.in',
        passwordHash: defaultPasswordHash,
        fullName: 'Dr. R. K. Hazarika',
        role: 'tourism_official',
        designation: 'Director of Tourism, Northeast Regional Board',
        mfaEnabled: true,
        createdAt: '2026-09-01T09:00:00.000Z'
      },
      {
        id: 'usr-admin-01',
        email: 'admin@surakshayatra.gov.in',
        passwordHash: defaultPasswordHash,
        fullName: 'State Cyber Administrator',
        role: 'admin',
        mfaEnabled: true,
        createdAt: '2026-09-01T00:00:00.000Z'
      }
    ];

    // 2. Seed Tourist IDs
    const touristId1 = {
      touristId: 'TID-NE-2026-88190',
      userId: 'usr-tourist-01',
      fullName: 'Priya Sharma',
      nationality: 'Indian',
      dob: '1994-08-22',
      gender: 'Female',
      bloodGroup: 'B+ Positive',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      kycType: 'AADHAAR_EKYC',
      kycStatus: 'VERIFIED',
      kycHash: 'SHA256:E9B44F8C98218182736154ADBC9902834710129034',
      maskedDocId: '********4321',
      encryptedDocId: encryptPII('998877664321'),
      emergencyContacts: [
        { name: 'Rohit Sharma (Brother)', phone: '+91 98765 11223', relation: 'Brother' },
        { name: 'Dr. Sunita Sharma', phone: '+91 98111 22334', relation: 'Mother' }
      ],
      validFrom: '2026-10-05T00:00:00.000Z',
      validUntil: '2026-10-25T23:59:59.000Z',
      status: 'ACTIVE',
      optInTracking: true,
      trackingRecipients: 'police_and_family',
      pairedWearableId: 'WB-NE-089',
      issuedBy: 'ASM-ENTRY-771 (Guwahati Airport Checkpost)',
      issuedAt: '2026-10-05T09:30:00.000Z',
      lastLocation: {
        latitude: 25.5788,
        longitude: 91.8933,
        locationName: 'Shillong Peak Eco-Trail, Meghalaya',
        timestamp: new Date().toISOString(),
        batteryLevel: 82,
        speedKmh: 4.2
      },
      scheduledCheckIn: {
        isActive: true,
        trekName: 'Dzukou Valley Alpine Trek',
        intervalMinutes: 180,
        dueTime: new Date(Date.now() + 3600000 * 2).toISOString()
      },
      itinerary: [
        { name: 'Guwahati LGBI Airport', lat: 26.1061, lng: 91.5859, arrivalDate: '2026-10-05', status: 'COMPLETED' },
        { name: 'Umiam Lake Viewpoint', lat: 25.6669, lng: 91.8953, arrivalDate: '2026-10-07', status: 'COMPLETED' },
        { name: 'Shillong Peak & Ward\'s Lake', lat: 25.5788, lng: 91.8933, arrivalDate: '2026-10-10', status: 'IN_PROGRESS' },
        { name: 'Cherrapunji Living Root Bridges', lat: 25.2702, lng: 91.7323, arrivalDate: '2026-10-14', status: 'UPCOMING' },
        { name: 'Dawki Umngot River & Border Point', lat: 25.1856, lng: 92.0191, arrivalDate: '2026-10-18', status: 'UPCOMING' }
      ]
    };

    const touristId2 = {
      touristId: 'TID-NE-2026-90412',
      userId: 'usr-tourist-02',
      fullName: 'John Miller',
      nationality: 'British',
      dob: '1988-11-12',
      gender: 'Male',
      bloodGroup: 'O+ Positive',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      kycType: 'PASSPORT_VERIFICATION',
      kycStatus: 'VERIFIED',
      kycHash: 'SHA256:77A23C89DF01128374900192834710129034',
      maskedDocId: 'GB******89',
      encryptedDocId: encryptPII('GB88997789'),
      emergencyContacts: [
        { name: 'Sarah Miller (Spouse)', phone: '+44 7700 900456', relation: 'Spouse' }
      ],
      validFrom: '2026-10-08T00:00:00.000Z',
      validUntil: '2026-10-20T23:59:59.000Z',
      status: 'ACTIVE',
      optInTracking: true,
      trackingRecipients: 'police_only',
      pairedWearableId: null,
      issuedBy: 'ONLINE_SELF_REGISTRATION',
      issuedAt: '2026-10-08T11:00:00.000Z',
      lastLocation: {
        latitude: 27.5861,
        longitude: 91.8594,
        locationName: 'Tawang Monastery Sector, Arunachal Pradesh',
        timestamp: new Date().toISOString(),
        batteryLevel: 45,
        speedKmh: 0.0
      },
      itinerary: [
        { name: 'Tezpur Checkpost', lat: 26.6338, lng: 92.7926, arrivalDate: '2026-10-08', status: 'COMPLETED' },
        { name: 'Bomdila Monastery', lat: 27.2644, lng: 92.4159, arrivalDate: '2026-10-09', status: 'COMPLETED' },
        { name: 'Sela Pass (13,700 ft)', lat: 27.5052, lng: 92.1039, arrivalDate: '2026-10-10', status: 'IN_PROGRESS' },
        { name: 'Tawang Town', lat: 27.5861, lng: 91.8594, arrivalDate: '2026-10-12', status: 'UPCOMING' }
      ]
    };

    this.data.touristIds = [touristId1, touristId2];

    // Anchor Initial Tourist IDs to Blockchain
    blockchainLedger.recordDigitalIdIssuance(touristId1);
    blockchainLedger.recordDigitalIdIssuance(touristId2);

    // 3. Seed Geofences (Northeast India High-Risk & Restricted Zones)
    this.data.geofences = [
      {
        id: 'GF-NE-001',
        name: 'Indo-Myanmar Border 5km Buffer Zone',
        category: 'restricted',
        severity: 'CRITICAL',
        type: 'polygon',
        coordinates: [
          [25.80, 95.00],
          [25.95, 95.35],
          [25.40, 95.25],
          [25.20, 94.90]
        ],
        advisory: 'Strict military restricted border defense corridor. Civilians without special defense passes are subject to immediate detention.',
        safeRouteSuggestion: 'Redirect towards National Highway 29 (Kohima-Dimapur corridor).',
        isActive: true,
        schedule: { allDay: true }
      },
      {
        id: 'GF-NE-002',
        name: 'Dzukou Valley Alpine Freezing Night Curfew',
        category: 'curfew',
        severity: 'HIGH',
        type: 'circle',
        center: { lat: 25.5682, lng: 94.0483 },
        radiusMeters: 4500,
        advisory: 'Extreme sub-zero night temperatures & flash fog hazard. Trekking strictly prohibited between 18:00 and 05:30.',
        safeRouteSuggestion: 'Retreat immediately to Viswema Base Camp or Dzukou Guest Rest House.',
        isActive: true,
        schedule: { allDay: false, startTime: '18:00', endTime: '05:30' }
      },
      {
        id: 'GF-NE-003',
        name: 'Kaziranga Core Sector A - High Flood Hazard Zone',
        category: 'weather_hazard',
        severity: 'HIGH',
        type: 'polygon',
        coordinates: [
          [26.65, 93.30],
          [26.72, 93.55],
          [26.58, 93.60],
          [26.50, 93.35]
        ],
        advisory: 'Brahmaputra seasonal river swelling & wild elephant corridor. Tourist movement restricted without forest patrol escort.',
        safeRouteSuggestion: 'Stay on elevated NH-715 bypass.',
        isActive: true,
        schedule: { allDay: true }
      },
      {
        id: 'GF-NE-004',
        name: 'Sela Pass Avalanche & Blizzard Zone',
        category: 'weather_hazard',
        severity: 'CRITICAL',
        type: 'circle',
        center: { lat: 27.5052, lng: 92.1039 },
        radiusMeters: 6000,
        advisory: 'Heavy snowfall and black ice corridor at 13,700 ft. Night travel restricted.',
        safeRouteSuggestion: 'Halt at Army Transit Camp Baisakhi or Jaswant Garh.',
        isActive: true,
        schedule: { allDay: false, startTime: '17:00', endTime: '06:00' }
      },
      {
        id: 'GF-NE-005',
        name: 'Nongriat Cliff Fall Hazard Zone (Cherrapunji)',
        category: 'high_risk',
        severity: 'MEDIUM',
        type: 'circle',
        center: { lat: 25.2505, lng: 91.6850 },
        radiusMeters: 2500,
        advisory: 'Steep 3,500 stairs slippery canyon terrain. Flash flooding in monsoon.',
        safeRouteSuggestion: 'Hire certified local Khasi guide and carry trekking pole.',
        isActive: true,
        schedule: { allDay: true }
      }
    ];

    // 4. Seed Active Alerts
    this.data.alerts = [
      {
        id: 'ALT-2026-9901',
        touristId: 'TID-NE-2026-88190',
        touristName: 'Priya Sharma',
        type: 'PANIC_SOS',
        severity: 'CRITICAL',
        status: 'DISPATCHED',
        latitude: 25.5788,
        longitude: 91.8933,
        locationName: 'Shillong Peak Forest Sector 4',
        district: 'East Khasi Hills',
        batteryLevel: 24,
        assignedUnitId: 'UNIT-SHL-04',
        assignedUnitName: 'Shillong Quick Response Team (QRT-04)',
        estimatedEtaMinutes: 8,
        reportedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        notes: 'Tourist activated Panic SOS via app. Unit 04 en route with medical kit.',
        timeline: [
          { time: new Date(Date.now() - 1000 * 60 * 12).toISOString(), action: 'Panic SOS button triggered by tourist' },
          { time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), action: 'Control Room Officer acknowledged alert' },
          { time: new Date(Date.now() - 1000 * 60 * 9).toISOString(), action: 'Dispatched QRT-04 (Sub-Inspector M. Sangma)' }
        ]
      },
      {
        id: 'ALT-2026-9902',
        touristId: 'TID-NE-2026-90412',
        touristName: 'John Miller',
        type: 'GEOFENCE_BREACH',
        severity: 'HIGH',
        status: 'ACKNOWLEDGED',
        latitude: 27.5052,
        longitude: 92.1039,
        locationName: 'Sela Pass Blizzard Zone',
        district: 'Tawang',
        batteryLevel: 45,
        assignedUnitId: null,
        reportedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        notes: 'Tourist vehicle entered Sela Pass curfew zone past 17:00.',
        timeline: [
          { time: new Date(Date.now() - 1000 * 60 * 25).toISOString(), action: 'Geofence breach detected (Sela Pass curfew)' },
          { time: new Date(Date.now() - 1000 * 60 * 20).toISOString(), action: 'Automated SMS advisory dispatched to tourist' }
        ]
      }
    ];

    // 5. Seed Patrol Units
    this.data.patrolUnits = [
      {
        id: 'UNIT-SHL-04',
        name: 'Shillong QRT Unit 04',
        type: 'Police Quick Response Vehicle',
        officerInCharge: 'SI M. Sangma',
        phone: '+91 94361 00223',
        status: 'ON_MISSION',
        assignedIncidentId: 'ALT-2026-9901',
        latitude: 25.5740,
        longitude: 91.8880,
        currentSector: 'Shillong Peak Road'
      },
      {
        id: 'UNIT-GHY-01',
        name: 'Guwahati City Patrol 01',
        type: 'Highway Interceptor',
        officerInCharge: 'Inspector K. Borah',
        phone: '+91 94350 11990',
        status: 'AVAILABLE',
        assignedIncidentId: null,
        latitude: 26.1445,
        longitude: 91.7362,
        currentSector: 'GS Road / Khanapara'
      },
      {
        id: 'UNIT-TWG-02',
        name: 'Tawang High-Altitude Rescue Squad',
        type: '4x4 Mountain Ambulance & Rescue',
        officerInCharge: 'Capt. T. Norbu',
        phone: '+91 94360 88712',
        status: 'AVAILABLE',
        assignedIncidentId: null,
        latitude: 27.5861,
        longitude: 91.8594,
        currentSector: 'Tawang Valley'
      },
      {
        id: 'UNIT-KZG-03',
        name: 'Kaziranga Forest Protection QRT',
        type: 'Riverine & Forest Unit',
        officerInCharge: 'Range Officer P. Gogoi',
        phone: '+91 94351 77234',
        status: 'PATROLLING',
        assignedIncidentId: null,
        latitude: 26.5800,
        longitude: 93.3800,
        currentSector: 'Kohora Range'
      }
    ];

    // 6. Seed IoT Wearables
    this.data.wearables = [
      {
        id: 'WB-NE-089',
        model: 'SurakshaBand v2 (LoRa + GPS + HeartRate)',
        status: 'ASSIGNED',
        assignedTouristId: 'TID-NE-2026-88190',
        batteryPct: 88,
        heartRateBpm: 76,
        sosButtonState: 'NORMAL',
        fallDetected: false,
        lastHeartbeat: new Date().toISOString()
      },
      {
        id: 'WB-NE-090',
        model: 'SurakshaBand v2 (LoRa + GPS + HeartRate)',
        status: 'AVAILABLE_AT_CHECKPOINT',
        assignedTouristId: null,
        batteryPct: 100,
        heartRateBpm: 0,
        sosButtonState: 'NORMAL',
        fallDetected: false,
        lastHeartbeat: new Date().toISOString()
      },
      {
        id: 'WB-NE-091',
        model: 'SurakshaTag Lite (Satellite Beacon)',
        status: 'AVAILABLE_AT_CHECKPOINT',
        assignedTouristId: null,
        batteryPct: 95,
        heartRateBpm: 0,
        sosButtonState: 'NORMAL',
        fallDetected: false,
        lastHeartbeat: new Date().toISOString()
      }
    ];

    // 7. Seed Broadcast Advisories
    this.data.advisories = [
      {
        id: 'ADV-2026-101',
        title: 'IMD Orange Alert: Heavy Rain in East Khasi Hills',
        region: 'Meghalaya (Shillong & Cherrapunji)',
        severity: 'WARNING',
        issuedBy: 'State Disaster Management Authority (SDMA)',
        message: 'Intense spells of rain expected over next 24 hours. Avoid single root bridge trails and mountain riverbanks.',
        publishedAt: '2026-10-10T06:00:00.000Z'
      },
      {
        id: 'ADV-2026-102',
        title: 'Night Travel Curfew Active: Sela Pass Corridor',
        region: 'Arunachal Pradesh (Tawang Route)',
        severity: 'CRITICAL',
        issuedBy: 'District Magistrate Office, West Kameng',
        message: 'Sela Pass (NH-13) closed for civilian transit between 17:00 and 06:00 due to black ice and freezing fog.',
        publishedAt: '2026-10-10T08:00:00.000Z'
      }
    ];

    // 8. Seed DPDP Audit Logs
    this.data.auditLogs = [
      {
        id: 'AUD-901',
        timestamp: '2026-10-05T09:30:15.000Z',
        userId: 'usr-operator-01',
        userRole: 'operator',
        action: 'DIGITAL_ID_ISSUED',
        targetResource: 'TID-NE-2026-88190',
        ipAddress: '10.14.2.89',
        details: 'Issued Digital Tourist ID after Aadhaar e-KYC biometric check at LGBI Airport.'
      },
      {
        id: 'AUD-902',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        userId: 'usr-police-01',
        userRole: 'police',
        action: 'SENSITIVE_RECORD_INSPECTED',
        targetResource: 'TID-NE-2026-88190',
        ipAddress: '10.200.1.12',
        details: 'Authorized inspection of medical notes & emergency contacts upon Panic SOS trigger.'
      }
    ];

    // 9. Seed Location-Based News Reports
    this.data.locationNews = [
      {
        id: 'NEWS-2026-001',
        headline: 'BRO Clears Black Ice on NH-13; Night Curfew Enforced From 17:00',
        locationName: 'Sela Pass Corridor (13,700 ft)',
        region: 'Tawang Route, Arunachal Pradesh',
        state: 'Arunachal Pradesh',
        latitude: 27.5052,
        longitude: 92.1039,
        category: 'ROAD_TRANSIT',
        severity: 'CRITICAL',
        sourceAgency: 'Border Roads Organisation (BRO) Project Vartak',
        summary: 'Snow clearing dozers have restored one-way convoy traffic on Sela Pass. Anti-skid chains mandatory for 4x4 vehicles. Civilian traffic strictly halted post 17:00 IST.',
        travelAdvice: 'Transit only in official morning convoys. Ensure adequate anti-freeze, thermal rations, and portable oxygen before leaving Dirang.',
        isBreaking: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-002',
        headline: 'Flash Rain Warning: Wet Trail Alert for Double Decker Root Bridges',
        locationName: 'Nongriat & Cherrapunji Canyon',
        region: 'East Khasi Hills, Meghalaya',
        state: 'Meghalaya',
        latitude: 25.2505,
        longitude: 91.6850,
        category: 'WEATHER_DISASTER',
        severity: 'WARNING',
        sourceAgency: 'IMD Shillong & SDMA Meghalaya',
        summary: 'Sudden precipitation of 85mm recorded. Steps from Tyrna to Nongriat are extremely slippery. Forest department cautionary advisory active.',
        travelAdvice: 'Do not attempt return trek after 16:00. Hire certified local Khasi village guides and carry trekking poles.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-003',
        headline: 'Speed Limit 40 km/h on NH-715 Wildlife Corridors Active via Sensor Cameras',
        locationName: 'Kaziranga National Park (Kohora Range)',
        region: 'Golaghat & Nagaon, Assam',
        state: 'Assam',
        latitude: 26.5800,
        longitude: 93.3800,
        category: 'WILDLIFE_PARKS',
        severity: 'INFO',
        sourceAgency: 'Assam Forest Department (Eastern Wildlife Division)',
        summary: 'Wildlife crossing activity observed between Kohora and Bagori ranges. Automated sensor speed interceptors and patrol squads active.',
        travelAdvice: 'Maintain strict 40 km/h speed limit. Do not alight from tourist vehicles on the highway strip.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-004',
        headline: 'River Ferry & Brahmaputra Aerial Ropeway Running on Normal Schedule',
        locationName: 'Guwahati Inland Waterway Terminal / Ropeway Ghat',
        region: 'Kamrup Metropolitan, Assam',
        state: 'Assam',
        latitude: 26.1850,
        longitude: 91.7450,
        category: 'INFRASTRUCTURE',
        severity: 'INFO',
        sourceAgency: 'Inland Waterways Authority of India (IWAI)',
        summary: 'River water levels stable at 48.2 meters. Passenger ro-pax vessels and aerial ropeway operational till 18:30 IST for Kamakhya-North Guwahati transit.',
        travelAdvice: 'Carry SurakshaYatra Digital Tourist ID for express digital boarding pass scanning at ghat counters.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-005',
        headline: 'Sub-Zero Temperatures (-3°C) Overnight; Mandatory Check-in at Dzukou Rest House',
        locationName: 'Dzukou Valley Alpine Trail (Viswema & Jakhama)',
        region: 'Kohima & Senapati Border, Nagaland',
        state: 'Nagaland',
        latitude: 25.5682,
        longitude: 94.0483,
        category: 'WEATHER_DISASTER',
        severity: 'CRITICAL',
        sourceAgency: 'Nagaland Tourism & Southern Angami Youth Organisation (SAYO)',
        summary: 'Sudden frost front approaching alpine valley. Solo campers must register with SAYO guide desk at Viswema trailhead before ascending.',
        travelAdvice: 'Trekking prohibited after 15:30. Carry high-altitude rated sleeping gear and satellite emergency beacons.',
        isBreaking: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-006',
        headline: 'Shillong Peak Eco-Walk Open; One-Way Traffic Loop from Upper Shillong',
        locationName: 'Shillong Peak & Laitkor Sector',
        region: 'East Khasi Hills, Meghalaya',
        state: 'Meghalaya',
        latitude: 25.5788,
        longitude: 91.8933,
        category: 'ROAD_TRANSIT',
        severity: 'INFO',
        sourceAgency: 'East Khasi Hills Traffic Police & Meghalaya Tourism',
        summary: 'Weekend tourist influx managed with smooth one-way loop. Parking capacity currently at 65%. Viewpoint security desk active.',
        travelAdvice: 'Electronic toll payment via FASTag and SurakshaYatra Tourist ID QR accepted for express vehicle entry.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-007',
        headline: '5km Border Defense Corridor: Valid Inner Line Permit (ILP) Mandatory',
        locationName: 'Longwa Village & Mon Border Corridor',
        region: 'Mon District, Nagaland',
        state: 'Nagaland',
        latitude: 25.8000,
        longitude: 95.0000,
        category: 'CIVIL_SAFETY',
        severity: 'WARNING',
        sourceAgency: 'Assam Rifles & Mon District Magistrate',
        summary: 'Enhanced patrol checkpoints active along international boundary. Tourist movement permitted on designated cultural trail only with registered village guides.',
        travelAdvice: 'Keep SurakshaYatra Digital ID and ILP QR code ready for quick scanning at defense gates.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
        verified: true
      },
      {
        id: 'NEWS-2026-008',
        headline: 'Crystal Clear Water Conditions at Dawki; Boatman Safety Gear Mandatory',
        locationName: 'Dawki Umngot River & Tamabil Border Point',
        region: 'West Jaintia Hills, Meghalaya',
        state: 'Meghalaya',
        latitude: 25.1856,
        longitude: 92.0191,
        category: 'WILDLIFE_PARKS',
        severity: 'INFO',
        sourceAgency: 'Meghalaya Tourism Development Corporation (MTDC)',
        summary: 'Visibility depth exceeds 5 meters. All tourist boats equipped with life vests and emergency geo-tags.',
        travelAdvice: 'Avoid crossing designated international maritime buoy line marked with orange flags.',
        isBreaking: false,
        publishedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
        verified: true
      }
    ];

    this.save();
  }
}

export const db = new Database();
