import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import { userService } from '../api/services';
import {
  User,
  Settings,
  Sparkles,
  Database,
  Cpu,
  Key,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Dairy',
  'Eggs',
  'Gluten',
  'Soy',
  'Sesame',
];

const DIET_TYPES = [
  'Balanced',
  'Mediterranean',
  'High-Protein',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Low-Carb',
];

export const ProfileSettings = () => {
  const { user } = useAuth();
  const { status, refreshStatus } = useSystem();

  const [dietType, setDietType] = useState('Balanced');
  const [allergies, setAllergies] = useState([]);
  const [cuisine, setCuisine] = useState('Mediterranean, Asian');
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [proteinTarget, setProteinTarget] = useState(120);
  const [carbsTarget, setCarbsTarget] = useState(220);
  const [fatsTarget, setFatsTarget] = useState(65);
  const [healthGoals, setHealthGoals] = useState('Maintain cardiovascular health, build lean muscle');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await userService.getPreferences();
      const p = res.data;
      if (p) {
        setDietType(p.diet_type || 'Balanced');
        setAllergies(p.allergies || []);
        setCuisine((p.cuisine_preferences || []).join(', '));
        setCalorieTarget(p.daily_calorie_target || 2000);
        if (p.macro_targets) {
          setProteinTarget(p.macro_targets.protein || 120);
          setCarbsTarget(p.macro_targets.carbs || 220);
          setFatsTarget(p.macro_targets.fats || 65);
        }
        setHealthGoals((p.health_goals || []).join(', '));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergy = (allergy) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      diet_type: dietType,
      allergies,
      cuisine_preferences: cuisine.split(',').map((c) => c.trim()).filter(Boolean),
      daily_calorie_target: Number(calorieTarget),
      macro_targets: {
        protein: Number(proteinTarget),
        carbs: Number(carbsTarget),
        fats: Number(fatsTarget),
      },
      health_goals: healthGoals.split(',').map((g) => g.trim()).filter(Boolean),
    };

    try {
      await userService.updatePreferences(payload);
      toast.success('Dietary preferences saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-forest">
          Profile & System Settings
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          Manage your personal dietary constraints and inspect live agent system connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dietary Preferences Form */}
        <div className="lg:col-span-2 bg-white rounded-card p-6 md:p-8 border border-mint-light shadow-soft space-y-6">
          <div className="flex items-center gap-3 border-b border-mint-light pb-4">
            <div className="w-10 h-10 rounded-xl bg-mint-light text-forest flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-forest">
                Dietary Profile & Health Targets
              </h3>
              <p className="text-xs text-charcoal-muted">
                Applied automatically across meal planning and nutrition analysis
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-5">
            {/* Diet Type */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5">
                Default Diet Type
              </label>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm font-medium"
              >
                {DIET_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-2">
                Declared Food Allergies & Intolerances
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGIES.map((allergy) => {
                  const isSelected = allergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-terracotta text-white border-terracotta'
                          : 'bg-white border-mint-light text-charcoal hover:bg-mint-soft'
                      }`}
                    >
                      {isSelected ? '✕ ' : '+ '}
                      {allergy}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Targets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">
                  Daily Calories (kcal)
                </label>
                <input
                  type="number"
                  step={50}
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-mint-light bg-cream/40 font-bold text-forest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step={5}
                  value={proteinTarget}
                  onChange={(e) => setProteinTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-mint-light bg-cream/40 font-bold text-forest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step={5}
                  value={carbsTarget}
                  onChange={(e) => setCarbsTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-mint-light bg-cream/40 font-bold text-forest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">
                  Fats (g)
                </label>
                <input
                  type="number"
                  step={5}
                  value={fatsTarget}
                  onChange={(e) => setFatsTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-mint-light bg-cream/40 font-bold text-forest"
                />
              </div>
            </div>

            {/* Cuisine & Goals */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5">
                Cuisine Preferences
              </label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1.5">
                Health & Wellness Goals
              </label>
              <input
                type="text"
                value={healthGoals}
                onChange={(e) => setHealthGoals(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: System Status Inspector */}
        <div className="bg-white rounded-card p-6 border border-mint-light shadow-soft space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-mint-light pb-3">
              <Cpu className="w-5 h-5 text-forest" />
              <h3 className="font-serif font-bold text-base text-forest">
                System Status & Architecture
              </h3>
            </div>

            {/* Mode Indicator */}
            <div className="p-3.5 rounded-xl bg-cream/60 border border-mint-light space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-charcoal-muted tracking-wider block">
                AI Provider Mode
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status?.is_demo ? 'bg-amber animate-pulse' : 'bg-mint-dark'
                  }`}
                ></span>
                <span className="text-sm font-bold text-charcoal">
                  {status?.is_demo ? 'DEMO MODE (Sample Data)' : 'LIVE AI (Google GenAI)'}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {status?.is_demo
                  ? 'Running realistic sample responses for all 5 features.'
                  : 'Live connected to Gemini model.'}
              </p>
            </div>

            {/* Database Status */}
            <div className="p-3.5 rounded-xl bg-cream/60 border border-mint-light space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-charcoal-muted tracking-wider block">
                Database Engine
              </span>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-forest" />
                <span className="text-sm font-bold text-charcoal">
                  {status?.db_type || 'Detecting...'}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {status?.is_in_memory_db
                  ? 'Self-healing in-memory fallback enabled automatically.'
                  : 'Connected to persistent MongoDB instance.'}
              </p>
            </div>

            {/* Model Name */}
            <div className="p-3.5 rounded-xl bg-cream/60 border border-mint-light space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-charcoal-muted tracking-wider block">
                Active AI Model
              </span>
              <span className="font-mono text-xs font-bold text-forest">
                {status?.gemini_model || 'gemini-2.5-flash'}
              </span>
            </div>
          </div>

          {/* How to activate Live Gemini Key guide */}
          <div className="p-4 rounded-xl bg-mint-soft/80 border border-mint text-xs text-charcoal space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-forest">
              <Key className="w-4 h-4 text-forest" />
              Switching to Live Mode
            </div>
            <p className="text-[11px] text-charcoal-muted leading-relaxed">
              To activate Live Gemini AI:
            </p>
            <ol className="list-decimal list-inside text-[11px] text-charcoal-muted space-y-1 font-mono">
              <li>Add <span className="font-bold text-forest">GEMINI_API_KEY</span> to <span className="text-forest">backend/.env</span></li>
              <li>Set <span className="font-bold text-forest">DEMO_MODE=false</span></li>
              <li>Restart backend server</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
