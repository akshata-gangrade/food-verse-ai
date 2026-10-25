import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  ChefHat,
  CalendarCheck,
  BookMarked,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Salad
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/food-analyzer', label: 'Food Analyzer', icon: UtensilsCrossed },
  { path: '/freshness', label: 'Freshness Check', icon: Sparkles },
  { path: '/hygiene', label: 'Hygiene Monitor', icon: ShieldCheck },
  { path: '/assistant', label: 'Cooking Assistant', icon: ChefHat },
  { path: '/meal-planner', label: 'Meal Planner', icon: CalendarCheck },
  { path: '/recipes', label: 'Saved Recipes', icon: BookMarked },
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-forest-deep text-white flex flex-col transition-all duration-300 ease-in-out md:static ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-forest-light flex items-center justify-center shrink-0 border border-mint/30 shadow-sm">
              <Salad className="w-6 h-6 text-mint" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="truncate">
                <span className="font-serif font-bold text-lg tracking-wide text-white block">
                  Food Verse AI
                </span>
                <span className="text-[10px] text-mint uppercase font-semibold tracking-widest block -mt-1">
                  Food Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-mint text-forest-deep font-semibold shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105`} />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex p-3 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
