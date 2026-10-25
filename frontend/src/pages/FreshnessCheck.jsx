import React, { useState, useRef } from 'react';
import { freshnessService } from '../api/services';
import { useSystem } from '../context/SystemContext';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Upload,
  Camera,
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Archive,
  Video,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FreshnessCheck = () => {
  const { status } = useSystem();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    if (isVid && status?.is_demo) {
      toast.error('Video clip analysis is disabled in Demo Mode. Please upload an image or enable Live Gemini Mode.', { duration: 4000 });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20 MB limit.');
      return;
    }

    setSelectedFile(file);
    setIsVideo(isVid);
    setPreview(URL.createObjectURL(file));
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setIsVideo(false);
    setNote('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedFile) {
      toast.error('Please upload an image of produce or food.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (note) formData.append('note', note);
    formData.append('save_to_history', 'true');

    try {
      const res = await freshnessService.analyzeFreshness(formData);
      setResult(res.data);
      toast.success('Freshness visual assessment complete!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to assess freshness.');
    } finally {
      setLoading(false);
    }
  };

  // Status Pill Styling
  const getIndicatorBadge = (indicator) => {
    switch (indicator) {
      case 'Looks fresh':
        return {
          bg: 'bg-mint-light text-forest border-mint',
          icon: CheckCircle,
          label: 'Looks Fresh',
        };
      case 'Some signs of aging':
        return {
          bg: 'bg-amber-light text-amber-900 border-amber/40',
          icon: AlertTriangle,
          label: 'Some Signs of Aging',
        };
      case 'Multiple warning signs':
        return {
          bg: 'bg-terracotta-light text-terracotta border-terracotta/40',
          icon: ShieldAlert,
          label: 'Multiple Warning Signs',
        };
      default:
        return {
          bg: 'bg-cream-dark text-charcoal border-charcoal/20',
          icon: Info,
          label: indicator || 'Unclear from Image',
        };
    }
  };

  const indicatorData = result ? getIndicatorBadge(result.visual_indicator) : null;
  const IndicatorIcon = indicatorData?.icon || Info;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-forest">
          Food Freshness Detection
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          Evaluate visible surface signs of aging, bruising, and wilting with prudent storage guidance.
        </p>
      </div>

      {!result ? (
        <div className="bg-white rounded-card p-6 md:p-8 border border-mint-light shadow-soft max-w-2xl">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-mint hover:border-forest/50 bg-mint-soft/50 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center group"
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center text-forest mb-4 group-hover:scale-105 transition-transform border border-mint">
              <Upload className="w-8 h-8 text-forest" />
            </div>
            <p className="text-sm font-bold text-charcoal">
              Click to upload produce photo or drop file here
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
              Capture with Camera
            </button>
            {status?.is_demo && (
              <span className="text-[11px] text-charcoal-muted italic">
                (Video analysis disabled in Demo mode)
              </span>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-2">
                Item to Inspect
              </p>
              <div className="relative rounded-2xl overflow-hidden border border-mint shadow-sm max-w-sm mx-auto">
                {isVideo ? (
                  <video src={preview} controls className="w-full h-56 object-cover" />
                ) : (
                  <img src={preview} alt="Produce to evaluate" className="w-full h-56 object-cover" />
                )}
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

          {/* Note Input */}
          <div className="mt-6">
            <label className="block text-xs font-bold text-charcoal mb-1.5">
              Produce Name or Storage Context (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Gala apples kept in pantry for 5 days"
              className="w-full px-4 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
            />
          </div>

          {/* Submit */}
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
                  Assessing Visual Freshness...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-mint" />
                  Evaluate Freshness
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <DemoNoticeBanner source={result.source} />

          {/* Main Indicator Card */}
          <div className="bg-white rounded-card p-6 md:p-8 border border-mint-light shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-mint-light pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest block">
                  Visual Assessment
                </span>
                <h3 className="font-serif text-2xl font-bold text-charcoal mt-1">
                  {result.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold shadow-sm ${indicatorData.bg}`}
                >
                  <IndicatorIcon className="w-4 h-4" />
                  <span>{indicatorData.label}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl border border-mint-light hover:bg-mint-soft text-charcoal text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-forest" />
                  Check Another
                </button>
              </div>
            </div>

            {/* Confidence & Estimated Shelf Life */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-xl bg-cream/70 border border-mint-light">
                <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
                  Assessment Confidence
                </span>
                <p className="font-serif text-xl font-bold text-forest mt-1">
                  {Math.round(result.confidence * 100)}%
                </p>
                <div className="w-full bg-cream-dark h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-forest h-2 rounded-full"
                    style={{ width: `${result.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cream/70 border border-mint-light">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-forest" />
                  Estimated Shelf Life
                </div>
                <p className="text-sm font-bold text-charcoal mt-1">
                  {result.estimated_shelf_life || 'Consume promptly'}
                </p>
                <p className="text-[11px] text-charcoal-muted mt-1">
                  Under recommended storage conditions
                </p>
              </div>
            </div>

            {/* Observations List */}
            <div className="mb-6">
              <h4 className="font-serif font-bold text-base text-forest mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-forest" />
                Visual Surface Observations
              </h4>
              <ul className="space-y-2">
                {result.observations?.map((obs, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-xl bg-mint-soft/50 border border-mint/40 text-xs text-charcoal flex items-start gap-2.5 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-forest shrink-0 mt-1.5"></span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Storage Recommendations */}
            <div>
              <h4 className="font-serif font-bold text-base text-forest mb-3 flex items-center gap-2">
                <Archive className="w-4 h-4 text-forest" />
                Cautious Storage Recommendations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.storage_recommendations?.map((tip, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-mint-light bg-white text-xs text-charcoal-muted leading-relaxed"
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permanent Disclaimer */}
          <DisclaimerBanner
            text="Visual assessment only. It cannot detect bacteria, toxins, or contamination and cannot guarantee food safety."
            type="warning"
          />
        </div>
      )}
    </div>
  );
};
