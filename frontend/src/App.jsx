import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

/**
 * Root App component
 * Sets up routing and main layout
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Home route - redirect to login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth routes placeholder */}
          <Route path="/login" element={<div className="p-8"><h1>Login Page (Phase 1)</h1></div>} />
          <Route path="/signup" element={<div className="p-8"><h1>Signup Page (Phase 1)</h1></div>} />

          {/* Dashboard route placeholder */}
          <Route path="/dashboard" element={<div className="p-8"><h1>Dashboard (Phase 1)</h1></div>} />

          {/* 404 handler */}
          <Route path="*" element={<div className="p-8"><h1>Page Not Found</h1></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
