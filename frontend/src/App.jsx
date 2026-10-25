import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Toaster } from 'react-hot-toast';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FoodAnalyzer } from './pages/FoodAnalyzer';
import { FreshnessCheck } from './pages/FreshnessCheck';
import { HygieneMonitor } from './pages/HygieneMonitor';
import { CookingAssistant } from './pages/CookingAssistant';
import { MealPlanner } from './pages/MealPlanner';
import { SavedRecipes } from './pages/SavedRecipes';
import { History } from './pages/History';
import { ProfileSettings } from './pages/ProfileSettings';
import { NotFound } from './pages/NotFound';

export const App = () => {
  return (
    <BrowserRouter>
      <SystemProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#14352A',
                color: '#FAF6EC',
                borderRadius: '14px',
                fontSize: '13px',
                border: '1px solid rgba(168, 230, 207, 0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#A8E6CF',
                  secondary: '#14352A',
                },
              },
              error: {
                iconTheme: {
                  primary: '#C8553D',
                  secondary: '#FAF6EC',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes under Main Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/food-analyzer" element={<FoodAnalyzer />} />
              <Route path="/freshness" element={<FreshnessCheck />} />
              <Route path="/hygiene" element={<HygieneMonitor />} />
              <Route path="/assistant" element={<CookingAssistant />} />
              <Route path="/meal-planner" element={<MealPlanner />} />
              <Route path="/recipes" element={<SavedRecipes />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<ProfileSettings />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </SystemProvider>
    </BrowserRouter>
  );
};

export default App;
