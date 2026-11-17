import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

/**
 * ============================================================================
 * CENTRALIZED DESIGN SYSTEM — IMPECCABLE NORMALIZED THAI UI PRIMITIVES
 * ============================================================================
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'font-sans inline-flex items-center justify-center gap-2 font-semibold leading-normal rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-transparent',
    secondary:
      'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-transparent',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-transparent',
    success:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-transparent',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 border border-transparent',
  };

  /* Touch-target hardened sizes (min-h-[40px] for sm, min-h-[44px] for md, min-h-[48px] for lg) */
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-[40px] px-3.5 py-2 text-xs sm:text-sm',
    md: 'min-h-[44px] px-4 py-2.5 text-sm',
    lg: 'min-h-[48px] px-6 py-3 text-sm sm:text-base',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
          aria-hidden="true"
        />
      ) : (
        icon && <span className="shrink-0" aria-hidden="true">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

export type BadgeVariant = 'blue' | 'emerald' | 'amber' | 'red' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  icon,
  children,
  className = '',
}) => {
  const styles: Record<BadgeVariant, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80',
    emerald:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
    amber:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800/80',
    slate:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={`font-sans inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium leading-normal ${styles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Flat-By-Default Surface (Impeccable Craft Floor: declare elevation once via border)
 */
export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 ${className}`}
  >
    {children}
  </div>
);

interface FormSectionProps {
  stepNumber?: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * FormSection without eyebrow kicker above the heading (Impeccable Craft Floor compliance)
 */
export const FormSection: React.FC<FormSectionProps> = ({
  stepNumber,
  title,
  description,
  icon,
  rightElement,
  children,
}) => (
  <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0 mt-0.5"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {stepNumber ? `ส่วนที่ ${stepNumber}: ${title}` : title}
          </h2>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
    <div className="pt-1">{children}</div>
  </section>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  requiredMark?: boolean;
  optionalText?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  requiredMark = false,
  optionalText,
  error,
  helperText,
  icon,
  id,
  className = '',
  ...props
}) => {
  const reactId = React.useId();
  const generatedId = id || `input-${reactId}`;
  const descriptionId = `${generatedId}-desc`;
  const hasDescription = Boolean(error || helperText);

  return (
    <div className="min-w-0">
      <label
        htmlFor={generatedId}
        className="font-sans block text-xs sm:text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200 mb-1.5"
      >
        {label}{' '}
        {requiredMark && (
          <span className="text-red-500 font-bold" aria-hidden="true">
            *
          </span>
        )}
        {optionalText && (
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
            ({optionalText})
          </span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <div
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <input
          id={generatedId}
          required={requiredMark}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          className={`font-sans w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-base sm:text-sm leading-normal transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
          } ${props.readOnly ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p
          id={descriptionId}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p id={descriptionId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

interface CheckboxCardProps {
  checked: boolean;
  onChange: () => void;
  title: string;
  subtitle?: string;
}

export const CheckboxCard: React.FC<CheckboxCardProps> = ({
  checked,
  onChange,
  title,
  subtitle,
}) => (
  <label
    className={`group flex items-start gap-3 p-3.5 min-h-[52px] rounded-xl border cursor-pointer select-none transition-colors duration-150 focus-within:ring-2 focus-within:ring-blue-500/40 ${
      checked
        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 text-slate-900 dark:text-white'
        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div
      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
        checked
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
      }`}
      aria-hidden="true"
    >
      {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
    </div>
    <div className="flex-1 min-w-0 font-sans">
      <div className="text-sm font-semibold leading-relaxed">{title}</div>
      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
          {subtitle}
        </div>
      )}
    </div>
  </label>
);
