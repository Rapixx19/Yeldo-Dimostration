import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-dark text-page hover:opacity-90 disabled:opacity-50',
  secondary:
    'border border-border-light text-text-primary hover:bg-soft disabled:opacity-50',
  ghost: 'text-text-secondary hover:text-text-primary disabled:opacity-50',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', fullWidth, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
        VARIANT_CLASSES[variant]
      } ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
      {...rest}
    />
  );
});
