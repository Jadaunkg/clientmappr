import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input component with consistent styling
 */
export const Input = React.forwardRef(({
  type = 'text',
  placeholder = '',
  disabled = false,
  error = false,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPasswordType = type === 'password';

  const inputType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className="relative">
      <input
        ref={ref}
        type={inputType}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-all
          placeholder:text-slate-400 text-slate-900
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'}
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-slate-50 disabled:text-slate-500
          ${className}
        `}
        {...props}
      />
      {isPasswordType && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Button component with consistent styling
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-500',
    secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Form Error message component
 */
export function FormError({ error, className = '' }) {
  if (!error) return null;

  return (
    <div className={`text-red-600 text-sm font-medium ${className}`}>
      {error}
    </div>
  );
}

/**
 * Form Label component
 */
export function FormLabel({ htmlFor = '', children, required = false, className = '' }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-slate-900 mb-2 ${className}`}
    >
      {children}
      {required && <span className="text-red-600 ml-1">*</span>}
    </label>
  );
}

/**
 * Password Strength Indicator
 */
export function PasswordStrengthIndicator({ password = '' }) {
  const calculateStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.match(/[a-z]/)) strength++;
    if (pwd.match(/[A-Z]/)) strength++;
    if (pwd.match(/[0-9]/)) strength++;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const strength = calculateStrength(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < strength ? colors[strength] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength <= 2 ? 'text-red-600' : strength === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
        Password strength: {labels[strength]}
      </p>
    </div>
  );
}

/**
 * Checkbox component
 */
export const Checkbox = React.forwardRef(({
  id = '',
  label = '',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex items-center">
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={`
          w-4 h-4 rounded border-slate-300 text-blue-600
          focus:ring-2 focus:ring-blue-500 cursor-pointer
          ${className}
        `}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="ml-2 text-sm text-slate-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

/**
 * Card component for layout
 */
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Alert component
 */
export function Alert({ type = 'error', message, className = '' }) {
  const types = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${types[type]} ${className}`}>
      {message}
    </div>
  );
}
