import React from 'react';
import { AlertCircle, ShieldAlert, Info } from 'lucide-react';

export const DisclaimerBanner = ({ text, type = 'info' }) => {
  if (!text) return null;

  const isWarning = type === 'warning' || text.toLowerCase().includes('visual assessment only');

  return (
    <div
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs leading-relaxed my-3 ${
        isWarning
          ? 'bg-amber-light/70 border-amber/30 text-charcoal'
          : 'bg-mint-light/60 border-mint/40 text-charcoal'
      }`}
    >
      {isWarning ? (
        <ShieldAlert className="w-4 h-4 text-amber shrink-0 mt-0.5" />
      ) : (
        <Info className="w-4 h-4 text-forest shrink-0 mt-0.5" />
      )}
      <div>
        <span className="font-semibold uppercase tracking-wider text-[10px] block text-charcoal-muted">
          {isWarning ? 'Safety Notice' : 'Notice'}
        </span>
        <p className="mt-0.5">{text}</p>
      </div>
    </div>
  );
};
