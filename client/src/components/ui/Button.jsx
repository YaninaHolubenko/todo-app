// client/src/components/ui/Button.jsx
import React from 'react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

/**
 * Reusable Button
 *
 * Props:
 * - variant: 'primary' | 'ghost' | 'danger' | 'link'
 * - size: 'md' | 'sm'
 * - fullWidth: boolean
 * - loading: boolean
 * - disabled: boolean
 * - type: 'button' | 'submit' | 'reset'
 * - className: string (to keep compatibility with existing styles like "create", "btn primary wide")
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) => {
  const base = 'btn-reset'; // minimal reset; style stays from existing CSS
  // Map to your current CSS utilities if present
  const variantClass =
    variant === 'primary'
      ? 'btn primary'
      : variant === 'ghost'
      ? 'btn ghost'
      : variant === 'danger'
      ? 'btn danger'
      : 'btn link';

  const sizeClass = size === 'sm' ? 'btn-sm' : 'btn-md';
  const widthClass = fullWidth ? 'wide' : '';

  return (
    <button
      type={type}
      className={cx(base, variantClass, sizeClass, widthClass, className)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
};

export default Button;
