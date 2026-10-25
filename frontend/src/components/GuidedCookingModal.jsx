import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const GuidedCookingModal = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const instructions = recipe?.instructions || [];
  const step = instructions[currentStep] || { text: '', timer_seconds: 0 };

  const [timeLeft, setTimeLeft] = useState(step.timer_seconds || 0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(step.timer_seconds || 0);
    setTimerRunning(false);
  }, [currentStep, step.timer_seconds]);

  useEffect(() => {
    let timer = null;
    if (timerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            toast.success(`Timer finished for Step ${currentStep + 1}!`, {
              icon: '⏰',
              duration: 5000,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timeLeft, currentStep]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.success("Dish finished! Bon appétit!", { icon: '🍽️' });
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-card shadow-elevated max-w-xl w-full overflow-hidden border border-mint-light"
      >
        {/* Header */}
        <div className="bg-forest-deep text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-mint text-xs font-semibold uppercase tracking-wider">
              Guided Cooking Mode
            </span>
            <h3 className="font-serif text-lg font-bold truncate max-w-md">
              {recipe.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-cream-dark h-1.5">
          <div
            className="bg-forest h-1.5 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}
          ></div>
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-mint-light text-forest">
              Step {currentStep + 1} of {instructions.length}
            </span>
            {step.timer_seconds > 0 && (
              <span className="text-xs text-charcoal-muted flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-forest" />
                Suggested: {formatTime(step.timer_seconds)}
              </span>
            )}
          </div>

          <p className="text-lg text-charcoal font-medium leading-relaxed min-h-[90px]">
            {step.text}
          </p>

          {/* Interactive Step Timer */}
          {step.timer_seconds > 0 && (
            <div className="my-6 p-4 rounded-xl bg-mint-soft border border-mint flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-mono text-xl font-bold text-forest shadow-sm border border-mint/40">
                  {formatTime(timeLeft)}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted block">
                    Active Step Timer
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    {timerRunning ? 'Timer counting down...' : timeLeft === 0 ? 'Timer complete!' : 'Ready to start'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition shadow-sm ${
                    timerRunning
                      ? 'bg-amber text-charcoal hover:bg-amber/90'
                      : 'bg-forest text-white hover:bg-forest-light'
                  }`}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimeLeft(step.timer_seconds || 0);
                  }}
                  className="p-2 rounded-xl text-charcoal-muted hover:text-charcoal hover:bg-white transition"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-cream/60 border-t border-mint-light flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-charcoal-muted'
                : 'text-charcoal hover:bg-white border border-mint-light'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-forest hover:bg-forest-light text-white flex items-center gap-2 shadow-sm transition"
          >
            {currentStep === instructions.length - 1 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-mint" />
                Finish Cooking
              </>
            ) : (
              <>
                Next Step
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
