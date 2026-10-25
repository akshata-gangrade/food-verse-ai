import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Salad, Zap, ArrowRight, Lock, Mail } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loginWithDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleDemoLogin = async () => {
    setSubmitting(true);
    const success = await loginWithDemo();
    setSubmitting(false);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-card shadow-elevated border border-mint-light p-8">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center border border-mint/40 shadow-sm">
              <Salad className="w-6 h-6 text-mint" />
            </div>
            <span className="font-serif font-bold text-2xl text-forest">Food Verse AI</span>
          </Link>
          <h2 className="text-xl font-bold text-charcoal">Sign in to your account</h2>
          <p className="text-xs text-charcoal-muted mt-1">
            Access your nutritional analyses, recipes, and meal plans
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-6 p-4 rounded-xl bg-mint-light/60 border border-mint flex flex-col gap-2">
          <div className="flex items-center gap-2 text-forest text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-forest fill-forest" />
            Instant Evaluation
          </div>
          <p className="text-xs text-charcoal-muted">
            Test all features with pre-seeded history and sample data.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-mint fill-mint" />
            1-Click Demo Login (demo@aahaar.ai)
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-mint-light"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-charcoal-muted uppercase tracking-wider font-semibold">
            Or sign in with email
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-mint-light bg-cream/40 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-forest-light text-white text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-charcoal-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-forest hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
