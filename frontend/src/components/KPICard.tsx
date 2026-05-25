type Variant = 'default' | 'success' | 'accent';

interface KPIProps {
  label: string;
  value: string;
  footer?: string;
  footerVariant?: Variant;
}

const FOOTER_CLASSES: Record<Variant, string> = {
  default: 'text-text-secondary',
  success: 'text-text-success font-medium',
  accent: 'text-brand-accent font-medium',
};

export function KPICard({ label, value, footer, footerVariant = 'default' }: KPIProps) {
  return (
    <div className="bg-soft rounded-md p-4">
      <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-2">
        {label}
      </div>
      <div className="text-2xl font-medium tracking-tight text-brand-dark tabular-nums">
        {value}
      </div>
      {footer && <div className={`text-xs mt-2 ${FOOTER_CLASSES[footerVariant]}`}>{footer}</div>}
    </div>
  );
}
