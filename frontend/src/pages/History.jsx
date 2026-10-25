import React, { useState, useEffect } from 'react';
import { historyService } from '../api/services';
import {
  History as HistoryIcon,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  Trash2,
  Eye,
  X,
  Filter,
  Calendar,
  Sparkle
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'all', label: 'All Analyses' },
  { id: 'food', label: 'Food Recognition' },
  { id: 'freshness', label: 'Freshness' },
  { id: 'hygiene', label: 'Hygiene' },
];

export const History = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewItemModal, setViewItemModal] = useState(null);

  useEffect(() => {
    loadHistory(activeTab);
  }, [activeTab]);

  const loadHistory = async (feature) => {
    setLoading(true);
    try {
      const res = await historyService.listHistory(feature === 'all' ? null : feature);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete record "${title}"?`)) return;
    try {
      await historyService.deleteHistoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('History record removed.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete item.');
    }
  };

  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'food':
        return <UtensilsCrossed className="w-4 h-4 text-forest" />;
      case 'freshness':
        return <Sparkles className="w-4 h-4 text-forest" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-forest" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-forest">
          Analysis History
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">
          Review all previous food analyses, freshness checks, and hygiene inspections.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === tab.id
                ? 'bg-forest text-white shadow-sm'
                : 'bg-white border border-mint-light text-charcoal hover:bg-mint-soft'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-card p-12 text-center border border-mint-light shadow-soft max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-mint-light text-forest flex items-center justify-center mx-auto">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-xl text-forest">No records found</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Analyses performed in Food Analyzer, Freshness Check, and Hygiene Monitor will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-mint-light shadow-soft divide-y divide-mint-light overflow-hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-mint-soft/30 transition"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Thumbnail */}
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt="Thumbnail"
                    className="w-14 h-14 rounded-xl object-cover border border-mint-light shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-mint-light text-forest flex items-center justify-center shrink-0">
                    {getFeatureIcon(item.feature)}
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-mint-light text-forest flex items-center gap-1">
                      {getFeatureIcon(item.feature)}
                      {item.feature}
                    </span>
                    {item.source === 'demo_sample' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-light text-amber-900 border border-amber/30">
                        Demo Sample
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-sm text-charcoal truncate">
                    {item.title}
                  </h4>

                  <p className="text-xs text-charcoal-muted truncate">
                    {item.summary || 'Completed analysis'}
                  </p>
                </div>
              </div>

              {/* Date & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-charcoal-muted hidden sm:inline font-medium">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                </span>

                <button
                  onClick={() => setViewItemModal(item)}
                  className="p-2 rounded-xl text-charcoal-muted hover:text-forest hover:bg-mint-light/60 transition"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-2 rounded-xl text-charcoal-muted hover:text-terracotta hover:bg-terracotta-light/40 transition"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {viewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm">
          <div className="bg-white rounded-card shadow-elevated max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 border border-mint-light">
            <div className="flex items-center justify-between pb-4 border-b border-mint-light mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest block">
                  {viewItemModal.feature.toUpperCase()} Analysis Record
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal">
                  {viewItemModal.title}
                </h3>
              </div>
              <button
                onClick={() => setViewItemModal(null)}
                className="p-1 rounded-lg text-charcoal-muted hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewItemModal.thumbnail && (
              <img
                src={viewItemModal.thumbnail}
                alt="Record Thumbnail"
                className="w-full h-48 object-cover rounded-xl border border-mint mb-4"
              />
            )}

            <div className="space-y-3 text-xs text-charcoal">
              <div>
                <strong className="text-charcoal-muted uppercase tracking-wider text-[10px] block">Summary:</strong>
                <p className="mt-1 text-sm font-medium">{viewItemModal.summary}</p>
              </div>

              {viewItemModal.data?.disclaimer && (
                <div className="p-3 rounded-xl bg-amber-light/70 border border-amber/30 text-xs">
                  <strong className="text-amber-900 block font-bold">Notice:</strong>
                  {viewItemModal.data.disclaimer}
                </div>
              )}

              <div className="pt-3 border-t border-mint-light text-[11px] text-charcoal-muted flex justify-between">
                <span>ID: {viewItemModal.id}</span>
                <span>Created: {new Date(viewItemModal.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
