import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import LeadSearchPage from './pages/LeadSearchPage';
import MyLeadsPage from './pages/MyLeadsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

/**
 * Main App component with routing
 * Provides authentication context and routes all pages
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<LeadSearchPage />} />
            <Route path="/leads" element={<MyLeadsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
                  <p className="text-slate-600 mb-4">Page not found</p>
                  <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                    Go back home
                  </a>
                </div>
              </div>
            }
          />
          </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
