import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SafetyScoreGauge({ score = 85, tier = 'EXCELLENT', advisory = '', deductions = [] }) {
  const { t } = useLanguage();

  const getScoreColor = () => {
    if (score >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'border-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' };
    if (score >= 50) return { text: 'text-amber-500', bg: 'bg-amber-500', ring: 'border-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' };
    return { text: 'text-red-500', bg: 'bg-red-500', ring: 'border-red-500', lightBg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' };
  };

  const colors = getScoreColor();
  const circumference = 2 * Math.PI * 45; // radius 45
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`p-6 rounded-2xl border ${colors.border} ${colors.lightBg} shadow-sm backdrop-blur-sm transition-all`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Gauge Circle */}
        <div className="flex items-center space-x-5">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`${colors.text} transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-extrabold tracking-tight ${colors.text}`}>
                {score}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('safetyScore.title')}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                score >= 80 ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' :
                score >= 50 ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {tier}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {score >= 80 ? 'Optimal Safety Conditions' : score >= 50 ? 'Elevated Caution Advised' : 'Critical Hazard Detected'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md leading-relaxed">
              {advisory || (score >= 80 ? t('safetyScore.safeAdvice') : score >= 50 ? t('safetyScore.cautionAdvice') : t('safetyScore.criticalAdvice'))}
            </p>
          </div>
        </div>

        {/* Right: Breakdown Factors */}
        <div className="w-full md:w-auto flex-1 max-w-sm bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2">
          <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <span>Safety Factor Breakdown</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="space-y-1.5">
            {(() => {
              const hasDeduction = (pattern) => {
                if (!Array.isArray(deductions) || deductions.length === 0) return false;
                const p = pattern.toLowerCase();
                return deductions.some(d => {
                  const text = typeof d === 'string' ? d : (d?.reason || '');
                  return text.toLowerCase().includes(p);
                });
              };

              const getDeductionLabel = (pattern, fallback) => {
                if (!Array.isArray(deductions) || deductions.length === 0) return fallback;
                const p = pattern.toLowerCase();
                const found = deductions.find(d => {
                  const text = typeof d === 'string' ? d : (d?.reason || '');
                  return text.toLowerCase().includes(p);
                });
                if (!found) return fallback;
                return typeof found === 'string' ? found : (found.reason || fallback);
              };

              const isZonePenalty = hasDeduction('geo-fence') || hasDeduction('restricted') || hasDeduction('breach') || hasDeduction('hazard');
              const isNightPenalty = hasDeduction('night travel') || hasDeduction('curfew');
              const isOffRoutePenalty = hasDeduction('off-route') || hasDeduction('deviation');

              return (
                <>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{t('safetyScore.zoneSensitivity')}</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {isZonePenalty ? 'Risk Zone Penalty (-30)' : 'Normal Sector (+30)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{t('safetyScore.timeOfDay')}</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {isNightPenalty ? 'Night Curfew (-15)' : 'Daylight Nominal (+25)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{t('safetyScore.routeAdherence')}</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {isOffRoutePenalty ? getDeductionLabel('off-route', 'Off-Route Penalty (-25)') : 'On Planned Route (+25)'}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
