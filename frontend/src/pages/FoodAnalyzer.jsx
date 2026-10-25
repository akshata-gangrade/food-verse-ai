import React, { useState, useRef } from 'react';
import { foodService } from '../api/services';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Upload,
  Camera,
  X,
  Sparkles,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

const MACRO_COLORS = ['#1F4D3A', '#7ED8B6', '#E9B44C']; // Protein, Carbs, Fats

export const FoodAnalyzer = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate size and format
    const validFiles = [];
    const validPreviews = [];

    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds 8 MB.`);
        continue;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...validPreviews]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedFiles.length) {
      toast.error('Please upload or snap at least one food image.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    selectedFiles.forEach((f) => formData.append('files', f));
    if (note) formData.append('note', note);
    formData.append('save_to_history', 'true');

    try {
      const res = await foodService.analyzeFood(formData);
      setResult(res.data);
      toast.success('Food & nutrition analysis complete!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to analyze food.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setNote('');
    setResult(null);
  };

  // Prepare chart data
  const macroPieData = result
    ? [
        { name: 'Protein', value: result.total_nutrition?.protein * 4 || 1, color: '#1F4D3A' },
        { name: 'Carbs', value: result.total_nutrition?.carbs * 4 || 1, color: '#7ED8B6' },
        { name: 'Fats', value: result.total_nutrition?.fats * 9 || 1, color: '#E9B44C' },
      ]
    : [];

  const itemsBarData = result?.identified_items?.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    Calories: item.calories,
    Protein: item.protein,
    Carbs: item.carbs,
    Fats: item.fats,
  })) || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-forest">
          Food Recognition & Nutrition Analysis
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          Upload meal photos or use your camera to receive instant macronutrient breakdown and itemized nutritional estimates.
        </p>
      </div>

      {/* Main Content Area */}
      {!result ? (
        <div className="bg-white rounded-card p-6 md:p-8 border border-mint-light shadow-soft max-w-3xl">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-mint hover:border-forest/50 bg-mint-soft/50 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center group"
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center text-forest mb-4 group-hover:scale-105 transition-transform border border-mint">
              <Upload className="w-8 h-8 text-forest" />
            </div>
            <p className="text-sm font-bold text-charcoal">
              Click to upload or drag & drop food images
            </p>
            <p className="text-xs text-charcoal-muted mt-1">
              Supports JPEG, PNG, WEBP (Max 8 MB per file)
            </p>
          </div>

          {/* Hidden Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            capture="environment"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Camera Button for mobile / quick snap */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-mint-light hover:bg-mint text-forest text-xs font-semibold flex items-center gap-2 transition border border-mint"
            >
              <Camera className="w-4 h-4" />
              Capture with Camera
            </button>
          </div>

          {/* Previews Grid */}
          {previews.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-3">
                Selected Images ({previews.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-mint shadow-sm group aspect-square">
                    <img src={src} alt="Food preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 p-1 bg-charcoal/70 hover:bg-terracotta text-white rounded-full transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Note Field */}
          <div className="mt-6">
            <label className="block text-xs font-bold text-charcoal mb-1.5">
              Optional Note / Dietary Context
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Homemade avocado toast with organic pasture eggs, olive oil drizzle"
              className="w-full px-4 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || selectedFiles.length === 0}
              className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition ${
                loading || selectedFiles.length === 0
                  ? 'bg-mint-light text-forest/50 cursor-not-allowed'
                  : 'bg-forest hover:bg-forest-light text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing Nutritional Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-mint" />
                  Analyze Food & Nutrition
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <DemoNoticeBanner source={result.source} />

          {/* Top Actions & Title */}
          <div className="bg-white rounded-card p-6 border border-mint-light shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest block">
                Analysis Complete
              </span>
              <h3 className="font-serif text-2xl font-bold text-charcoal mt-1">
                {result.title}
              </h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                {result.identified_items?.length} food items recognized · AI nutritional estimation
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-mint-light hover:bg-mint-soft text-charcoal text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-forest" />
                Analyze Another Meal
              </button>
            </div>
          </div>

          {/* Total Nutrition Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-4 rounded-xl border border-mint-light shadow-sm text-center">
              <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">Calories</span>
              <p className="font-serif text-xl font-bold text-forest mt-1">
                {Math.round(result.total_nutrition?.calories || 0)}
              </p>
              <span className="text-[10px] text-charcoal-muted font-medium">kcal (AI est.)</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-mint-light shadow-sm text-center">
              <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">Protein</span>
              <p className="font-serif text-xl font-bold text-forest mt-1">
                {result.total_nutrition?.protein || 0}g
              </p>
              <span className="text-[10px] text-mint-dark font-medium">{result.macro_percentages?.protein || 0}% cal</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-mint-light shadow-sm text-center">
              <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">Carbs</span>
              <p className="font-serif text-xl font-bold text-forest mt-1">
                {result.total_nutrition?.carbs || 0}g
              </p>
              <span className="text-[10px] text-mint-dark font-medium">{result.macro_percentages?.carbs || 0}% cal</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-mint-light shadow-sm text-center">
              <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">Fats</span>
              <p className="font-serif text-xl font-bold text-forest mt-1">
                {result.total_nutrition?.fats || 0}g
              </p>
              <span className="text-[10px] text-amber font-medium">{result.macro_percentages?.fats || 0}% cal</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-mint-light shadow-sm text-center">
              <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">Fiber</span>
              <p className="font-serif text-xl font-bold text-forest mt-1">
                {result.total_nutrition?.fiber || 0}g
              </p>
              <span className="text-[10px] text-charcoal-muted font-medium">dietary</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-mint-light shadow-sm text-center">
              <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">Sugar</span>
              <p className="font-serif text-xl font-bold text-forest mt-1">
                {result.total_nutrition?.sugar || 0}g
              </p>
              <span className="text-[10px] text-charcoal-muted font-medium">natural & added</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-mint-light shadow-sm text-center">
              <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">Sodium</span>
              <p className="font-serif text-xl font-bold text-forest mt-1">
                {result.total_nutrition?.sodium || 0}mg
              </p>
              <span className="text-[10px] text-charcoal-muted font-medium">salt content</span>
            </div>
          </div>

          {/* Charts Row: Macro Donut Chart & Items Calories Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Macro Donut Chart */}
            <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-forest mb-1">
                  Macronutrient Ratio
                </h4>
                <p className="text-xs text-charcoal-muted">Percentage of total calories</p>
              </div>

              <div className="h-56 relative flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {macroPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${Math.round(val)} kcal`, 'Energy']}
                      contentStyle={{
                        backgroundColor: '#14352A',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-xl font-bold font-serif text-forest block">
                    {Math.round(result.total_nutrition?.calories || 0)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-charcoal-muted font-semibold">
                    kcal
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-around border-t border-mint-light pt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
                  <span className="text-charcoal-muted">Protein: {result.macro_percentages?.protein}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-mint-dark"></span>
                  <span className="text-charcoal-muted">Carbs: {result.macro_percentages?.carbs}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber"></span>
                  <span className="text-charcoal-muted">Fats: {result.macro_percentages?.fats}%</span>
                </div>
              </div>
            </div>

            {/* Calories Breakdown by Food Item */}
            <div className="lg:col-span-2 bg-white p-6 rounded-card border border-mint-light shadow-soft">
              <h4 className="font-serif font-bold text-base text-forest mb-1">
                Calories by Identified Item
              </h4>
              <p className="text-xs text-charcoal-muted mb-4">Energy distribution per serving</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemsBarData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3F6EC" horizontal={false} />
                    <XAxis type="number" stroke="#768B81" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#768B81" fontSize={11} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#14352A',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                    <Bar dataKey="Calories" fill="#1F4D3A" radius={[0, 6, 6, 0]} name="Calories (kcal)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Identified Items Table / Cards */}
          <div className="bg-white rounded-card p-6 border border-mint-light shadow-soft">
            <h4 className="font-serif font-bold text-lg text-forest mb-4">
              Identified Ingredients & Nutrition (AI Estimates)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-mint-light text-charcoal-muted uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Food Item</th>
                    <th className="pb-3">Serving Size</th>
                    <th className="pb-3 text-right">Calories</th>
                    <th className="pb-3 text-right">Protein</th>
                    <th className="pb-3 text-right">Carbs</th>
                    <th className="pb-3 text-right">Fats</th>
                    <th className="pb-3 text-right">Fiber</th>
                    <th className="pb-3 text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mint-light">
                  {result.identified_items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-mint-soft/30 transition">
                      <td className="py-3 pl-2 font-bold text-charcoal">{item.name}</td>
                      <td className="py-3 text-charcoal-muted">{item.serving_size}</td>
                      <td className="py-3 text-right font-semibold text-forest">{Math.round(item.calories)} kcal</td>
                      <td className="py-3 text-right">{item.protein}g</td>
                      <td className="py-3 text-right">{item.carbs}g</td>
                      <td className="py-3 text-right">{item.fats}g</td>
                      <td className="py-3 text-right">{item.fiber}g</td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mint-light text-forest">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Nutritional Insights */}
          {result.insights && result.insights.length > 0 && (
            <div className="bg-mint-soft/60 p-5 rounded-card border border-mint">
              <div className="flex items-center gap-2 mb-2 text-forest font-bold text-sm">
                <Sparkles className="w-4 h-4 text-forest" />
                Dietary & Health Insights
              </div>
              <ul className="space-y-1.5 text-xs text-charcoal-muted list-disc list-inside">
                {result.insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Permanent Disclaimer */}
          <DisclaimerBanner text="Values are AI estimates and may differ from actual content." />
        </div>
      )}
    </div>
  );
};
