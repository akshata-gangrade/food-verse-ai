import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white rounded-card p-6 shadow-soft border border-mint-light animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-mint-light/80 rounded-xl"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-mint-light/80 rounded w-1/3"></div>
        <div className="h-3 bg-mint-light/60 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-3 bg-mint-light/50 rounded w-full"></div>
      <div className="h-3 bg-mint-light/50 rounded w-4/5"></div>
      <div className="h-3 bg-mint-light/50 rounded w-2/3"></div>
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white rounded-card p-6 shadow-soft border border-mint-light animate-pulse">
    <div className="h-5 bg-mint-light/80 rounded w-1/4 mb-6"></div>
    <div className="h-56 bg-mint-light/40 rounded-xl flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-4 border-mint-light border-t-forest/30 animate-spin"></div>
    </div>
  </div>
);
