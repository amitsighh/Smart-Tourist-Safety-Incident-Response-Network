import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { offlineStorage } from '../../services/offlineStorage';
import { smsFallback } from '../../services/smsFallback';
import {
  AlertOctagon,
  Radio,
  CheckCircle,
  Clock,
  Send,
  Mic,
  PhoneCall,
  Loader2,
  XCircle,
  WifiOff
} from 'lucide-react';

export default function PanicButton({ tourist, onSosTriggered }) {
  const { emitPanicSos } = useSocket();
  const { t } = useLanguage();

  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [queuedSosItem, setQueuedSosItem] = useState(null);
  const [smsUri, setSmsUri] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isOffline, setIsOffline] = useState(!offlineStorage.isOnline());

  const progressIntervalRef = useRef(null);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    const handleNetworkChange = () => {
      const online = offlineStorage.isOnline();
      setIsOffline(!online);
      if (online) {
        offlineStorage.flushSosQueue((payload) => api.triggerPanicSos(payload)).then((flushed) => {
          if (flushed.length > 0) {
            setDeliveryStatus('DELIVERED');
            setQueuedSosItem(null);
          }
        });
      }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('offline-mode-changed', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('offline-mode-changed', handleNetworkChange);
      clearInterval(progressIntervalRef.current);
      clearInterval(countdownTimerRef.current);
    };
  }, []);

  const startHold = () => {
    if (activeAlert || cancelCountdown !== null) return;
    setHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    const duration = 2000;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(progressIntervalRef.current);
        setHolding(false);
        setHoldProgress(0);
        beginCancelCountdown();
      }
    }, 40);
  };

  const endHold = () => {
    setHolding(false);
    setHoldProgress(0);
    clearInterval(progressIntervalRef.current);
  };

  const beginCancelCountdown = () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    setCancelCountdown(5);

    let count = 5;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      setCancelCountdown(count);
      if (count <= 0) {
        clearInterval(countdownTimerRef.current);
        setCancelCountdown(null);
        executeSosDispatch('HOLD_GESTURE');
      }
    }, 1000);
  };

  const abortEmergencyCountdown = () => {
    clearInterval(countdownTimerRef.current);
    setCancelCountdown(null);
    setHolding(false);
    setHoldProgress(0);
  };

  const executeSosDispatch = async (triggerType = 'BUTTON_PRESS') => {
    if (!tourist || isTriggering) return;
    setIsTriggering(true);

    if (navigator.vibrate) {
      navigator.vibrate([500, 150, 500, 150, 500]);
    }

    const lat = tourist.lastLocation?.latitude || 25.5788;
    const lng = tourist.lastLocation?.longitude || 91.8933;

    const sosPayload = {
      touristId: tourist.touristId,
      latitude: lat,
      longitude: lng,
      locationName: tourist.lastLocation?.locationName || 'Shillong Sector Corridor',
      batteryLevel: tourist.lastLocation?.batteryLevel || 80,
      triggerType,
      emergencyNote: 'Direct SOS distress initiated by tourist.'
    };

    const signedSms = await smsFallback.createSignedCompactMessage({
      touristId: tourist.touristId,
      latitude: lat,
      longitude: lng
    });
    const generatedUri = smsFallback.buildSmsUri({
      targetNumber: '+917307007253',
      bodyText: signedSms
    });
    setSmsUri(generatedUri);

    if (!offlineStorage.isOnline()) {
      const queued = await offlineStorage.queueSos(sosPayload);
      setQueuedSosItem(queued);
      setDeliveryStatus('QUEUED');
      setIsTriggering(false);
      return;
    }

    try {
      const res = await api.triggerPanicSos(sosPayload);
      if (res.success) {
        setActiveAlert(res.alert);
        setDeliveryStatus('DELIVERED');
        emitPanicSos({
          ...res.alert,
          touristName: tourist.fullName
        });
        if (onSosTriggered) onSosTriggered(res.alert);
      } else {
        const queued = await offlineStorage.queueSos(sosPayload);
        setQueuedSosItem(queued);
        setDeliveryStatus('QUEUED');
      }
    } catch {
      const queued = await offlineStorage.queueSos(sosPayload);
      setQueuedSosItem(queued);
      setDeliveryStatus('QUEUED');
    } finally {
      setIsTriggering(false);
    }
  };

  const toggleVoiceSos = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser.');
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
      if (/help|bachao|emergency|police|save me/i.test(transcript)) {
        executeSosDispatch('VOICE_COMMAND');
      }
      setIsListeningVoice(false);
    };

    recognition.onerror = () => {
      setIsListeningVoice(false);
      setVoiceTranscript('Voice recognition canceled.');
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
    };

    recognition.start();
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="text-center max-w-md mx-auto space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-900">
            Immediate 24/7 Police Dispatch
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            Emergency Distress & Panic Button
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {cancelCountdown !== null
              ? `SOS will transmit in ${cancelCountdown}s. Tap Cancel if accidental.`
              : 'Press and hold for 2 seconds to initiate SOS ladder'}
          </p>
        </div>

        {cancelCountdown !== null && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between animate-pulse">
            <div className="text-left text-xs font-semibold text-amber-900 dark:text-amber-200">
              Triggering SOS in {cancelCountdown}s
            </div>
            <button
              onClick={abortEmergencyCountdown}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}

        <div className="relative flex items-center justify-center py-2">
          <div className="absolute w-44 h-44 rounded-full bg-red-500/10 pointer-events-none"></div>
          <div className="absolute w-36 h-36 rounded-full bg-red-500/20 pointer-events-none"></div>

          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            disabled={isTriggering || cancelCountdown !== null}
            className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-xl transition-all transform active:scale-95 select-none ${
              deliveryStatus === 'DELIVERED'
                ? 'bg-gradient-to-tr from-emerald-600 to-green-700 ring-8 ring-green-100'
                : deliveryStatus === 'QUEUED'
                ? 'bg-gradient-to-tr from-amber-600 to-red-600 ring-8 ring-amber-100'
                : 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 ring-8 ring-red-100 hover:ring-red-200'
            }`}
          >
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
            ) : deliveryStatus === 'DELIVERED' ? (
              <>
                <CheckCircle className="w-8 h-8 text-white" />
                <span className="text-xs mt-1 uppercase">Delivered</span>
              </>
            ) : deliveryStatus === 'QUEUED' ? (
              <>
                <Clock className="w-8 h-8 text-white animate-pulse" />
                <span className="text-xs mt-1 uppercase">Queued</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-9 h-9" />
                <span className="text-sm mt-1">{t('sos.panicButton')}</span>
                <span className="text-[9px] font-medium opacity-90">HOLD 2 SEC</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={toggleVoiceSos}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isListeningVoice
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-red-500" />
            <span>{isListeningVoice ? 'Listening...' : 'Voice SOS'}</span>
          </button>

          {smsUri && (
            <a
              href={smsUri}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send SOS by SMS</span>
            </a>
          )}
        </div>

        {voiceTranscript && (
          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
            {voiceTranscript}
          </div>
        )}

        {deliveryStatus && (
          <div className={`p-3.5 rounded-xl border text-left space-y-2 text-xs ${
            deliveryStatus === 'DELIVERED'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center space-x-1.5">
                {deliveryStatus === 'DELIVERED' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>STATUS: DELIVERED TO POLICE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    <span>STATUS: QUEUED (OFFLINE MODE)</span>
                  </>
                )}
              </span>
              <span className="text-[10px] font-mono">
                {activeAlert ? `#${activeAlert.id}` : '#LOCAL-QUEUE'}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed">
              {deliveryStatus === 'DELIVERED'
                ? 'Your emergency signal reached the dispatch gateway. All divisions have been alerted.'
                : 'Distress signal saved in local browser storage. It will auto-transmit the moment connectivity is restored. Tap "Send SOS by SMS" below for immediate offline delivery.'}
            </p>

            {deliveryStatus === 'QUEUED' && smsUri && (
              <div className="pt-1">
                <a
                  href={smsUri}
                  className="block text-center py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
                >
                  Open Phone SMS App (+91 7307007253)
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
