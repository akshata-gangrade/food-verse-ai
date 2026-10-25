import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import {
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  ChefHat,
  CalendarCheck,
  Flame,
  Dna,
  BookMarked,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getSummary();
        setData(res.data);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  const {
    total_analyses = 0,
    analyses_by_feature = {},
    recent_activity = [],
    today_nutrition = { calories: 0, protein: 0, carbs: 0, fats: 0 },
    seven_day_nutrition = [],
    weekly_activity = [],
    saved_recipes_count = 0,
    saved_recipes_preview = [],
    active_meal_plan_days = 7,
  } = data || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-forest to-forest-light text-white p-6 md:p-8 rounded-card shadow-soft relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-mint text-xs font-bold uppercase tracking-wider block mb-1">
            Agent Dashboard
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold">
            Welcome, {user?.full_name || 'Chef'}!
          </h2>
          <p className="text-sm text-white/80 mt-2 leading-relaxed">
            Your multimodal food assistant is monitoring nutritional intake, assessing produce freshness, and tracking kitchen hygiene.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-mint/10 rounded-full blur-2xl"></div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="bg-white p-5 rounded-card shadow-soft border border-mint-light flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Total Analyses
            </p>
            <h3 className="font-serif text-2xl font-bold text-forest mt-1">
              {total_analyses}
            </h3>
            <p className="text-[11px] text-charcoal-muted mt-0.5">
              {analyses_by_feature.food || 0} meals · {analyses_by_feature.freshness || 0} freshness
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Calories */}
        <div className="bg-white p-5 rounded-card shadow-soft border border-mint-light flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Today's Calories
            </p>
            <h3 className="font-serif text-2xl font-bold text-forest mt-1">
              {today_nutrition.calories ? Math.round(today_nutrition.calories) : 0} <span className="text-xs font-sans font-normal text-charcoal-muted">kcal</span>
            </h3>
            <p className="text-[11px] text-charcoal-muted mt-0.5">
              From analyzed meals
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-light text-amber flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Protein */}
        <div className="bg-white p-5 rounded-card shadow-soft border border-mint-light flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Today's Protein
            </p>
            <h3 className="font-serif text-2xl font-bold text-forest mt-1">
              {today_nutrition.protein ? Math.round(today_nutrition.protein) : 0} <span className="text-xs font-sans font-normal text-charcoal-muted">g</span>
            </h3>
            <p className="text-[11px] text-charcoal-muted mt-0.5">
              Target ~120g/day
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center">
            <Dna className="w-6 h-6" />
          </div>
        </div>

        {/* Saved Recipes */}
        <div className="bg-white p-5 rounded-card shadow-soft border border-mint-light flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Saved Recipes
            </p>
            <h3 className="font-serif text-2xl font-bold text-forest mt-1">
              {saved_recipes_count}
            </h3>
            <p className="text-[11px] text-charcoal-muted mt-0.5">
              With guided timers
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-mint-light text-forest flex items-center justify-center">
            <BookMarked className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Five Quick Access Feature Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-forest">
            Quick Launch Intelligent Features
          </h3>
          <span className="text-xs text-charcoal-muted font-medium">5 Multimodal Agents</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/food-analyzer"
            className="bg-white p-4 rounded-card border border-mint-light hover:border-forest/40 shadow-soft hover:shadow-elevated transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-sm text-forest mb-1">
                Food Analyzer
              </h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Analyze calories and macronutrients from meal photos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-mint-light flex items-center justify-between text-xs font-semibold text-forest">
              <span>Analyze Food</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/freshness"
            className="bg-white p-4 rounded-card border border-mint-light hover:border-forest/40 shadow-soft hover:shadow-elevated transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-sm text-forest mb-1">
                Freshness Check
              </h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Assess visible produce decay, bruising, and wilting.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-mint-light flex items-center justify-between text-xs font-semibold text-forest">
              <span>Check Produce</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/hygiene"
            className="bg-white p-4 rounded-card border border-mint-light hover:border-forest/40 shadow-soft hover:shadow-elevated transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-sm text-forest mb-1">
                Hygiene Monitor
              </h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Audit kitchen surfaces and prep sanitation risk.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-mint-light flex items-center justify-between text-xs font-semibold text-forest">
              <span>Inspect Kitchen</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/assistant"
            className="bg-white p-4 rounded-card border border-mint-light hover:border-forest/40 shadow-soft hover:shadow-elevated transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ChefHat className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-sm text-forest mb-1">
                Cooking Assistant
              </h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Guided recipes with step-by-step interactive timers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-mint-light flex items-center justify-between text-xs font-semibold text-forest">
              <span>Ask Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/meal-planner"
            className="bg-white p-4 rounded-card border border-mint-light hover:border-forest/40 shadow-soft hover:shadow-elevated transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-mint-light text-forest flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-sm text-forest mb-1">
                Meal Planner
              </h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                7-day schedule with allergy checks and groceries.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-mint-light flex items-center justify-between text-xs font-semibold text-forest">
              <span>Generate Plan</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Charts Section: 7-Day Nutrition and Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Nutrition Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-card border border-mint-light shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-forest">
                7-Day Calorie & Macro Trend
              </h3>
              <p className="text-xs text-charcoal-muted">
                Daily calories (kcal) and protein breakdown
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-charcoal-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-forest"></span> Calories
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-mint-dark"></span> Protein (g)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seven_day_nutrition}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3F6EC" vertical={false} />
                <XAxis dataKey="date" stroke="#768B81" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#768B81" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#768B81" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#14352A',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="calories"
                  stroke="#1F4D3A"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1F4D3A' }}
                  name="Calories (kcal)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="protein"
                  stroke="#7ED8B6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#7ED8B6' }}
                  name="Protein (g)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity Bar Chart */}
        <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft">
          <div className="mb-4">
            <h3 className="font-serif font-bold text-base text-forest">
              Weekly Activity
            </h3>
            <p className="text-xs text-charcoal-muted">
              Analyses completed per day
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly_activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3F6EC" vertical={false} />
                <XAxis dataKey="day" stroke="#768B81" fontSize={11} tickLine={false} />
                <YAxis stroke="#768B81" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#14352A',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#1F4D3A" radius={[6, 6, 0, 0]} name="Analyses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Feed & Saved Recipes Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-forest">
              Recent Activity Feed
            </h3>
            <Link to="/history" className="text-xs font-semibold text-forest hover:underline">
              View all history →
            </Link>
          </div>

          {recent_activity.length === 0 ? (
            <div className="text-center py-8 text-charcoal-muted text-xs">
              No analyses recorded yet. Start by analyzing a meal!
            </div>
          ) : (
            <div className="divide-y divide-mint-light">
              {recent_activity.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt="Thumbnail"
                        className="w-10 h-10 rounded-lg object-cover border border-mint-light shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-mint-light text-forest flex items-center justify-center shrink-0">
                        {item.feature === 'food' ? (
                          <UtensilsCrossed className="w-5 h-5" />
                        ) : item.feature === 'freshness' ? (
                          <Sparkles className="w-5 h-5" />
                        ) : (
                          <ShieldCheck className="w-5 h-5" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-charcoal truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-charcoal-muted truncate">
                        {item.summary || `${item.feature.toUpperCase()} analysis`}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-charcoal-muted shrink-0 font-medium">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Recipes Preview */}
        <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-base text-forest">
              Saved Recipes Preview
            </h3>
            <Link to="/recipes" className="text-xs font-semibold text-forest hover:underline">
              All recipes ({saved_recipes_count}) →
            </Link>
          </div>

          {saved_recipes_preview.length === 0 ? (
            <div className="text-center py-8 text-charcoal-muted text-xs">
              No saved recipes yet. Ask the Cooking Assistant to generate a recipe!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {saved_recipes_preview.map((rec) => (
                <Link
                  key={rec.id}
                  to="/recipes"
                  className="p-3.5 rounded-xl border border-mint-light hover:border-mint hover:bg-mint-soft transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-forest uppercase tracking-wider block">
                      {rec.cuisine || 'Gourmet'}
                    </span>
                    <h4 className="font-serif font-bold text-xs text-charcoal mt-1 line-clamp-1">
                      {rec.title}
                    </h4>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-charcoal-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-forest" />
                      {rec.cook_time_minutes}m cook
                    </span>
                    <span>~{rec.calories_per_serving} kcal</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
