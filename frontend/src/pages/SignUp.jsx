import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LayoutGrid, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Input, Button, FormError, FormLabel, PasswordStrengthIndicator, Checkbox, Card, Alert
} from "../components/FormComponents";

/**
 * SignUp validation schema
 */
const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * SignUp page component
 */
export function SignUp() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loginWithLinkedIn, state } = useAuth();
  const [signupSuccess, setSignupSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const result = await signup(data.email, data.password, data.fullName);
      if (result && result.accessToken) {
        setSignupSuccess(true);
        reset();

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Signup failed:', error);
      // Error is already set in state by the signup function
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
            Already have an account? 
            <Link to="/login" className="text-slate-900 hover:text-slate-700 ml-2 font-bold">
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Create Account Section */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Create Your Account
            </h2>
            <p className="text-lg text-slate-600">
              Start finding underserved businesses in your area
            </p>
          </div>

          {/* Success Message */}
          {signupSuccess && (
            <Alert
              type="success"
              message="✓ Account created successfully! Redirecting to dashboard..."
              className="mb-6"
            />
          )}

          {/* Error Message */}
          {state.error && (
            <Alert
              type="error"
              message={state.error}
              className="mb-6"
            />
          )}

          {/* Sign Up Form Card */}
          <Card className="p-8 mb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <FormLabel htmlFor="fullName" required>
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </FormLabel>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  error={!!errors.fullName}
                  {...register('fullName')}
                />
                <FormError error={errors.fullName?.message} />
              </div>

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
                <FormLabel htmlFor="password" required>
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </FormLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.password}
                  {...register('password')}
                />
                <PasswordStrengthIndicator password={password} />
                <FormError error={errors.password?.message} className="mt-2" />
              </div>

              {/* Confirm Password Field */}
              <div>
                <FormLabel htmlFor="confirmPassword" required>
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm Password
                </FormLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                <FormError error={errors.confirmPassword?.message} />
              </div>

              {/* Terms Checkbox */}
              <div>
                <Checkbox
                  id="agreeToTerms"
                  label={
                    <span>
                      I agree to the
                      <a href="#terms" className="text-blue-600 hover:text-blue-700 mx-1">
                        Terms of Service
                      </a>
                      and
                      <a href="#privacy" className="text-blue-600 hover:text-blue-700 mx-1">
                        Privacy Policy
                      </a>
                    </span>
                  }
                  {...register('agreeToTerms')}
                />
                <FormError error={errors.agreeToTerms?.message} />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting || state.loading}
                className="w-full mt-6"
              >
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                Create Account
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

          {/* Info Section */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500 text-center">
              By signing up, you agree to our
              <a href="#terms" className="text-blue-600 hover:text-blue-700 mx-1">
                Terms
              </a>
              and
              <a href="#privacy" className="text-blue-600 hover:text-blue-700 mx-1">
                Privacy Policy
              </a>
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

export default SignUp;
