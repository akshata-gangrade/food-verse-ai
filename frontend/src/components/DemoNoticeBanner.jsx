import React from 'react';
import { Sparkles } from 'lucide-react';

export const DemoNoticeBanner = ({ source }) => {
  if (source !== 'demo_sample') return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-light border border-amber/40 rounded-xl text-xs font-medium text-charcoal mb-4 animate-fadeIn">
      <Sparkles className="w-4 h-4 text-amber shrink-0" />
      <span>
        <strong className="font-semibold text-charcoal">DEMO SAMPLE:</strong> Sample result – this is not an analysis of your upload.
      </span>
    </div>
  );
};
