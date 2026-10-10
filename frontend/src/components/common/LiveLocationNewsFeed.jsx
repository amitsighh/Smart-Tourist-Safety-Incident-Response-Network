import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Newspaper,
  Radio,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  CloudRain,
  Navigation,
  Compass,
  CheckCircle2,
  X,
  Send,
  Building2,
  Share2,
  Sparkles
} from 'lucide-react';

export default function LiveLocationNewsFeed({
  currentLocation = null, // { latitude, longitude, locationName }
  onSelectNewsOnMap = null,
  compact = false,
  showBroadcastButton = true
}) {
  const { user } = useAuth();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [proximityMode, setProximityMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNewsId, setExpandedNewsId] = useState(null);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bHeadline, setBHeadline] = useState('');
  const [bLocation, setBLocation] = useState(currentLocation?.locationName || 'Guwahati Transit Sector');
  const [bRegion, setBRegion] = useState('Kamrup Metropolitan, Assam');
  const [bState, setBState] = useState('Assam');
  const [bLat, setBLat] = useState(currentLocation?.latitude || 26.1445);
  const [bLng, setBLng] = useState(currentLocation?.longitude || 91.7362);
  const [bCategory, setBCategory] = useState('ROAD_TRANSIT');
  const [bSeverity, setBSeverity] = useState('WARNING');
  const [bSource, setBSource] = useState(user ? `${user.fullName} (${user.role.toUpperCase()})` : 'State Tourism Safety Cell');
  const [bSummary, setBSummary] = useState('');
  const [bAdvice, setBAdvice] = useState('');
  const [bIsBreaking, setBIsBreaking] = useState(false);
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      if (proximityMode && currentLocation?.latitude && currentLocation?.longitude) {
        const res = await api.getNearbyNews(currentLocation.latitude, currentLocation.longitude, 120);
        if (res.success) {
          setNewsList(res.news || []);
        }
      } else {
        const params = {};
        if (activeCategory !== 'ALL') params.category = activeCategory;
        if (selectedState !== 'ALL') params.state = selectedState;
        if (searchQuery) params.search = searchQuery;
        const res = await api.getNews(params);
        if (res.success) {
          setNewsList(res.news || []);
        }
      }
    } catch (err) {
      console.error('Failed to load location news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory, selectedState, proximityMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNews();
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBroadcast(true);
    try {
      const res = await api.publishNews({
        headline: bHeadline,
        locationName: bLocation,
        region: bRegion,
        state: bState,
        latitude: bLat,
        longitude: bLng,
        category: bCategory,
        severity: bSeverity,
        sourceAgency: bSource,
        summary: bSummary,
        travelAdvice: bAdvice,
        isBreaking: bIsBreaking
      });

      if (res.success) {
        setBroadcastSuccess(true);
        setTimeout(() => {
          setBroadcastSuccess(false);
          setShowBroadcastModal(false);
          setBHeadline('');
          setBSummary('');
          setBAdvice('');
          fetchNews();
        }, 1500);
      }
    } catch (err) {
      alert('Error publishing bulletin: ' + err.message);
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const breakingNews = newsList.filter((n) => n.isBreaking);

  const categories = [
    { id: 'ALL', label: 'All News' },
    { id: 'ROAD_TRANSIT', label: 'Roads & BRO' },
    { id: 'WEATHER_DISASTER', label: 'Weather & Hazards' },
    { id: 'WILDLIFE_PARKS', label: 'Wildlife & Parks' },
    { id: 'CIVIL_SAFETY', label: 'Civil Safety & Curfews' },
    { id: 'INFRASTRUCTURE', label: 'Transit & Ferry' }
  ];

  const states = [
    { id: 'ALL', label: 'All Northeast States' },
    { id: 'Assam', label: 'Assam' },
    { id: 'Meghalaya', label: 'Meghalaya' },
    { id: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
    { id: 'Nagaland', label: 'Nagaland' },
    { id: 'Sikkim', label: 'Sikkim' },
    { id: 'Manipur', label: 'Manipur' }
  ];

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case 'ROAD_TRANSIT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'WEATHER_DISASTER':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'WILDLIFE_PARKS':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CIVIL_SAFETY':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white uppercase animate-pulse">Critical</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white uppercase">Advisory</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 uppercase">Update</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* BREAKING NEWS TICKER BANNER */}
      {breakingNews.length > 0 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded backdrop-blur-xs">
              BREAKING
            </span>
          </div>
          <div className="flex-1 truncate text-xs font-bold">
            <span>{breakingNews[0].headline}</span>
            <span className="opacity-80 font-normal ml-2">({breakingNews[0].locationName})</span>
          </div>
          <button
            onClick={() => setExpandedNewsId(expandedNewsId === breakingNews[0].id ? null : breakingNews[0].id)}
            className="text-[11px] font-bold bg-white text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 shrink-0 shadow-xs uppercase tracking-wider"
          >
            {expandedNewsId === breakingNews[0].id ? 'Collapse' : 'Details'}
          </button>
        </div>
      )}

      {/* CONTROL & FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-sm text-slate-900">
              Live Location News & Safety Intelligence
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {newsList.length} Bulletins
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Proximity Toggle */}
            {currentLocation && (
              <button
                onClick={() => setProximityMode(!proximityMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  proximityMode
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Filter news within 120km of current location"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Near Me ({currentLocation.locationName?.split(',')[0] || 'My GPS'})</span>
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Refresh News Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Authority Broadcast Button */}
            {showBroadcastButton && (
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Broadcast Report</span>
              </button>
            )}
          </div>
        </div>

        {/* State / Region Selector & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          <div className="sm:col-span-4">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={proximityMode}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-8">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news by location, route (e.g. Sela Pass, Cherrapunji, NH-715)..."
                className="w-full p-2 pl-8 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            </form>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              disabled={proximityMode}
              className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all ${
                activeCategory === c.id && !proximityMode
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* NEWS LIST CARDS */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            <p className="font-semibold">Retrieving live location intelligence...</p>
          </div>
        ) : newsList.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">No news reports found for this filter or location.</p>
            <p>All sectors in this perimeter are currently clear of major incidents.</p>
          </div>
        ) : (
          newsList.map((item) => {
            const isExpanded = expandedNewsId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  item.isBreaking
                    ? 'border-red-200 shadow-sm'
                    : 'border-blue-100 hover:border-blue-200 shadow-2xs'
                }`}
              >
                <div className="p-4 space-y-2.5">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(item.severity)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeColor(item.category)}`}>
                        {item.category?.replace('_', ' ')}
                      </span>
                      {item.distanceKm !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          📍 {item.distanceKm} km away
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Headline & Location */}
                  <div>
                    <h4 className="font-black text-sm text-slate-900 leading-snug">
                      {item.headline}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-semibold mt-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{item.locationName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-normal">{item.region}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Expandable Travel Advice & Map Pin Details */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in text-xs">
                      {/* Actionable Travel Advice Box */}
                      {item.travelAdvice && (
                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                          <div className="flex items-center space-x-1.5 text-blue-900 font-extrabold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Official Travel & Safety Advisory</span>
                          </div>
                          <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                            {item.travelAdvice}
                          </p>
                        </div>
                      )}

                      {/* Source attribution & GPS Coordinates */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>Source: <strong className="text-slate-700">{item.sourceAgency}</strong></span>
                        </div>
                        <div className="font-mono text-[10px]">
                          GPS: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <button
                      onClick={() => setExpandedNewsId(isExpanded ? null : item.id)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Show Less' : 'Full Advisory & Source'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {onSelectNewsOnMap && (
                      <button
                        onClick={() => onSelectNewsOnMap(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        <span>View on Map</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BROADCAST NEWS REPORT MODAL (Authorities) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Newspaper className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-slate-900">
                  Broadcast Verified Location News Bulletin
                </h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <div className="font-black text-base text-slate-900">
                  News Bulletin Published!
                </div>
                <p className="text-xs text-slate-500">
                  Broadcast dispatched to all tourist devices and police command centers in the sector.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBroadcastSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Headline *</label>
                  <input
                    type="text"
                    value={bHeadline}
                    onChange={(e) => setBHeadline(e.target.value)}
                    placeholder="e.g. Sela Pass Road Restored by BRO; Convoy Moving"
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specific Location Name *</label>
                    <input
                      type="text"
                      value={bLocation}
                      onChange={(e) => setBLocation(e.target.value)}
                      placeholder="e.g. Sela Pass Corridor (13,700 ft)"
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State *</label>
                    <select
                      value={bState}
                      onChange={(e) => setBState(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white"
                    >
                      <option value="Assam">Assam</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Manipur">Manipur</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={bCategory}
                      onChange={(e) => setBCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white"
                    >
                      <option value="ROAD_TRANSIT">Roads & BRO</option>
                      <option value="WEATHER_DISASTER">Weather & Disaster</option>
                      <option value="WILDLIFE_PARKS">Wildlife & Parks</option>
                      <option value="CIVIL_SAFETY">Civil Safety & Curfew</option>
                      <option value="INFRASTRUCTURE">Transit & Ferry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Severity</label>
                    <select
                      value={bSeverity}
                      onChange={(e) => setBSeverity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white"
                    >
                      <option value="INFO">Info / Regular</option>
                      <option value="WARNING">Advisory / Warning</option>
                      <option value="CRITICAL">Critical Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Issuing Source Agency</label>
                    <input
                      type="text"
                      value={bSource}
                      onChange={(e) => setBSource(e.target.value)}
                      placeholder="e.g. BRO Project Vartak"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Report Summary & Key Findings *</label>
                  <textarea
                    value={bSummary}
                    onChange={(e) => setBSummary(e.target.value)}
                    rows={2}
                    placeholder="Provide exact details of the situation or incident..."
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tourist Safety & Route Advice</label>
                  <input
                    type="text"
                    value={bAdvice}
                    onChange={(e) => setBAdvice(e.target.value)}
                    placeholder="e.g. Avoid travel after 17:00, use anti-skid chains on 4x4 vehicles."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="breakingCheck"
                    checked={bIsBreaking}
                    onChange={(e) => setBIsBreaking(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="breakingCheck" className="font-bold text-red-700 cursor-pointer">
                    Flag as Urgent Breaking News (Triggers red banner alert on tourist devices)
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBroadcast}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-wider shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingBroadcast ? 'Publishing...' : 'Publish Bulletin'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
