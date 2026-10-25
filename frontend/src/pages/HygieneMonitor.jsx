import React, { useState, useRef } from 'react';
import { hygieneService } from '../api/services';
import { useSystem } from '../context/SystemContext';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Upload,
  Camera,
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'all',
  'surfaces',
  'food storage',
  'cross-contamination risk',
  'PPE and attire',
  'waste handling',
  'equipment',
];

export const HygieneMonitor = () => {
  const { status } = useSystem();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/') && status?.is_demo) {
      toast.error('Video clip analysis is disabled in Demo Mode. Please upload an image or configure a Gemini API key.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20 MB limit.');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setNote('');
    setResult(null);
    setCategoryFilter('all');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedFile) {
      toast.error('Please upload a food prep or kitchen area image.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (note) formData.append('note', note);
    formData.append('save_to_history', 'true');

    try {
      const res = await hygieneService.analyzeHygiene(formData);
      setResult(res.data);
      toast.success('Kitchen hygiene assessment complete!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to inspect kitchen hygiene.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredFindings = result?.findings?.filter((f) => {
    if (categoryFilter === 'all') return true;
    return f.category.toLowerCase().includes(categoryFilter.toLowerCase());
  }) || [];

  const getSeverityBadge = (sev) => {
    switch (sev.toLowerCase()) {
      case 'high':
        return 'bg-terracotta-light text-terracotta border-terracotta/30';
      case 'medium':
        return 'bg-amber-light text-amber-900 border-amber/40';
      default:
        return 'bg-mint-light text-forest border-mint';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 print:p-0">
      {/* Header */}
      <div className="print:hidden">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-forest">
          Restaurant Hygiene Monitoring
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          Evaluate commercial food preparation areas for surface sanitation, food storage, cross-contamination, and attire.
        </p>
      </div>

      {!result ? (
        <div className="bg-white rounded-card p-6 md:p-8 border border-mint-light shadow-soft max-w-2xl print:hidden">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-mint hover:border-forest/50 bg-mint-soft/50 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center group"
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center text-forest mb-4 group-hover:scale-105 transition-transform border border-mint">
              <Upload className="w-8 h-8 text-forest" />
            </div>
            <p className="text-sm font-bold text-charcoal">
              Upload kitchen, prep station, or food storage image
            </p>
            <p className="text-xs text-charcoal-muted mt-1">
              Supports JPEG, PNG, WEBP (Max 8 MB)
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,video/mp4"
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

          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-mint-light hover:bg-mint text-forest text-xs font-semibold flex items-center gap-2 transition border border-mint"
            >
              <Camera className="w-4 h-4" />
              Capture Prep Area
            </button>
          </div>

          {preview && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-2">
                Inspection Image
              </p>
              <div className="relative rounded-2xl overflow-hidden border border-mint shadow-sm max-w-sm mx-auto">
                <img src={preview} alt="Kitchen area" className="w-full h-56 object-cover" />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 bg-charcoal/70 hover:bg-terracotta text-white rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-xs font-bold text-charcoal mb-1.5">
              Kitchen Station Context (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Line cook station, raw protein prep counter"
              className="w-full px-4 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedFile}
              className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition ${
                loading || !selectedFile
                  ? 'bg-mint-light text-forest/50 cursor-not-allowed'
                  : 'bg-forest hover:bg-forest-light text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Auditing Prep Station...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-mint" />
                  Run Hygiene Inspection
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="print:hidden">
            <DemoNoticeBanner source={result.source} />
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-card p-6 border border-mint-light shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest block">
                Audit Report Generated
              </span>
              <h3 className="font-serif text-2xl font-bold text-charcoal mt-1">
                {result.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                Print / Download Report
              </button>
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl border border-mint-light hover:bg-mint-soft text-charcoal text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-forest" />
                New Audit
              </button>
            </div>
          </div>

          {/* Risk Score Gauge & Executive Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Visual Risk Gauge Card */}
            <div className="bg-white p-6 rounded-card border border-mint-light shadow-soft text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block">
                  Visual Risk Score
                </span>
                <div className="my-4 relative inline-flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-8 border-mint-light flex items-center justify-center">
                    <div>
                      <span className="font-serif text-3xl font-bold text-forest">
                        {result.visual_risk_score}
                      </span>
                      <span className="text-[10px] text-charcoal-muted block font-semibold">
                        / 100 Risk Index
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    result.visual_risk_score <= 30
                      ? 'bg-mint-light text-forest'
                      : result.visual_risk_score <= 70
                      ? 'bg-amber-light text-amber-900'
                      : 'bg-terracotta-light text-terracotta'
                  }`}
                >
                  {result.risk_level}
                </span>
                <p className="text-[11px] text-charcoal-muted mt-2">
                  (0-30 Low Risk · 31-70 Moderate · 71-100 High)
                </p>
              </div>
            </div>

            {/* Summary Report Card */}
            <div className="md:col-span-2 bg-white p-6 rounded-card border border-mint-light shadow-soft flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-forest mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-forest" />
                  Executive Inspection Summary
                </h4>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {result.summary_report}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-mint-light grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-charcoal-muted block">Findings Logged</span>
                  <span className="font-bold text-forest text-base">{result.findings?.length || 0}</span>
                </div>
                <div>
                  <span className="text-charcoal-muted block">High Severity</span>
                  <span className="font-bold text-terracotta text-base">
                    {result.findings?.filter((f) => f.severity.toLowerCase() === 'high').length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-muted block">Medium Severity</span>
                  <span className="font-bold text-amber text-base">
                    {result.findings?.filter((f) => f.severity.toLowerCase() === 'medium').length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 print:hidden">
            <span className="text-xs font-bold text-charcoal-muted flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shrink-0 transition ${
                  categoryFilter === cat
                    ? 'bg-forest text-white'
                    : 'bg-white border border-mint-light text-charcoal hover:bg-mint-soft'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Findings List */}
          <div className="bg-white rounded-card p-6 border border-mint-light shadow-soft">
            <h4 className="font-serif font-bold text-lg text-forest mb-4">
              Detailed Findings & Suggested Corrective Actions ({filteredFindings.length})
            </h4>

            {filteredFindings.length === 0 ? (
              <p className="text-xs text-charcoal-muted py-4">No findings in this category.</p>
            ) : (
              <div className="space-y-4">
                {filteredFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-mint-light bg-mint-soft/30 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-forest">
                        Category: {finding.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadge(
                          finding.severity
                        )}`}
                      >
                        {finding.severity} Severity
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider block">
                        Visible Evidence:
                      </span>
                      <p className="text-xs text-charcoal font-medium mt-0.5">
                        {finding.evidence}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-mint-light/60">
                      <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
                        Corrective Action:
                      </span>
                      <p className="text-xs text-charcoal-muted mt-0.5">
                        {finding.corrective_action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permanent Disclaimer */}
          <DisclaimerBanner text="Based on visible conditions in the image. Not an official inspection or certification." />
        </div>
      )}
    </div>
  );
};
