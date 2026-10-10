import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Eye, Type } from 'lucide-react';

export default function AccessibilityBar() {
  const { highContrast, toggleHighContrast, fontSizeScale, setFontSizeScale } = useAccessibility();

  return (
    <div className="flex items-center space-x-2">
      {/* High Contrast Toggle */}
      <button
        onClick={toggleHighContrast}
        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          highContrast
            ? 'bg-yellow-400 text-black border-yellow-500 shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
        }`}
        title="Toggle High Contrast Mode (WCAG 2.1 AA)"
        aria-pressed={highContrast}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>{highContrast ? 'High Contrast: ON' : 'Contrast'}</span>
      </button>

      {/* Font Size Adjuster */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setFontSizeScale('normal')}
          className={`px-2 py-1 text-xs font-bold rounded ${
            fontSizeScale === 'normal'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Default Text Size (A)"
        >
          A
        </button>
        <button
          onClick={() => setFontSizeScale('large')}
          className={`px-2 py-1 text-xs font-bold rounded ${
            fontSizeScale === 'large'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Large Text Size (A+)"
        >
          A+
        </button>
        <button
          onClick={() => setFontSizeScale('xlarge')}
          className={`px-2 py-1 text-xs font-bold rounded ${
            fontSizeScale === 'xlarge'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Extra Large Text Size (A++)"
        >
          A++
        </button>
      </div>
    </div>
  );
}
