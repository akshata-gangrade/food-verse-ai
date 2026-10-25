import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import {
  Salad,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  ChefHat,
  CalendarCheck,
  ArrowRight,
  Zap,
  CheckCircle2,
  Database
} from 'lucide-react';

export const Landing = () => {
  const { loginWithDemo, isAuthenticated } = useAuth();
  const { status } = useSystem();
  const navigate = useNavigate();

  const handleDemoLaunch = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    const success = await loginWithDemo();
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center border border-mint/40 shadow-sm">
            <Salad className="w-6 h-6 text-mint" />
          </div>
          <div>
            <span className="font-serif font-bold text-xl text-forest tracking-tight block">
              Food Verse AI
            </span>
            <span className="text-[10px] text-forest/70 uppercase font-semibold tracking-widest block -mt-1">
              Multimodal Food Agent
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status?.is_in_memory_db && (
            <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-light text-amber-900 border border-amber/30">
              <Database className="w-3.5 h-3.5 text-amber" />
              In-Memory DB Active
            </span>
          )}

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-forest hover:bg-mint-light/50 transition"
              >
                Sign In
              </Link>
              <button
                onClick={handleDemoLaunch}
                className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-mint fill-mint" />
                Launch Demo (1-Click)
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mint-light border border-mint text-forest text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-forest" />
          Autonomous Multimodal Food Intelligence Agent
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-forest tracking-tight max-w-4xl leading-tight">
          Intelligent Nutrition, Visual Freshness & Kitchen Safety in One Agent
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-charcoal-muted max-w-2xl leading-relaxed">
          Upload meals for instant macronutrient breakdowns, evaluate produce aging with cautious safety insights, inspect kitchen hygiene compliance, and cook with step-by-step guided timers.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleDemoLaunch}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-forest hover:bg-forest-light text-white text-base font-semibold shadow-elevated transition flex items-center justify-center gap-2.5 group"
          >
            <Zap className="w-5 h-5 text-mint fill-mint group-hover:scale-110 transition-transform" />
            Launch Instant Demo Account
          </button>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-mint-soft border border-mint text-forest text-base font-semibold shadow-soft transition flex items-center justify-center gap-2"
          >
            Create New Account
            <ArrowRight className="w-4 h-4 text-forest" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft hover:shadow-elevated transition group">
            <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-4 group-hover:bg-forest group-hover:text-mint transition">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-forest mb-2">
              Food Recognition & Nutrition
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Multi-image camera intake estimating calories, protein, carbs, fats, fiber, and micronutrients with macro donut and itemized charts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft hover:shadow-elevated transition group">
            <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-4 group-hover:bg-forest group-hover:text-mint transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-forest mb-2">
              Visual Freshness Detection
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Detects visible bruising, wilting, and mold patterns with cautious storage guidance and transparent honesty disclaimers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft hover:shadow-elevated transition group">
            <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-4 group-hover:bg-forest group-hover:text-mint transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-forest mb-2">
              Restaurant Hygiene Monitor
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Evaluates prep counters, food storage, cross-contamination, and sanitation risks with printable audit reports.
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft hover:shadow-elevated transition group">
            <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-4 group-hover:bg-forest group-hover:text-mint transition">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-forest mb-2">
              Smart Cooking Assistant
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Streaming chat with ingredient substitutions, voice input, recipe generator, and step-by-step guided mode with interactive timers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft hover:shadow-elevated transition group">
            <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-4 group-hover:bg-forest group-hover:text-mint transition">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-forest mb-2">
              Personalized Meal Planner
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              1 or 7 day meal schedules validated server-side against allergies, with categorized grocery checklists and 1-click meal replacement.
            </p>
          </div>

          <div className="bg-forest-deep text-white p-6 rounded-card border border-mint/20 shadow-soft flex flex-col justify-between">
            <div>
              <span className="text-mint text-xs font-bold uppercase tracking-wider block mb-2">
                Production Ready
              </span>
              <h3 className="font-serif font-bold text-lg text-white mb-2">
                Self-Healing Architecture
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Runs out of the box with zero setup in Demo Mode or instantly upgrades to live Gemini 2.5 Flash with structured Pydantic JSON schemas.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-mint">
              <CheckCircle2 className="w-4 h-4" />
              <span>In-memory DB fallback included</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-mint-light/60 py-8 px-6 text-center text-xs text-charcoal-muted">
        <p>Food Verse AI © 2026 – Advanced Agentic Multimodal Food Intelligence Agent.</p>
        <p className="mt-1">All nutritional values and freshness assessments are AI estimates for guidance only.</p>
      </footer>
    </div>
  );
};
