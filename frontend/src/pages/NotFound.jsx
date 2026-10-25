import React from 'react';
import { Link } from 'react-router-dom';
import { Salad, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-forest text-mint flex items-center justify-center mb-4 shadow-soft">
        <Salad className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
        404 Page Not Found
      </span>
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-forest mt-2 mb-3">
        Dish Not on the Menu
      </h2>
      <p className="text-xs md:text-sm text-charcoal-muted max-w-md mb-6 leading-relaxed">
        The page or recipe you are looking for doesn't exist or has moved to a different pantry.
      </p>
      <Link
        to="/dashboard"
        className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
