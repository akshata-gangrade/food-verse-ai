import React, { useState } from 'react';
import { mealPlanService } from '../api/services';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  CalendarCheck,
  Sparkles,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  Square,
  Clock,
  Flame,
  Dna,
  ShoppingBag,
  ShieldAlert,
  ChevronRight
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

export const MealPlanner = () => {
  // Form State
  const [dietType, setDietType] = useState('Balanced');
  const [selectedAllergies, setSelectedAllergies] = useState(['Peanuts']);
  const [customAllergy, setCustomAllergy] = useState('');
  const [cuisine, setCuisine] = useState('Mediterranean, Asian');
  const [budget, setBudget] = useState('Moderate');
  const [ingredientsOnHand, setIngredientsOnHand] = useState('');
  const [targetCalories, setTargetCalories] = useState(2100);
  const [targetProtein, setTargetProtein] = useState(125);
  const [days, setDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [groceryChecks, setGroceryChecks] = useState({});
  const [replacingMealKey, setReplacingMealKey] = useState(null);

  const toggleAllergy = (allergy) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    if (!selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies((prev) => [...prev, customAllergy.trim()]);
    }
    setCustomAllergy('');
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setLoading(true);

    const payload = {
      diet_type: dietType,
      allergies: selectedAllergies,
      cuisine_preferences: cuisine.split(',').map((c) => c.trim()).filter(Boolean),
      budget,
      ingredients_on_hand: ingredientsOnHand,
      target_calories: Number(targetCalories),
      macro_targets: {
        protein: Number(targetProtein),
        carbs: Math.round((targetCalories * 0.45) / 4),
        fats: Math.round((targetCalories * 0.25) / 9),
      },
      days: Number(days),
      meals_per_day: Number(mealsPerDay),
    };

    try {
      const res = await mealPlanService.generateMealPlan(payload);
      setPlan(res.data);
      setActiveDay(1);
      setGroceryChecks({});
      toast.success(`${days}-Day meal schedule generated!`, { icon: '🥗' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate meal plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceMeal = async (dayNumber, mealType) => {
    if (!plan?.id) return;
    const key = `${dayNumber}-${mealType}`;
    setReplacingMealKey(key);

    try {
      const res = await mealPlanService.replaceMeal(plan.id, {
        day: dayNumber,
        meal_type: mealType,
        diet_type: dietType,
        allergies: selectedAllergies,
        target_calories: Math.round(targetCalories / mealsPerDay),
      });
      setPlan(res.data);
      toast.success(`Replaced ${mealType} on Day ${dayNumber}!`, { icon: '🔄' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to replace meal.');
    } finally {
      setReplacingMealKey(null);
    }
  };

  const toggleGroceryItem = (idx) => {
    setGroceryChecks((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const currentDailyPlan = plan?.daily_plans?.find((p) => p.day === activeDay) || plan?.daily_plans?.[0];

  // Group groceries by category
  const groupedGroceries = plan?.grocery_list?.reduce((acc, item, idx) => {
    const cat = item.category || 'General Pantry';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...item, originalIndex: idx });
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-forest">
          Personalized Meal Planner
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          Automated dietary scheduling validated server-side against allergies, with categorized grocery checklists.
        </p>
      </div>

      {!plan ? (
        /* Form Generator */
        <div className="bg-white rounded-card p-6 md:p-8 border border-mint-light shadow-soft max-w-4xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Top row: Diet & Days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Diet Type
                </label>
                <select
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 font-medium"
                >
                  {DIET_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Duration (Days)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDays(1)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                      days === 1
                        ? 'bg-forest text-white border-forest'
                        : 'bg-white border-mint-light text-charcoal hover:bg-mint-soft'
                    }`}
                  >
                    1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setDays(7)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                      days === 7
                        ? 'bg-forest text-white border-forest'
                        : 'bg-white border-mint-light text-charcoal hover:bg-mint-soft'
                    }`}
                  >
                    7 Days (Full Week)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Meals per Day
                </label>
                <select
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 font-medium"
                >
                  <option value={2}>2 Meals (Brunch, Dinner)</option>
                  <option value={3}>3 Meals (Breakfast, Lunch, Dinner)</option>
                  <option value={4}>4 Meals (+ Snack)</option>
                  <option value={5}>5 Meals (+ Pre/Post Workout)</option>
                </select>
              </div>
            </div>

            {/* Calories & Protein targets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Daily Calorie Goal (kcal)
                </label>
                <input
                  type="number"
                  min={1200}
                  max={4500}
                  step={50}
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Daily Protein Goal (grams)
                </label>
                <input
                  type="number"
                  min={40}
                  max={300}
                  step={5}
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Grocery Budget
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 font-medium"
                >
                  <option value="Budget-Friendly">Budget-Friendly</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Premium / Organic">Premium / Organic</option>
                </select>
              </div>
            </div>

            {/* Allergies to strictly avoid */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-2">
                Allergies to Strictly Avoid (Server-Side Verified)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_ALLERGIES.map((allergy) => {
                  const isSelected = selectedAllergies.includes(allergy);
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

              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  placeholder="Add other allergen (e.g. Mustard)"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-mint-light bg-cream/40"
                />
                <button
                  type="button"
                  onClick={addCustomAllergy}
                  className="px-3 py-2 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-light"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Ingredients on hand & Cuisines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Cuisine Preferences
                </label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. Mediterranean, Indian, Japanese"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Ingredients on Hand (Optional)
                </label>
                <input
                  type="text"
                  value={ingredientsOnHand}
                  onChange={(e) => setIngredientsOnHand(e.target.value)}
                  placeholder="e.g. Quinoa, black beans, sweet potatoes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 rounded-xl bg-forest hover:bg-forest-light text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Synthesizing & Validating Meal Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-mint" />
                    Generate Personalized Meal Schedule
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <DemoNoticeBanner source={plan.source} />

          {/* Top Bar */}
          <div className="bg-white rounded-card p-6 border border-mint-light shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest block">
                {plan.days_count}-Day Nutrition Schedule
              </span>
              <h3 className="font-serif text-2xl font-bold text-charcoal mt-1">
                {plan.title}
              </h3>
            </div>

            <button
              onClick={() => setPlan(null)}
              className="px-4 py-2 rounded-xl border border-mint-light hover:bg-mint-soft text-charcoal text-xs font-semibold flex items-center gap-1.5 transition self-start md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-forest" />
              Change Parameters
            </button>
          </div>

          {/* Server-Side Allergy Warning Banner */}
          {plan.detected_allergy_warnings?.length > 0 && (
            <div className="p-4 rounded-xl bg-terracotta-light border border-terracotta/40 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold uppercase tracking-wider text-terracotta block">
                  Server Allergy Alert Flagged
                </strong>
                <p className="text-xs text-charcoal mt-1">
                  Our server-side allergen inspector flagged potential conflicts with declared allergies:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-charcoal-muted list-disc list-inside">
                  {plan.detected_allergy_warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Days Tabs (if multiple days) */}
          {plan.days_count > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {plan.daily_plans?.map((dp) => (
                <button
                  key={dp.day}
                  onClick={() => setActiveDay(dp.day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 ${
                    activeDay === dp.day
                      ? 'bg-forest text-white shadow-sm'
                      : 'bg-white border border-mint-light text-charcoal hover:bg-mint-soft'
                  }`}
                >
                  <span>Day {dp.day}</span>
                  <span className={`text-[10px] font-normal ${activeDay === dp.day ? 'text-mint' : 'text-charcoal-muted'}`}>
                    {dp.daily_calories} kcal
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Day Overview Card */}
          {currentDailyPlan && (
            <div className="bg-white rounded-card p-6 border border-mint-light shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mint-light pb-4">
                <div>
                  <h4 className="font-serif text-xl font-bold text-forest">
                    {currentDailyPlan.day_name || `Day ${currentDailyPlan.day}`} Schedule
                  </h4>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    {currentDailyPlan.meals?.length} planned meals for the day
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-amber-700">
                    <Flame className="w-4 h-4" />
                    {currentDailyPlan.daily_calories} kcal
                  </span>
                  <span className="flex items-center gap-1 text-forest">
                    <Dna className="w-4 h-4" />
                    {currentDailyPlan.daily_protein}g protein
                  </span>
                  <span className="text-charcoal-muted">
                    {currentDailyPlan.daily_carbs}g carbs · {currentDailyPlan.daily_fats}g fats
                  </span>
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentDailyPlan.meals?.map((meal, mIdx) => {
                  const isReplacing = replacingMealKey === `${currentDailyPlan.day}-${meal.meal_type}`;
                  return (
                    <div
                      key={mIdx}
                      className="p-5 rounded-2xl border border-mint-light bg-cream/40 flex flex-col justify-between space-y-4 hover:border-mint transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-mint-light text-forest">
                            {meal.meal_type}
                          </span>
                          <span className="text-[11px] font-semibold text-charcoal-muted">
                            {meal.prep_time || '15 mins'}
                          </span>
                        </div>

                        <h5 className="font-serif font-bold text-base text-charcoal">
                          {meal.name}
                        </h5>

                        <p className="text-xs text-charcoal-muted leading-relaxed">
                          {meal.description}
                        </p>

                        {/* Ingredients */}
                        <div className="pt-2 border-t border-mint-light/60">
                          <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider block mb-1">
                            Key Ingredients:
                          </span>
                          <p className="text-xs text-charcoal">
                            {meal.ingredients?.join(', ')}
                          </p>
                        </div>

                        {/* Allergy flags on this specific meal */}
                        {meal.allergy_flags?.length > 0 && (
                          <div className="p-2 rounded-lg bg-terracotta-light text-[11px] text-terracotta border border-terracotta/30 font-medium">
                            ⚠️ {meal.allergy_flags.join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-mint-light/60 flex items-center justify-between">
                        <div className="text-xs font-semibold text-charcoal-muted">
                          <span className="text-forest font-bold">{meal.calories}</span> kcal · {meal.protein}g pro
                        </div>

                        {/* Replace this meal button */}
                        <button
                          type="button"
                          onClick={() => handleReplaceMeal(currentDailyPlan.day, meal.meal_type)}
                          disabled={isReplacing}
                          className="px-2.5 py-1.5 rounded-lg border border-mint-light hover:border-forest hover:bg-white text-[11px] font-semibold text-forest flex items-center gap-1 transition"
                          title="Generate a replacement meal"
                        >
                          <RefreshCw className={`w-3 h-3 ${isReplacing ? 'animate-spin' : ''}`} />
                          {isReplacing ? 'Replacing...' : 'Replace'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consolidated Grocery List (Checkable items) */}
          <div className="bg-white rounded-card p-6 md:p-8 border border-mint-light shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-forest" />
              <h4 className="font-serif font-bold text-lg text-forest">
                Consolidated Grocery Checklist ({plan.grocery_list?.length} items)
              </h4>
            </div>
            <p className="text-xs text-charcoal-muted mb-6">
              Grouped by department for quick shopping. Check off items as you shop.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groupedGroceries).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-xs font-bold text-forest uppercase tracking-wider pb-1 border-b border-mint-light">
                    {category}
                  </h5>
                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const isChecked = !!groceryChecks[item.originalIndex];
                      return (
                        <div
                          key={item.originalIndex}
                          onClick={() => toggleGroceryItem(item.originalIndex)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-mint-soft/40 text-charcoal-muted line-through'
                              : 'hover:bg-cream/80 text-charcoal'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-charcoal-muted shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block truncate">{item.name}</span>
                            <span className="text-[10px] text-charcoal-muted">{item.quantity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permanent Disclaimer */}
          <DisclaimerBanner text="General guidance, not medical advice. Consult a professional for medical conditions or severe allergies." />
        </div>
      )}
    </div>
  );
};
