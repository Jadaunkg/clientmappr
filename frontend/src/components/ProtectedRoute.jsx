import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute component to guard routes that require authentication
 * Redirects unauthenticated users to login page
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child component to render if authenticated
 * @param {Array<string>} props.requiredTier - Optional subscription tiers required
 * @returns {React.ReactNode} Protected component or redirect
 */
export function ProtectedRoute({ children, requiredTier = null }) {
  const { state } = useAuth();
  const location = useLocation();

  // Still loading auth state
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated, redirect to login
  if (!state.isAuthenticated || !state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check subscription tier if required
  if (requiredTier && !requiredTier.includes(state.user.subscriptionTier)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
