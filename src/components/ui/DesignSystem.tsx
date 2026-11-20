import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Calendar, Check, CheckCircle2, ChevronDown, Clock, Info, User, X } from 'lucide-react';

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
  isSuccess?: boolean;
  successText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  isSuccess = false,
  successText = 'บันทึกสำเร็จ',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'font-sans inline-flex items-center justify-center gap-2 font-semibold leading-normal rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-transparent shadow-sm',
    secondary:
      'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-transparent',
    outline:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-transparent shadow-sm',
    success:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-transparent shadow-sm',
    ghost:
      'bg-transparent hover:bg-slate-100 active:bg-slate-200/70 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 border border-transparent',
  };

  /* Touch-target hardened sizes (min-h-[40px] for sm, min-h-[44px] for md, min-h-[48px] for lg) */
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-[40px] px-3.5 py-2 text-xs sm:text-sm',
    md: 'min-h-[44px] px-4 py-2.5 text-sm',
    lg: 'min-h-[48px] px-6 py-3 text-sm sm:text-base',
  };

  const activeStyles = isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-600 active:bg-emerald-700 text-white border-transparent shadow-sm'
    : variantStyles[variant];

  return (
    <button
      disabled={disabled || isLoading || isSuccess}
      className={`${baseStyles} ${activeStyles} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
          aria-hidden="true"
        />
      ) : isSuccess ? (
        <span className="shrink-0 inline-flex items-center text-white" aria-hidden="true">
          <Check className="w-4 h-4 stroke-[3] animate-scaleCheck" />
        </span>
      ) : (
        icon && (
          <span className="shrink-0 inline-flex items-center" aria-hidden="true">
            {icon}
          </span>
        )
      )}
      <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
        {isSuccess ? successText : children}
      </span>
    </button>
  );
};

/**
 * Animated Running Dots Indicator (3 sequential bouncing wave dots)
 * Accessible: aria-hidden=true (decorative) while aligning cleanly with Thai typography
 */
export interface RunningDotsProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const RunningDots: React.FC<RunningDotsProps> = ({
  className = '',
  size = 'sm',
}) => {
  const dotSize =
    size === 'xs'
      ? 'w-1 h-1'
      : size === 'sm'
      ? 'w-1.5 h-1.5'
      : size === 'lg'
      ? 'w-2.5 h-2.5'
      : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center gap-1 align-middle ml-1 select-none ${className}`}
      aria-hidden="true"
    >
      <span className={`${dotSize} rounded-full bg-current animate-runningDot1`} />
      <span className={`${dotSize} rounded-full bg-current animate-runningDot2`} />
      <span className={`${dotSize} rounded-full bg-current animate-runningDot3`} />
    </span>
  );
};

export type IconButtonVariant = 'neutral' | 'primary' | 'emerald' | 'danger';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: IconButtonVariant;
  icon: React.ReactNode;
}

/**
 * Accessible Icon-Only Button with guaranteed 40x40px+ touch target & focus-visible ring
 */
export const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = 'neutral',
  icon,
  className = '',
  ...props
}) => {
  const variantStyles: Record<IconButtonVariant, string> = {
    neutral:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800',
    primary:
      'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60',
    emerald:
      'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60',
    danger:
      'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60',
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`min-w-[40px] min-h-[40px] p-2 inline-flex items-center justify-center rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-600 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
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
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
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
    className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] ${className}`}
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
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3.5">
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0 mt-0.5"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {stepNumber ? `ส่วนที่ ${stepNumber}: ${title}` : title}
          </h2>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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
      {Boolean(label) && (
        <label
          htmlFor={generatedId}
          className="font-sans flex items-center gap-1 min-h-[24px] text-xs sm:text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200 mb-1.5"
        >
          <span className="truncate" title={label}>{label}</span>
          {requiredMark && (
            <span className="text-red-500 font-bold shrink-0" aria-hidden="true">
              *
            </span>
          )}
          {optionalText && (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 shrink-0">
              ({optionalText})
            </span>
          )}
        </label>
      )}
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
          className={`font-sans w-full h-[44px] rounded-xl border px-3.5 py-2.5 text-base sm:text-sm leading-normal transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
          } ${
            props.readOnly
              ? 'bg-slate-100/90 dark:bg-slate-800/80 cursor-default select-all'
              : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p
          id={descriptionId}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
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

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: 'blue' | 'purple' | 'amber' | 'emerald' | 'slate';
  group?: string;
  icon?: React.ReactNode;
}

export interface SelectFieldProps {
  label: string;
  name?: string;
  requiredMark?: boolean;
  optionalText?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  options: (SelectOption | { value: string; label: string })[];
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Custom Dropdown List Primitive — Designed with Unslop, Impeccable, Emil Kowalski Design Engineering & Accessibility
 * Replaces ugly native OS dropdown popups with a modern, responsive, keyboard-navigable and theme-aware component.
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  requiredMark = false,
  optionalText,
  error,
  helperText,
  placeholder = '-- กรุณาเลือก --',
  value = '',
  onChange,
  options,
  disabled = false,
  id,
  className = '',
}) => {
  const reactId = React.useId();
  const generatedId = id || `select-${reactId}`;
  const listboxId = `${generatedId}-listbox`;
  const descriptionId = `${generatedId}-desc`;
  const hasDescription = Boolean(error || helperText);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (onChange) {
      onChange({ target: { value: val, name } });
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % normalizedOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(normalizedOptions.length - 1);
      } else {
        setHighlightedIndex(
          (prev) => (prev - 1 + normalizedOptions.length) % normalizedOptions.length
        );
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        handleSelect(normalizedOptions[highlightedIndex].value);
      } else {
        setIsOpen((prev) => !prev);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const getBadgeClasses = (color?: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'amber':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'blue':
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const getInitials = (text: string) => {
    if (!text) return '';
    const trimmed = text.trim();
    return trimmed.charAt(0);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      {Boolean(label) && (
        <label
          htmlFor={generatedId}
          className="font-sans flex items-center gap-1 min-h-[24px] text-xs sm:text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200 mb-1.5"
        >
          <span className="truncate" title={label}>{label}</span>
          {requiredMark && (
            <span className="text-red-500 font-bold shrink-0" aria-hidden="true">
              *
            </span>
          )}
          {optionalText && (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 shrink-0">
              ({optionalText})
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <div className="relative">
        <button
          type="button"
          id={generatedId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          className={`w-full h-[44px] rounded-xl border px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 ${
            isOpen
              ? 'ring-2 ring-blue-500/20 border-blue-600 dark:border-blue-500'
              : error
              ? 'border-red-500 focus-visible:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:ring-blue-500/20 focus-visible:border-blue-600 dark:focus-visible:border-blue-500'
          } ${
            disabled
              ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
              : 'cursor-pointer active:scale-[0.995]'
          } ${className}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedOption && selectedOption.value ? (
              <>
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 border ${getBadgeClasses(
                    selectedOption.badgeColor
                  )}`}
                  aria-hidden="true"
                >
                  {getInitials(selectedOption.label)}
                </div>
                <span
                  className="text-sm font-semibold truncate text-slate-900 dark:text-white"
                  title={selectedOption.label}
                >
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span
                    className={`hidden xl:inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${getBadgeClasses(
                      selectedOption.badgeColor
                    )}`}
                  >
                    {selectedOption.badge}
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 min-w-0">
                <User className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="text-sm truncate">{placeholder}</span>
              </div>
            )}
          </div>

          <div
            className={`shrink-0 transition-transform duration-200 text-slate-400 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
            aria-hidden="true"
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {/* Hidden Input for Form Submission Compatibility */}
        <input type="hidden" name={name} value={value} />

        {/* Custom Dropdown Popover */}
        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 sm:left-auto sm:right-0 w-full sm:min-w-[320px] max-w-[420px] top-full mt-1.5 z-50 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-950/20 dark:shadow-slate-950/50 p-1.5 space-y-0.5 max-h-72 overflow-y-auto animate-scaleIn origin-top"
          >
            {normalizedOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;
              const prevOpt = idx > 0 ? normalizedOptions[idx - 1] : null;
              const showGroupHeader =
                opt.group && (!prevOpt || prevOpt.group !== opt.group);

              return (
                <React.Fragment key={opt.value || `opt-${idx}`}>
                  {showGroupHeader && (
                    <div className="px-3 pt-2.5 pb-1 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/80 first:border-t-0 first:pt-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span>{opt.group}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-colors min-h-[44px] ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {opt.value ? (
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${getBadgeClasses(
                            opt.badgeColor
                          )}`}
                          aria-hidden="true"
                        >
                          {getInitials(opt.label)}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm truncate leading-snug">
                          {opt.label}
                        </div>
                        {opt.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeClasses(
                            opt.badgeColor
                          )}`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check
                          className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p
          id={descriptionId}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
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

interface TimeField24Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label: string;
  value: string; // "HH:mm" (24 ชม.)
  onChange: (val: string) => void;
  requiredMark?: boolean;
  optionalText?: string;
  error?: string;
  helperText?: string;
  onSetCurrentTime?: () => void;
}

/**
 * ช่องเวลาแบบ 24 ชั่วโมง (HH:mm) — ไม่มี AM/PM ไม่ขึ้นกับการตั้งค่าภาษาของเครื่อง
 * ค่าเริ่มต้นถูกเติมให้อัตโนมัติจากฟอร์ม พร้อมปุ่มลัด "ตอนนี้" (Now) เมื่อต้องการอัปเดตเวลาปัจจุบัน
 */
const ITEM_HEIGHT = 44; // 44px standard touch target

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({ items, selectedIndex, onSelect, ariaLabel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ตั้งตำแหน่ง Scroll เริ่มต้นให้ตรงกับค่าที่เลือกทันทีเมื่อคอมโพเนนต์ Mount
  // ล็อกไม่ให้ trigger event ในช่วง 80ms แรก เพื่อป้องกัน Bug แฉลบไป 01:01
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
      containerRef.current.scrollLeft = 0;
    }
    const timer = setTimeout(() => {
      isReadyRef.current = true;
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  // เมื่อค่า selectedIndex เปลี่ยนจากภายนอก (เช่น กดปุ่มลัดเวลา "12:00" หรือ "ตอนนี้") ให้เลื่อนไปยังตำแหน่งนั้น
  useEffect(() => {
    if (!containerRef.current || !isReadyRef.current) return;
    const targetTop = selectedIndex * ITEM_HEIGHT;
    if (Math.abs(containerRef.current.scrollTop - targetTop) > ITEM_HEIGHT / 2) {
      isProgrammaticScrollRef.current = true;
      containerRef.current.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
      if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
      programmaticTimerRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 350);
    }
  }, [selectedIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // ล็อกไม่ให้เลื่อนซ้าย-ขวาเด็ดขาด (Strict horizontal scroll lock)
    if (e.currentTarget.scrollLeft !== 0) {
      e.currentTarget.scrollLeft = 0;
    }

    // หากระบบกำลังเลื่อนอัตโนมัติจากปุ่มลัด หรือยังไม่พร้อมหลังเปิด Modal ให้ข้าม
    if (isProgrammaticScrollRef.current || !isReadyRef.current) return;

    const top = e.currentTarget.scrollTop;
    const nextIdx = Math.round(top / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, nextIdx));
    if (clamped !== selectedIndex) {
      onSelect(clamped);
    }
  };

  const handleTouch = () => {
    if (containerRef.current && containerRef.current.scrollLeft !== 0) {
      containerRef.current.scrollLeft = 0;
    }
  };

  return (
    <div className="relative flex-1 min-w-0 h-full flex flex-col items-center overflow-hidden">
      {/* กระบอกหมุน (Drum wheel) รองรับ swipe / touch / mouse wheel เฉพาะแกน Y (บน-ล่าง) ห้ามเลื่อนซ้าย-ขวา */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        tabIndex={0}
        aria-label={ariaLabel}
        className="w-full h-[220px] overflow-y-auto overflow-x-hidden snap-y snap-mandatory select-none py-[88px] touch-pan-y focus:outline-none overscroll-x-contain"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          touchAction: 'pan-y',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const dist = Math.abs(idx - selectedIndex);
          return (
            <div
              key={item}
              onClick={() => {
                onSelect(idx);
                if (containerRef.current) {
                  isProgrammaticScrollRef.current = true;
                  containerRef.current.scrollTo({
                    top: idx * ITEM_HEIGHT,
                    behavior: 'smooth',
                  });
                  if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
                  programmaticTimerRef.current = setTimeout(() => {
                    isProgrammaticScrollRef.current = false;
                  }, 350);
                }
              }}
              style={{ height: `${ITEM_HEIGHT}px` }}
              className={`w-full max-w-full snap-center flex items-center justify-center font-mono cursor-pointer transition-transform duration-150 relative z-20 select-none ${
                isSelected
                  ? 'text-2xl font-black text-slate-900 dark:text-white scale-110 tracking-widest'
                  : dist === 1
                  ? 'text-base font-semibold text-slate-400 dark:text-slate-500 scale-95'
                  : 'text-xs font-medium text-slate-300 dark:text-slate-600 scale-85 opacity-40'
              }`}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface AlarmClockWheelPickerModalProps {
  isOpen: boolean;
  value: string; // "HH:mm"
  label?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const AlarmClockWheelPickerModal: React.FC<AlarmClockWheelPickerModalProps> = ({
  isOpen,
  value,
  label = 'ตั้งเวลา',
  onConfirm,
  onCancel,
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(() => {
    const [h] = (value || '09:00').split(':');
    return Math.max(0, Math.min(23, Number(h) || 9));
  });

  const [selectedMinute, setSelectedMinute] = useState<number>(() => {
    const [, m] = (value || '09:00').split(':');
    return Math.max(0, Math.min(59, Number(m) || 0));
  });

  // ซิงก์ค่าเวลาเริ่มต้นให้ตรงกับช่องเสมอเมื่อเปิด Modal ขึ้นมา
  useEffect(() => {
    if (isOpen) {
      const [h, m] = (value || '09:00').split(':');
      setSelectedHour(Math.max(0, Math.min(23, Number(h) || 9)));
      setSelectedMinute(Math.max(0, Math.min(59, Number(m) || 0)));
    }
  }, [isOpen, value]);

  // ล็อกการเลื่อนหน้าพื้นหลังขณะเปิดหน้าต่าง
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const currentFormatted = `${HOURS[selectedHour]}:${MINUTES[selectedMinute]}`;

  const handleSetQuickPreset = (hhmm: string) => {
    const [h, m] = hhmm.split(':');
    setSelectedHour(Math.max(0, Math.min(23, Number(h) || 0)));
    setSelectedMinute(Math.max(0, Math.min(59, Number(m) || 0)));
  };

  const handleSetNow = () => {
    const now = new Date();
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`หมุนตั้งเวลา: ${label}`}
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-toastSlideIn flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* แถบหัวข้อหน้าต่างแบบ Minimal (Quiet Chrome ตามหลัก Unslopped UI) */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {label}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                เลื่อนหมุนขึ้น–ลงเพื่อปรับเวลา (ระบบ 24 ชม.)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* แถบแสดงเวลาที่เลือกขนาดใหญ่แบบ Precision Time Display */}
        <div className="pt-4 pb-2 px-6 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-1.5 font-mono text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
            <span>{currentFormatted}</span>
            <span className="text-xs font-sans font-semibold text-slate-400 dark:text-slate-500">
              น.
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            เวลาที่กำลังเลือก
          </span>
        </div>

        {/* หัวบอกคอลัมน์ ชั่วโมง และ นาที (อยู่นอกกระบอกหมุน เพื่อความคมชัดและไม่เบียดให้ตำแหน่งเลื่อนผิด) */}
        <div className="px-7 pt-1 pb-1 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
          <div className="flex-1 text-center">ชั่วโมง (00 – 23)</div>
          <div className="w-6 shrink-0" />
          <div className="flex-1 text-center">นาที (00 – 59)</div>
        </div>

        {/* ห้องกระบอกหมุนทรงกระบอกคู่ (Unified Cylinder Drum Chamber สไตล์ iOS Alarm Clock) */}
        <div className="px-5 py-1">
          <div className="relative overflow-hidden rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 h-[220px]">
            {/* แถบเลนส์กระจกไฮไลต์แถวกลางแบบชิ้นเดียว อยู่ตรงกลางกึ่งกลางพอดีเป๊ะ (Centered Selection Lens) */}
            <div
              aria-hidden="true"
              className="absolute left-2 right-2 top-[88px] h-[44px] rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200/90 dark:border-slate-600/80 pointer-events-none z-0"
            />

            {/* เงาไล่ระดับบน-ล่างให้ความลึกเสมือนกระบอกหมุนจริง */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[76px] bg-gradient-to-b from-slate-100 via-slate-100/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-t from-slate-100 via-slate-100/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 to-transparent z-10"
            />

            {/* 2 คอลัมน์ ชั่วโมง และ นาที + เครื่องหมาย : อยู่กึ่งกลางความสูงพอดี */}
            <div className="flex items-center justify-center gap-2 h-full relative z-20 w-full overflow-hidden">
              <WheelColumn
                items={HOURS}
                selectedIndex={selectedHour}
                onSelect={setSelectedHour}
                ariaLabel="เลือกชั่วโมง"
              />

              <div className="font-mono text-2xl font-bold text-slate-400 dark:text-slate-500 select-none z-20 shrink-0" aria-hidden="true">
                :
              </div>

              <WheelColumn
                items={MINUTES}
                selectedIndex={selectedMinute}
                onSelect={setSelectedMinute}
                ariaLabel="เลือกนาที"
              />
            </div>
          </div>
        </div>

        {/* ปุ่มลัดเวลากดยอดนิยม (Quick Presets) */}
        <div className="px-5 py-2.5 bg-slate-50/60 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            เวลาลัด:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {['08:30', '09:00', '12:00', '13:00', '16:00', '17:00'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSetQuickPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                  currentFormatted === preset
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSetNow}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition inline-flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>ตอนนี้</span>
            </button>
          </div>
        </div>

        {/* ปุ่มกดยืนยันหรือยกเลิก */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-white dark:bg-slate-900">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<Check className="w-4 h-4 stroke-[3]" />}
            onClick={() => {
              onConfirm(currentFormatted);
              onCancel();
            }}
          >
            เลือกเวลานี้ ({currentFormatted} น.)
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * ช่องเวลาแบบ 24 ชั่วโมง (HH:mm) พร้อมระบบหมุนเลื่อนเหมือนนาฬิกาปลุก (Alarm Clock Wheel Picker)
 * ค่าเริ่มต้น 09:00 พร้อมปุ่มลัด "ตอนนี้" (Now)
 */
export const TimeField24: React.FC<TimeField24Props> = ({
  value,
  onChange,
  onBlur,
  onSetCurrentTime,
  label,
  requiredMark,
  optionalText,
  error,
  helperText,
  className = '',
  ...rest
}) => {
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const reactId = useId();
  const generatedId = rest.id || `timefield-${reactId}`;
  const descriptionId = `${generatedId}-desc`;
  const hasDescription = Boolean(error || helperText);
  const displayValue = value || '09:00';

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between min-h-[24px] mb-1.5">
        <label
          htmlFor={generatedId}
          className="font-sans flex items-center gap-1 text-xs sm:text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200"
        >
          <span className="truncate" title={label}>{label}</span>
          {requiredMark && (
            <span className="text-red-500 font-bold shrink-0" aria-hidden="true">
              *
            </span>
          )}
          {optionalText && (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 shrink-0">
              ({optionalText})
            </span>
          )}
        </label>
        {onSetCurrentTime && (
          <button
            type="button"
            onClick={onSetCurrentTime}
            title="รีเซ็ตเป็นเวลาปัจจุบัน (Now)"
            aria-label="ตั้งเวลาเป็นเวลาปัจจุบัน"
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 rounded px-1 shrink-0"
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>ตอนนี้</span>
          </button>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          id={generatedId}
          onClick={() => setIsWheelOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isWheelOpen}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          className={`font-sans w-full h-[44px] min-h-[44px] max-h-[44px] rounded-xl border px-3.5 py-2 text-base sm:text-sm leading-normal text-left transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
          } ${className}`}
        >
          <span className="tabular-nums font-mono text-base sm:text-sm text-slate-900 dark:text-white">
            {displayValue}
          </span>
          <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none" aria-hidden="true" />
        </button>

        <input
          type="hidden"
          value={displayValue}
          name={rest.name}
        />
      </div>

      {error && (
        <p
          id={descriptionId}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
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

      {/* หน้าต่างเลือกเวลาแบบวงล้อลูกกลิ้งเลื่อนเหมือนนาฬิกาปลุก (Alarm Clock Roller Wheel Picker) */}
      <AlarmClockWheelPickerModal
        isOpen={isWheelOpen}
        value={displayValue}
        label={label}
        onConfirm={(val) => {
          onChange(val);
        }}
        onCancel={() => setIsWheelOpen(false)}
      />
    </div>
  );
};

export interface DateFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label: string;
  value: string; // "YYYY-MM-DD"
  onChange: (val: string) => void;
  requiredMark?: boolean;
  optionalText?: string;
  error?: string;
  helperText?: string;
  onSetCurrentDate?: () => void;
}

/**
 * ช่องวันที่มาตรฐาน (YYYY-MM-DD) — รองรับการแสดงผลบน iOS Safari, Android และ Desktop
 * พร้อมปุ่มลัด "วันนี้" (Today) และแก้ปัญหาตัวหนังสืออยู่ตรงกลาง/ความสูงล้นบน iPhone
 */
export const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  onSetCurrentDate,
  label,
  requiredMark,
  optionalText,
  error,
  helperText,
  className = '',
  ...rest
}) => {
  const reactId = React.useId();
  const generatedId = rest.id || `datefield-${reactId}`;
  const descriptionId = `${generatedId}-desc`;
  const hasDescription = Boolean(error || helperText);

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between min-h-[24px] mb-1.5">
        <label
          htmlFor={generatedId}
          className="font-sans flex items-center gap-1 text-xs sm:text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200"
        >
          <span className="truncate" title={label}>{label}</span>
          {requiredMark && (
            <span className="text-red-500 font-bold shrink-0" aria-hidden="true">
              *
            </span>
          )}
          {optionalText && (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 shrink-0">
              ({optionalText})
            </span>
          )}
        </label>
        {onSetCurrentDate && (
          <button
            type="button"
            onClick={onSetCurrentDate}
            title="รีเซ็ตเป็นวันที่ปัจจุบัน (Today)"
            aria-label="ตั้งวันที่เป็นวันที่ปัจจุบัน"
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 rounded px-1 shrink-0"
          >
            <Calendar className="w-3 h-3" aria-hidden="true" />
            <span>วันนี้</span>
          </button>
        )}
      </div>

      <div className="relative">
        <input
          {...rest}
          id={generatedId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={requiredMark}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          className={`font-sans w-full h-[44px] min-h-[44px] max-h-[44px] rounded-xl border px-3.5 py-2 text-base sm:text-sm leading-normal text-left transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
          } ${className}`}
        />
      </div>

      {error && (
        <p
          id={descriptionId}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  requiredMark?: boolean;
  optionalText?: string;
  error?: string;
  helperText?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  requiredMark = false,
  optionalText,
  error,
  helperText,
  id,
  rows = 3,
  className = '',
  ...props
}) => {
  const reactId = React.useId();
  const generatedId = id || `textarea-${reactId}`;
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
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
            ({optionalText})
          </span>
        )}
      </label>
      <textarea
        id={generatedId}
        rows={rows}
        required={requiredMark}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        className={`font-sans w-full rounded-xl border px-3.5 py-2.5 text-base sm:text-sm leading-relaxed transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
        } ${className}`}
        {...props}
      />
      {error && (
        <p
          id={descriptionId}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
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
    className={`group flex items-start gap-3 p-3.5 min-h-[54px] rounded-xl border cursor-pointer select-none transition-colors duration-150 focus-within:ring-2 focus-within:ring-blue-500/40 ${
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

export type DrawerPosition = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  position?: DrawerPosition;
  size?: DrawerSize;
  footer?: React.ReactNode;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
}

/**
 * Accessible, Smoothly Animated Slide-Over Drawer Component
 * Renders via Portal into document.body with focus management, Escape-to-close,
 * click-outside backdrop dismissal, and prefers-reduced-motion support.
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  position = 'right',
  size = 'md',
  footer,
  children,
  closeOnBackdropClick = true,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setShouldRender(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (
          previousFocusRef.current &&
          document.body.contains(previousFocusRef.current) &&
          typeof previousFocusRef.current.focus === 'function'
        ) {
          previousFocusRef.current.focus();
        }
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the close button or first interactive element once when the drawer opens
    const focusTimer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
        return;
      }
      if (!panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        panelRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  const sizeClasses: Record<DrawerSize, string> = {
    sm: 'w-[88vw] max-w-[360px]',
    md: 'w-[90vw] sm:w-full max-w-[440px]',
    lg: 'w-[94vw] sm:w-full max-w-[560px]',
    xl: 'w-[96vw] sm:w-full max-w-[680px]',
  };

  const positionClasses =
    position === 'left'
      ? 'left-0 border-r border-slate-200 dark:border-slate-800'
      : 'right-0 border-l border-slate-200 dark:border-slate-800';

  const translateClasses = isVisible
    ? 'translate-x-0'
    : position === 'left'
    ? '-translate-x-full'
    : 'translate-x-full';

  return createPortal(
    <div
      className="fixed inset-0 z-[95] overflow-hidden no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
    >
      {/* Semi-transparent Backdrop with click-outside-to-close */}
      <div
        aria-hidden="true"
        onClick={() => {
          if (closeOnBackdropClick) {
            onClose();
          }
        }}
        className={`fixed inset-0 bg-slate-950/55 backdrop-blur-[2px] transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`fixed inset-y-0 ${positionClasses} w-full ${sizeClasses[size]} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.2)] flex flex-col justify-between outline-none transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${translateClasses}`}
      >
        {/* Sticky Drawer Header */}
        <header className="px-5 sm:px-6 py-4 sm:py-5 bg-slate-50/90 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3.5 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            {icon && (
              <div
                className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id={titleId}
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug"
                >
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p
                  id={subtitleId}
                  className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed"
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            title="ปิดแถบหน้าต่างด้านข้าง (Esc)"
            aria-label="ปิดแถบหน้าต่างด้านข้าง (Esc)"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2.5 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-6 py-5 space-y-5">
          {children}
        </div>

        {/* Optional Sticky Drawer Footer */}
        {footer && (
          <footer className="px-5 sm:px-6 py-4 bg-slate-50/90 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
};

/**
 * ============================================================================
 * TOAST NOTIFICATION SYSTEM (Emil Kowalski Design Engineering & Impeccable)
 * ระบบแจ้งเตือนลอยตัวที่ตอบสนองทันที (Instant Tactile & Visual Feedback)
 * รองรับ Action Button (เช่น สั่งพิมพ์ A4 ทันที), Dark Mode, และ Accessible Screen Readers
 * ============================================================================
 */

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener([...this.toasts]);
    }
  }

  show(options: {
    type?: 'success' | 'error' | 'info';
    title?: string;
    message: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
  }) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toastItem: ToastItem = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 4500,
      action: options.action,
    };

    // แสดงสูงสุด 3 รายการล่าสุดเพื่อความสะอาดตาของหน้าจอ
    this.toasts = [...this.toasts.slice(-2), toastItem];
    this.notify();

    if (toastItem.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toastItem.duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  success(
    message: string,
    options?: {
      title?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) {
    return this.show({
      type: 'success',
      title: options?.title || 'บันทึกข้อมูลสำเร็จ',
      message,
      ...options,
    });
  }

  error(
    message: string,
    options?: {
      title?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) {
    return this.show({
      type: 'error',
      title: options?.title || 'เกิดข้อผิดพลาด',
      message,
      ...options,
    });
  }

  info(
    message: string,
    options?: {
      title?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) {
    return this.show({
      type: 'info',
      title: options?.title,
      message,
      ...options,
    });
  }
}

export const toast = new ToastManager();

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[200] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none no-print"
      style={{
        top: 'max(1rem, env(safe-area-inset-top, 1rem))',
        right: 'max(1rem, env(safe-area-inset-right, 1rem))',
      }}
      role="region"
      aria-label="การแจ้งเตือนของระบบ"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          aria-live="polite"
          className="pointer-events-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 flex items-start gap-3.5 animate-toastSlideIn transition-all duration-200"
        >
          <div
            className={`p-2 rounded-xl shrink-0 ${
              item.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80'
                : item.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-800/80'
                : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80'
            }`}
          >
            {item.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            ) : item.type === 'error' ? (
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <Info className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            {item.title && (
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {item.title}
              </h4>
            )}
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {item.message}
            </p>

            {item.action && (
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  toast.dismiss(item.id);
                }}
                className="mt-2.5 min-h-[36px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                {item.action.label}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => toast.dismiss(item.id)}
            title="ปิดการแจ้งเตือน"
            aria-label="ปิดการแจ้งเตือน"
            className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};
