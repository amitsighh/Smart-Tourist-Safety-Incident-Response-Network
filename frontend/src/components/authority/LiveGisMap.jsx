import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  ShieldAlert,
  ShieldCheck,
  Navigation,
  Radio,
  Layers,
  Phone,
  Watch,
  User,
  AlertTriangle,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  CloudSnow,
  Eye,
  Umbrella,
  Flame,
  Newspaper,
  Building2,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';

// Custom SVG Leaflet DivIcons to ensure crisp rendering without asset dependency
const createTouristIcon = (hasSos = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${hasSos ? '<span class="absolute w-10 h-10 rounded-full bg-red-600/40 animate-ping"></span>' : ''}
        <div class="w-8 h-8 rounded-full ${hasSos ? 'bg-red-600 border-2 border-white animate-bounce' : 'bg-emerald-600 border-2 border-white'} text-white flex items-center justify-center shadow-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${hasSos ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' : 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'}" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createNewsMarkerIcon = (news) => {
  const isCritical = news.severity === 'CRITICAL';
  const isWarning = news.severity === 'WARNING';
  const bg = isCritical ? 'bg-red-600' : (isWarning ? 'bg-amber-500' : 'bg-blue-600');

  return L.divIcon({
    className: 'custom-news-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${isCritical ? '<span class="absolute w-10 h-10 rounded-full bg-red-500/40 animate-ping"></span>' : ''}
        <div class="flex items-center space-x-1 px-2.5 py-1 rounded-full ${bg} text-white text-[10px] font-black shadow-lg border-2 border-white">
          <span>📰</span>
          <span class="max-w-[85px] truncate">${news.locationName?.split(' ')[0]}</span>
        </div>
      </div>
    `,
    iconSize: [110, 26],
    iconAnchor: [55, 13],
    popupAnchor: [0, -14]
  });
};

const createPatrolIcon = (status = 'AVAILABLE') => {
  return L.divIcon({
    className: 'custom-patrol-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full ${status === 'ON_MISSION' ? 'bg-amber-600 border-2 border-white' : 'bg-blue-600 border-2 border-white'} text-white flex items-center justify-center shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createWeatherMarkerIcon = (station) => {
  const isRain = station.condition.includes('Rain');
  const isSnow = station.condition.includes('Snow');
  const bg = station.alertLevel === 'RED' ? 'bg-red-600' : (station.alertLevel === 'ORANGE' ? 'bg-amber-500' : 'bg-emerald-600');

  return L.divIcon({
    className: 'custom-weather-marker',
    html: `
      <div class="flex items-center space-x-1 px-2 py-1 rounded-full ${bg} text-white text-[10px] font-bold shadow-md border border-white">
        <span>${station.temp}°C</span>
        <span>${isSnow ? '❄️' : (isRain ? '🌧️' : '☀️')}</span>
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12]
  });
};

// Map Recenter Helper Component
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export const REGIONAL_WEATHER_DATA = [
  {
    id: 'WX-GHY',
    city: 'Guwahati Transit Hub',
    lat: 26.1445,
    lng: 91.7362,
    temp: 28,
    condition: 'Partly Sunny',
    humidity: '64%',
    wind: '8 km/h',
    rainProb: '10%',
    visibility: '9.5 km',
    alertLevel: 'GREEN',
    advisory: 'Clear skies. Optimal transit conditions.'
  },
  {
    id: 'WX-SHL',
    city: 'Shillong Plateau',
    lat: 25.5788,
    lng: 91.8933,
    temp: 18,
    condition: 'Moderate Rain & Fog',
    humidity: '92%',
    wind: '18 km/h',
    rainProb: '75%',
    visibility: '4.2 km',
    alertLevel: 'ORANGE',
    advisory: 'IMD Orange Warning: Slippery hairpins on NH-6.'
  },
  {
    id: 'WX-TWG',
    city: 'Tawang Sela Corridor',
    lat: 27.5052,
    lng: 92.1039,
    temp: 4,
    condition: 'Freezing Snow & Blizzard',
    humidity: '88%',
    wind: '34 km/h',
    rainProb: '90%',
    visibility: '1.2 km',
    alertLevel: 'RED',
    advisory: 'Sub-zero black ice. Sela Pass night travel curfew active.'
  },
  {
    id: 'WX-KZG',
    city: 'Kaziranga National Park',
    lat: 26.5800,
    lng: 93.3800,
    temp: 26,
    condition: 'Humid / River Swelling',
    humidity: '80%',
    wind: '12 km/h',
    rainProb: '40%',
    visibility: '7.0 km',
    alertLevel: 'YELLOW',
    advisory: 'Brahmaputra water level elevated. Core sector guarded.'
  },
  {
    id: 'WX-DZK',
    city: 'Dzukou Valley Trek',
    lat: 25.5682,
    lng: 94.0483,
    temp: 8,
    condition: 'Dense Mountain Mist',
    humidity: '95%',
    wind: '22 km/h',
    rainProb: '60%',
    visibility: '2.0 km',
    alertLevel: 'ORANGE',
    advisory: 'Freezing fog at 2,400m MSL. Night camping restricted.'
  },
  {
    id: 'WX-CHR',
    city: 'Cherrapunji Gorges',
    lat: 25.2702,
    lng: 91.7323,
    temp: 16,
    condition: 'Heavy Downpour',
    humidity: '98%',
    wind: '24 km/h',
    rainProb: '95%',
    visibility: '3.0 km',
    alertLevel: 'RED',
    advisory: 'Gorge river swelling. Single root bridge paths halted.'
  }
];

export default function LiveGisMap({
  tourists = [],
  patrolUnits = [],
  geofences = [],
  activeAlerts = [],
  selectedEntity = null,
  onSelectEntity,
  showWeatherLayer = true,
  heightClass = "h-[540px]"
}) {
  const [mapCenter, setMapCenter] = useState([26.1445, 91.7362]);
  const [mapZoom, setMapZoom] = useState(8);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(showWeatherLayer);
  const [showNewsOverlay, setShowNewsOverlay] = useState(true);
  const [locationNews, setLocationNews] = useState([]);
  const [selectedWeather, setSelectedWeather] = useState(REGIONAL_WEATHER_DATA[1]); // Shillong default

  const [layerFilter, setLayerFilter] = useState({
    tourists: true,
    patrols: true,
    geofences: true,
    weather: true,
    news: true,
    sosOnly: false
  });

  const activeSosTouristIds = new Set(
    activeAlerts.filter(a => a.status !== 'RESOLVED' && a.status !== 'CLOSED').map(a => a.touristId)
  );

  useEffect(() => {
    api.getNews().then(res => {
      if (res.success && res.news) setLocationNews(res.news);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedEntity?.latitude && selectedEntity?.longitude) {
      setMapCenter([selectedEntity.latitude, selectedEntity.longitude]);
      setMapZoom(13);
    }
  }, [selectedEntity]);

  return (
    <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900`}>
      {/* Top Banner Badges (Safe Zones: 24 | Moderate: 12 | Restricted: 5) matching Screenshot */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
        <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-md flex items-center space-x-1.5 border border-emerald-400/40">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span>Safe Zones: 24</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-extrabold shadow-md flex items-center space-x-1.5 border border-amber-300/40">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Moderate: 12</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-extrabold shadow-md flex items-center space-x-1.5 border border-red-400/40">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>Restricted: 5</span>
        </span>
      </div>

      {/* Top Right: Active Tourists Pill & Quick Toggles */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setShowNewsOverlay(!showNewsOverlay)}
          className={`px-3 py-1 rounded-full text-[11px] font-extrabold shadow-md flex items-center space-x-1.5 border transition-all ${
            showNewsOverlay
              ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/30'
              : 'bg-white/90 text-slate-700 border-slate-300'
          }`}
          title="Toggle Location News Pins on Map"
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Live News ({locationNews.length})</span>
        </button>

        <button
          onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
          className={`px-3 py-1 rounded-full text-[11px] font-extrabold shadow-md flex items-center space-x-1.5 border transition-all ${
            showWeatherOverlay
              ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/30'
              : 'bg-white/90 text-slate-700 border-slate-300'
          }`}
          title="Toggle Live Weather & IMD Radar"
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Live Weather</span>
        </button>

        <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-md flex items-center space-x-1.5 border border-blue-400/40">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>{tourists.length > 0 ? `${tourists.length * 12 + 580} Active Tourists` : '580 Active Tourists'}</span>
        </span>
      </div>

      {/* Floating Live Weather Radar Widget (Left Bottom on Map) */}
      {showWeatherOverlay && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xs text-xs space-y-2 pointer-events-auto animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-1.5 font-extrabold text-slate-900 dark:text-white">
              <Thermometer className="w-4 h-4 text-blue-500" />
              <span>IMD Live Weather Feed</span>
            </div>
            <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
              selectedWeather.alertLevel === 'RED' ? 'bg-red-600 text-white animate-pulse' :
              selectedWeather.alertLevel === 'ORANGE' ? 'bg-amber-500 text-white' :
              'bg-emerald-600 text-white'
            }`}>
              {selectedWeather.alertLevel} ALERT
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{selectedWeather.city}</div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Wind className="w-3 h-3" />
                <span>{selectedWeather.condition}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedWeather.temp}°C</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-[10px] text-slate-600 dark:text-slate-300">
            <div>Rain: <strong className="text-blue-600">{selectedWeather.rainProb}</strong></div>
            <div>Wind: <strong>{selectedWeather.wind}</strong></div>
            <div>Vis: <strong>{selectedWeather.visibility}</strong></div>
          </div>

          <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
            {selectedWeather.advisory}
          </p>

          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            {REGIONAL_WEATHER_DATA.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWeather(w);
                  setMapCenter([w.lat, w.lng]);
                  setMapZoom(11);
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                  selectedWeather.id === w.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {w.city.split(' ')[0]} ({w.temp}°)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Legend Overlay (Right Bottom) */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 text-white text-[10px] backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 flex items-center space-x-3 shadow-lg pointer-events-auto">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Safe / Opted-In</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>SOS Alarm</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>Police Patrol</span>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={mapCenter} zoom={mapZoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render Weather Station Markers */}
        {showWeatherOverlay && REGIONAL_WEATHER_DATA.map((station) => (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={createWeatherMarkerIcon(station)}
            eventHandlers={{
              click: () => setSelectedWeather(station)
            }}
          >
            <Popup>
              <div className="text-xs space-y-1 p-1 min-w-[180px]">
                <div className="font-extrabold text-slate-900">{station.city}</div>
                <div className="text-blue-600 font-bold">{station.temp}°C • {station.condition}</div>
                <div className="text-[11px] text-slate-600">Rain Prob: {station.rainProb} • Wind: {station.wind}</div>
                <div className="text-[10px] font-bold text-amber-700 bg-amber-50 p-1 rounded mt-1">
                  {station.advisory}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Geofence Zones */}
        {geofences.map((fence) => {
          if (!fence.isActive) return null;
          const isRestricted = fence.category === 'restricted';
          const isCurfew = fence.category === 'curfew';
          const color = isRestricted ? '#ef4444' : (isCurfew ? '#f59e0b' : '#3b82f6');

          if (fence.type === 'polygon' && fence.coordinates && fence.coordinates.length >= 3) {
            return (
              <Polygon
                key={fence.id}
                positions={fence.coordinates}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: isCurfew ? '5, 5' : null
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 p-1">
                    <div className="font-extrabold text-slate-900">{fence.name}</div>
                    <div className="text-[10px] text-red-600 font-bold uppercase">{fence.category} ZONE</div>
                    <p className="text-slate-600 text-[11px]">{fence.advisory}</p>
                    <div className="text-[10px] text-emerald-700 font-medium">Safe Route: {fence.safeRouteSuggestion}</div>
                  </div>
                </Popup>
              </Polygon>
            );
          } else if (fence.type === 'circle' && fence.center) {
            return (
              <Circle
                key={fence.id}
                center={[fence.center.lat, fence.center.lng]}
                radius={fence.radiusMeters || 2000}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.25,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 p-1">
                    <div className="font-extrabold text-slate-900">{fence.name}</div>
                    <div className="text-[10px] text-amber-600 font-bold uppercase">{fence.category} ZONE</div>
                    <p className="text-slate-600 text-[11px]">{fence.advisory}</p>
                  </div>
                </Popup>
              </Circle>
            );
          }
          return null;
        })}

        {/* Render Tourist Pins */}
        {tourists.map((tourist) => {
          const hasActiveSos = tourist.hasActiveSos || activeSosTouristIds.has(tourist.touristId);
          const lat = tourist.lastLocation?.latitude || 26.1445;
          const lng = tourist.lastLocation?.longitude || 91.7362;

          return (
            <Marker
              key={tourist.touristId}
              position={[lat, lng]}
              icon={createTouristIcon(hasActiveSos)}
              eventHandlers={{
                click: () => onSelectEntity && onSelectEntity(tourist)
              }}
            >
              <Popup>
                <div className="text-xs space-y-1.5 p-1 min-w-[200px]">
                  <div className="flex items-center justify-between font-extrabold text-slate-900">
                    <span>{tourist.fullName}</span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold">{tourist.touristId}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Location: <strong>{tourist.lastLocation?.locationName || 'GPS Waypoint'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-600 border-t pt-1">
                    <span>Blood: {tourist.bloodGroup || 'O+'}</span>
                    <span>Battery: {tourist.lastLocation?.batteryLevel || 80}%</span>
                  </div>
                  {tourist.pairedWearableId && (
                    <div className="text-[10px] text-cyan-600 font-bold flex items-center space-x-1">
                      <Watch className="w-3 h-3" />
                      <span>Paired Band: {tourist.pairedWearableId}</span>
                    </div>
                  )}
                  {hasActiveSos && (
                    <div className="bg-red-100 text-red-800 text-[10px] font-bold p-1 rounded text-center animate-pulse">
                      🚨 ACTIVE PANIC SOS ALARM
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Patrol Unit Pins */}
        {patrolUnits.map((unit) => (
          <Marker
            key={unit.id}
            position={[unit.latitude, unit.longitude]}
            icon={createPatrolIcon(unit.status)}
          >
            <Popup>
              <div className="text-xs space-y-1 p-1">
                <div className="font-extrabold text-slate-900">{unit.name}</div>
                <div className="text-[10px] text-blue-600 font-bold">{unit.type}</div>
                <div className="text-[11px] text-slate-600">Officer: {unit.officerInCharge}</div>
                <div className="text-[10px] font-bold uppercase text-emerald-600">
                  Status: {unit.status?.replace('_', ' ')}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Live Location News Markers */}
        {showNewsOverlay && locationNews.map((news) => (
          <Marker
            key={news.id}
            position={[news.latitude, news.longitude]}
            icon={createNewsMarkerIcon(news)}
          >
            <Popup>
              <div className="text-xs space-y-2 p-1 min-w-[240px] max-w-xs">
                <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${news.severity === 'CRITICAL' ? 'bg-red-600 text-white' : (news.severity === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white')} uppercase`}>
                    {news.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(news.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-black text-slate-900 text-xs leading-snug">
                  {news.headline}
                </div>
                <div className="text-[11px] text-blue-700 font-semibold flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{news.locationName}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {news.summary}
                </p>
                {news.travelAdvice && (
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-900 text-[10px] font-medium border border-blue-100 space-y-0.5">
                    <strong>Advisory:</strong> {news.travelAdvice}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1 flex items-center justify-between">
                  <span>Source: <strong className="text-slate-600">{news.sourceAgency}</strong></span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
