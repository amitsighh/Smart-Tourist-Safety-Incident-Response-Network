import { db } from '../models/db.js';

export const helpController = {
  // 1. Submit Lost Passport Assistance Report
  submitLostPassportReport: async (req, res) => {
    try {
      const {
        applicantName,
        nationality = 'Foreign National',
        contactPhone,
        email,
        lastKnownLocation,
        incidentDate,
        passportNumberMasked,
        issuingCountry,
        embassyContacted = false,
        policeStationVisited = '',
        details
      } = req.body;

      if (!applicantName || !contactPhone || !email || !lastKnownLocation) {
        return res.status(400).json({
          error: 'Missing required fields: Name, Phone, Email, and Last Known Location are required.'
        });
      }

      const caseId = `LP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      const nextSteps = [
        'Collect your official Lost Document Report (LDR) acknowledgment from the designated Tourist Police station.',
        nationality === 'Indian'
          ? 'Apply for a duplicate passport at Passport Seva Kendra (PSK) or Regional Passport Office (RPO).'
          : `Contact the Embassy/Consulate of ${issuingCountry || 'your home country'} in India for an Emergency Travel Document / Emergency Certificate (EC).`,
        nationality !== 'Indian'
          ? 'File an online Exit Visa / Visa Regularization application on the official e-FRRO Portal (indianfrro.gov.in).'
          : 'Notify your travel insurance provider with the LP reference number for emergency claim processing.',
        'Keep your SurakshaYatra Digital Tourist ID active as temporary travel identification within authorized transit zones.'
      ];

      const record = {
        id: caseId,
        type: 'LOST_PASSPORT',
        applicantName,
        nationality,
        contactPhone,
        email,
        lastKnownLocation,
        incidentDate: incidentDate || now.split('T')[0],
        passportNumberMasked: passportNumberMasked || 'XXXX-XXXX',
        issuingCountry: issuingCountry || (nationality === 'Indian' ? 'India' : 'Foreign'),
        embassyContacted: Boolean(embassyContacted),
        policeStationVisited: policeStationVisited || 'Pending Assignment',
        details: details || '',
        status: 'RECEIVED',
        assignedDesk: 'State Tourist Police Special Assistance Cell (Guwahati HQ)',
        createdAt: now,
        nextSteps,
        timeline: [
          {
            time: now,
            title: 'Lost Passport Assistance Report Registered',
            description: `Case ${caseId} created and dispatched to North-East Tourist Police Assistance Cell.`
          },
          {
            time: now,
            title: 'Automated Alert Sent to Liaison Desk',
            description: 'Designated nodal officer alerted for document loss coordination.'
          }
        ]
      };

      db.data.lostPassports.unshift(record);
      db.save();

      return res.status(201).json({
        success: true,
        message: 'Lost passport report submitted successfully. Keep your case ID for real-time tracking.',
        caseId,
        case: record
      });
    } catch (err) {
      console.error('Error submitting lost passport report:', err);
      return res.status(500).json({ error: 'Internal server error processing lost passport report.' });
    }
  },

  // 2. Submit Grievance
  submitGrievance: async (req, res) => {
    try {
      const {
        touristName,
        touristId = '',
        contactEmail,
        contactPhone,
        category = 'General Grievance',
        location,
        description,
        urgency = 'Normal'
      } = req.body;

      if (!touristName || !contactEmail || !description || !location) {
        return res.status(400).json({
          error: 'Missing required fields: Name, Email, Description, and Location are mandatory.'
        });
      }

      const ticketId = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();
      const resolutionHours = urgency === 'Critical' ? 12 : urgency === 'Urgent' ? 24 : 48;

      const record = {
        id: ticketId,
        type: 'GRIEVANCE',
        touristName,
        touristId,
        contactEmail,
        contactPhone: contactPhone || '',
        category,
        location,
        description,
        urgency,
        status: 'SUBMITTED',
        assignedAuthority: 'State Tourism Redressal & Tourist Police Joint Cell',
        createdAt: now,
        estimatedResolutionHours: resolutionHours,
        timeline: [
          {
            time: now,
            title: 'Grievance Ticket Created',
            description: `Filed under "${category}" with ${urgency} priority. Assigned ticket ID ${ticketId}.`
          }
        ]
      };

      db.data.grievances.unshift(record);
      db.save();

      return res.status(201).json({
        success: true,
        message: 'Grievance lodged successfully. Our response team will review your case.',
        ticketId,
        grievance: record
      });
    } catch (err) {
      console.error('Error submitting grievance:', err);
      return res.status(500).json({ error: 'Internal server error submitting grievance.' });
    }
  },

  // 3. Track any Case / Ticket / Reference ID
  trackCase: async (req, res) => {
    try {
      const rawId = req.params.caseId?.trim();
      if (!rawId) {
        return res.status(400).json({ error: 'Case or Ticket ID is required.' });
      }

      const searchId = rawId.toUpperCase();

      // Check Lost Passports
      const lp = db.data.lostPassports?.find((c) => c.id.toUpperCase() === searchId);
      if (lp) {
        return res.json({
          found: true,
          caseType: 'LOST_PASSPORT',
          data: lp
        });
      }

      // Check Grievances
      const grv = db.data.grievances?.find((g) => g.id.toUpperCase() === searchId);
      if (grv) {
        return res.json({
          found: true,
          caseType: 'GRIEVANCE',
          data: grv
        });
      }

      // Check Emergency Alerts / Incident IDs
      const alert = db.data.alerts?.find((a) => a.id.toUpperCase() === searchId);
      if (alert) {
        return res.json({
          found: true,
          caseType: 'EMERGENCY_INCIDENT',
          data: alert
        });
      }

      // Check E-FIRs
      const efir = db.data.efirRecords?.find((e) => e.firNumber?.toUpperCase() === searchId || e.id?.toUpperCase() === searchId);
      if (efir) {
        return res.json({
          found: true,
          caseType: 'EFIR_RECORD',
          data: efir
        });
      }

      return res.status(404).json({
        found: false,
        error: `No records found matching ID "${rawId}". Please verify your reference format (e.g. LP-2026-XXXX, GRV-2026-XXXX, or ALT-2026-XXXX).`
      });
    } catch (err) {
      console.error('Error tracking case:', err);
      return res.status(500).json({ error: 'Internal server error retrieving case status.' });
    }
  },

  // 4. Consular & Emergency Directory
  getConsularResources: async (req, res) => {
    const resources = {
      emergencyHelplines: [
        { name: 'National Emergency Helpline (All-in-One)', number: '112', description: 'Police, Medical & Fire response 24/7' },
        { name: 'National 24x7 Tourist Helpline (MoT)', number: '1363 / 1800-11-1363', description: 'Available in 12 languages (German, French, Spanish, Russian, Japanese, etc.)' },
        { name: 'Northeast Tourist Police Desk (Guwahati HQ)', number: '+91 361 246 8990', description: 'Specialized tourist safety & grievance response' },
        { name: 'Women Safety & Anti-Harassment Helpline', number: '1090 / 181', description: 'Toll-free 24/7 immediate assistance' },
        { name: 'Disaster Management Control Room (SDMA)', number: '1070 / 1077', description: 'Weather alerts, landslide updates & flood rescue' }
      ],
      frroOffices: [
        {
          city: 'Guwahati (Northeast FRRO Cell)',
          address: 'Bureau of Immigration, LGBI International Airport, Borjhar, Guwahati, Assam 781015',
          contact: '+91 361 284 0245',
          email: 'frro-ghy@nic.in',
          services: 'Exit Permits, Visa Extensions, Registration Regularization'
        },
        {
          city: 'Kolkata FRRO (Regional Zonal HQ)',
          address: '237, Acharya Jagadish Chandra Bose Rd, Sreepally, Bhowanipore, Kolkata, WB 700020',
          contact: '+91 33 2290 0147',
          email: 'frrokol@nic.in',
          services: 'Consular liaison, Emergency repatriation clearance'
        }
      ],
      foreignEmbassiesInIndia: [
        {
          country: 'United States',
          mission: 'US Embassy New Delhi & Kolkata Consulate',
          address: '5/1 Ho Chi Minh Sarani, Kolkata 700071 / Shantipath, Chanakyapuri, New Delhi',
          phone: '+91 33 6827 2400 / +91 11 2419 8000',
          emergencyEmail: 'KolkataACS@state.gov',
          website: 'https://in.usembassy.gov'
        },
        {
          country: 'United Kingdom',
          mission: 'British Deputy High Commission Kolkata',
          address: '1A Ho Chi Minh Sarani, Kolkata 700071',
          phone: '+91 33 2288 5172',
          emergencyEmail: 'web.newdelhi@fcdo.gov.uk',
          website: 'https://gov.uk/world/india'
        },
        {
          country: 'Australia',
          mission: 'Australian Consulate-General Kolkata',
          address: '1A Ho Chi Minh Sarani, Kolkata 700071',
          phone: '+91 33 6621 6300',
          emergencyEmail: 'consular.newdelhi@dfat.gov.au',
          website: 'https://india.embassy.gov.au'
        },
        {
          country: 'Germany',
          mission: 'Consulate General of the Federal Republic of Germany',
          address: '1 Hastings Park Road, Alipore, Kolkata 700027',
          phone: '+91 33 2479 1141',
          emergencyEmail: 'info@kalkutta.diplo.de',
          website: 'https://india.diplo.de'
        },
        {
          country: 'Japan',
          mission: 'Consulate General of Japan in Kolkata',
          address: '55 M.N. Sen Lane, Tollygunge, Kolkata 700040',
          phone: '+91 33 3507 6830',
          emergencyEmail: 'ryoji_kolkata@cc.mofa.go.jp',
          website: 'https://www.kolkata.in.emb-japan.go.jp'
        },
        {
          country: 'France',
          mission: 'Consulate General of France in Kolkata',
          address: '21C Raja Santosh Road, Alipore, Kolkata 700027',
          phone: '+91 33 4016 3200',
          emergencyEmail: 'consulat.calcutta-fslt@diplomatie.gouv.fr',
          website: 'https://in.ambafrance.org'
        },
        {
          country: 'Bangladesh',
          mission: 'Assistant High Commission of Bangladesh Guwahati',
          address: 'House No 30, Rajgarh Road, Guwahati, Assam 781003',
          phone: '+91 361 252 2225',
          emergencyEmail: 'mission.guwahati@mofa.gov.bd',
          website: 'https://guwahati.mofa.gov.bd'
        }
      ]
    };

    return res.json({ success: true, resources });
  }
};
