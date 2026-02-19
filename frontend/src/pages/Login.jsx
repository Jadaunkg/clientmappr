import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LayoutGrid, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Input, Button, FormError, FormLabel, Checkbox, Card, Alert
} from "../components/FormComponents";

/**
 * Login validation schema
 */
const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

/**
 * Login page component
 */
export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithLinkedIn, state } = useAuth();
  const [showResetForm, setShowResetForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password);
      if (result && result.accessToken) {
        // Redirect to dashboard or previous page
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from);
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already set in state by the login function
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="bg-slate-900 p-2 rounded-lg">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ClientMapr</h1>
          </Link>
          <div className="text-sm text-slate-600 font-medium">
            Don't have an account?
            <Link to="/signup" className="text-slate-900 hover:text-slate-700 ml-2 font-bold">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Log In Section */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Welcome Back
            </h2>
            <p className="text-lg text-slate-600">
              Log in to find underserved businesses
            </p>
          </div>

          {/* Error Message */}
          {state.error && (
            <Alert
              type="error"
              message={state.error}
              className="mb-6"
            />
          )}

          {/* Log In Form Card */}
          <Card className="p-8 mb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div>
                <FormLabel htmlFor="email" required>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </FormLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  error={!!errors.email}
                  {...register('email')}
                />
                <FormError error={errors.email?.message} />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel htmlFor="password" required>
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </FormLabel>
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.password}
                  {...register('password')}
                />
                <FormError error={errors.password?.message} />
              </div>

              {/* Remember Me Checkbox */}
              <div>
                <Checkbox
                  id="rememberMe"
                  label="Remember me for 30 days"
                  {...register('rememberMe')}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting || state.loading}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm"
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Log In
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-sm text-slate-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* OAuth Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={loginWithGoogle}
                className={`
                  flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                  border border-slate-300 text-white bg-slate-900
                  hover:bg-slate-800 active:bg-slate-950 transition-all duration-200 font-semibold text-sm shadow-sm
                `}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={loginWithLinkedIn}
                className={`
                  flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                  border border-slate-300 text-white bg-slate-900
                  hover:bg-slate-800 active:bg-slate-950 transition-all duration-200 font-semibold text-sm shadow-sm
                `}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.731-2.004 1.437-.103.25-.129.599-.129.949v5.419h-3.554s.047-8.733 0-9.652h3.554v1.366c.43-.664 1.199-1.61 2.922-1.61 2.135 0 3.731 1.395 3.731 4.397v5.499z" />
                  <path d="M3.558 5.436c-1.179 0-1.944-.789-1.944-1.779 0-.99.765-1.779 1.985-1.779 1.211 0 1.944.79 1.962 1.779 0 .99-.751 1.779-1.962 1.779z" />
                  <path d="M1.758 20.452h3.554V10.8H1.758v9.652z" />
                </svg>
                LinkedIn
              </button>
            </div>
          </Card>

          {/* Password Reset Form - Hidden by default */}
          {showResetForm && (
            <ResetPasswordForm onClose={() => setShowResetForm(false)} />
          )}

          {/* Info Section */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500 text-center">
              Don't have an account?
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 mx-1 font-semibold">
                Create one for free
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} ClientMapr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Password Reset Form Component
 */
function ResetPasswordForm({ onClose }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSubmitted(true);
      setTimeout(onClose, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 mb-6 border-blue-200 bg-blue-50">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Reset Password</h3>

      {submitted ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-700">
            Password reset email sent to <strong>{email}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Check your inbox for a link to reset your password
          </p>
          <Button variant="secondary" onClick={onClose} className="w-full">
            Back to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormLabel htmlFor="resetEmail" required>
              Email Address
            </FormLabel>
            <Input
              id="resetEmail"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert type="error" message={error} />
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              Send Reset Email
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default Login;
