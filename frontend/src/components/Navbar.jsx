import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import { Menu, User, LogOut, Settings as SettingsIcon, Database, Sparkles, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/food-analyzer': 'Food Recognition & Nutrition',
  '/freshness': 'Food Freshness Detection',
  '/hygiene': 'Restaurant Hygiene Monitoring',
  '/assistant': 'Smart Cooking Assistant',
  '/meal-planner': 'Personalized Meal Planner',
  '/history': 'Analysis History',
  '/recipes': 'Saved Recipes',
  '/settings': 'Profile & System Settings',
};

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { status } = useSystem();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const title = PAGE_TITLES[location.pathname] || 'Food Verse AI';

  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-md border-b border-mint-light/60 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-forest hover:bg-mint-light/50 transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-xl md:text-2xl font-bold text-forest tracking-tight">
          {title}
        </h1>
      </div>

      {/* Center / Right: Mode Badges & User Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Temporary In-Memory Database Banner */}
        {status?.is_in_memory_db && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-light text-amber-900 border border-amber/40 shadow-sm"
            title="Active database is in-memory fallback. Data will reset on server restart."
          >
            <Database className="w-3.5 h-3.5 text-amber animate-pulse" />
            <span className="hidden sm:inline">Temporary in-memory database</span>
            <span className="sm:hidden">In-Memory DB</span>
          </div>
        )}

        {/* Persistent Mode Badge */}
        {status?.is_demo ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber text-charcoal border border-amber-dark/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-charcoal" />
            <span>DEMO MODE – sample data</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-mint-light text-forest border border-mint shadow-sm">
            <span className="w-2 h-2 rounded-full bg-forest animate-ping"></span>
            <span>LIVE AI ({status?.gemini_model || 'Gemini'})</span>
          </div>
        )}

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 pl-3 rounded-full hover:bg-mint-light/50 border border-mint-light transition"
          >
            <div className="w-7 h-7 rounded-full bg-forest text-mint flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold text-charcoal hidden sm:inline max-w-[120px] truncate">
              {user?.full_name || 'Chef'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-muted" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-card shadow-elevated border border-mint-light py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-mint-light">
                  <p className="text-xs font-bold text-charcoal truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-charcoal-muted truncate">{user?.email}</p>
                  {user?.is_demo_account && (
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-amber-light text-amber-800 px-2 py-0.5 rounded-full">
                      Demo Account
                    </span>
                  )}
                </div>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-charcoal hover:bg-mint-soft transition"
                >
                  <SettingsIcon className="w-4 h-4 text-forest" />
                  Preferences & Settings
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-terracotta hover:bg-terracotta-light/40 transition border-t border-mint-light mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
