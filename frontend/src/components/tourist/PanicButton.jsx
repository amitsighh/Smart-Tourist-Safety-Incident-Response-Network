import React, { useState, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import {
  AlertOctagon,
  Radio,
  CheckCircle,
  Copy,
  Mic,
  Volume2,
  Navigation,
  PhoneCall,
  Loader2
} from 'lucide-react';

export default function PanicButton({ tourist, onSosTriggered }) {
  const { emitPanicSos } = useSocket();
  const { t } = useLanguage();

  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [smsFallbackCopied, setSmsFallbackCopied] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const holdTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const startHold = () => {
    if (activeAlert) return;
    setHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    const duration = 2500; // 2.5 seconds

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(progressIntervalRef.current);
        triggerEmergency('HOLD_GESTURE');
      }
    }, 50);
  };

  const endHold = () => {
    setHolding(false);
    setHoldProgress(0);
    clearInterval(progressIntervalRef.current);
  };

  const triggerEmergency = async (triggerType = 'BUTTON_PRESS') => {
    if (!tourist || isTriggering) return;
    setIsTriggering(true);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([400, 150, 400, 150, 400]);
    }

    try {
      const sosPayload = {
        touristId: tourist.touristId,
        latitude: tourist.lastLocation?.latitude || 25.5788,
        longitude: tourist.lastLocation?.longitude || 91.8933,
        locationName: tourist.lastLocation?.locationName || 'Shillong Peak Forest Sector',
        batteryLevel: tourist.lastLocation?.batteryLevel || 78,
        triggerType,
        emergencyNote: 'Direct Panic SOS button pressed by tourist.'
      };

      const res = await api.triggerPanicSos(sosPayload);
      if (res.success) {
        setActiveAlert(res.alert);
        emitPanicSos({
          ...res.alert,
          touristName: tourist.fullName
        });
        if (onSosTriggered) onSosTriggered(res.alert);
      }
    } catch (err) {
      console.error('SOS dispatch error:', err);
    } finally {
      setIsTriggering(false);
      setHolding(false);
      setHoldProgress(0);
    }
  };

  // Voice SOS Recognition via Web Speech API
  const toggleVoiceSos = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition API is not supported in this browser. Please use the button.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListeningVoice(true);
      setVoiceTranscript('Listening for "Help", "Bachao", or "Emergency"...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setVoiceTranscript(`Recognized: "${transcript}"`);
      if (
        transcript.includes('help') ||
        transcript.includes('bachao') ||
        transcript.includes('emergency') ||
        transcript.includes('police') ||
        transcript.includes('save me')
      ) {
        triggerEmergency('VOICE_COMMAND');
      }
      setIsListeningVoice(false);
    };

    recognition.onerror = () => {
      setIsListeningVoice(false);
      setVoiceTranscript('Voice recognition stopped.');
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
    };

    recognition.start();
  };

  const copySmsFallback = () => {
    if (!tourist) return;
    const sms = `[SURAKSHAYATRA SOS] ID:${tourist.touristId} LOC:${tourist.lastLocation?.latitude?.toFixed(4)},${tourist.lastLocation?.longitude?.toFixed(4)} BAT:${tourist.lastLocation?.batteryLevel}% EMERGENCY. Send nearest police squad!`;
    navigator.clipboard.writeText(sms);
    setSmsFallbackCopied(true);
    setTimeout(() => setSmsFallbackCopied(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
      <div className="text-center max-w-md mx-auto space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-900">
            🚨 Immediate 24/7 Police Dispatch
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
            Emergency Distress & Panic Button
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('sos.holdToTrigger')}
          </p>
        </div>

        {/* SOS Button */}
        <div className="relative flex items-center justify-center py-4">
          {/* Pulsing Ripple Rings */}
          <div className="absolute w-44 h-44 rounded-full bg-red-500/10 dark:bg-red-500/20 animate-ping-slow pointer-events-none"></div>
          <div className="absolute w-36 h-36 rounded-full bg-red-500/20 dark:bg-red-500/30 animate-pulse pointer-events-none"></div>

          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            onClick={() => {
              if (!activeAlert) triggerEmergency('BUTTON_PRESS');
            }}
            disabled={isTriggering}
            className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center text-white font-extrabold shadow-2xl transition-all transform active:scale-95 select-none ${
              activeAlert
                ? 'bg-gradient-to-tr from-amber-600 to-red-600 cursor-default ring-8 ring-red-300 dark:ring-red-900/60 animate-pulse'
                : 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 ring-8 ring-red-100 dark:ring-red-950/60 hover:ring-red-200'
            }`}
          >
            {/* SVG Progress Ring for Hold */}
            {holding && (
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  className="stroke-yellow-300"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - holdProgress / 100)}
                  fill="transparent"
                />
              </svg>
            )}

            {isTriggering ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : activeAlert ? (
              <>
                <Radio className="w-8 h-8 animate-spin" />
                <span className="text-xs mt-1 tracking-wider uppercase">ACTIVE SOS</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-9 h-9 drop-shadow-md" />
                <span className="text-sm tracking-wider mt-1">{t('sos.panicButton')}</span>
                <span className="text-[9px] font-medium opacity-90">TAP OR HOLD</span>
              </>
            )}
          </button>
        </div>

        {/* Voice SOS Trigger */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={toggleVoiceSos}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isListeningVoice
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-red-500" />
            <span>{isListeningVoice ? 'Listening...' : 'Voice SOS Trigger'}</span>
          </button>

          <button
            onClick={copySmsFallback}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
            title="Generate SMS payload for low-network areas"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>{smsFallbackCopied ? 'SMS Copied!' : 'Offline SMS'}</span>
          </button>
        </div>

        {voiceTranscript && (
          <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
            {voiceTranscript}
          </div>
        )}

        {/* Live Active SOS Dispatch Status Card */}
        {activeAlert && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-900 text-left space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-red-800 dark:text-red-300 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <span>DISPATCH IN PROGRESS</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                INCIDENT #{activeAlert.id}
              </span>
            </div>

            <p className="text-xs text-red-900 dark:text-red-200 font-medium">
              {t('sos.statusDispatched')}
            </p>

            {activeAlert.assignedUnitName && (
              <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-red-200 dark:border-red-900/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {activeAlert.assignedUnitName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Estimated Arrival: ~{activeAlert.estimatedEtaMinutes || 6} mins
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href="tel:112"
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Call Patrol Officer"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
