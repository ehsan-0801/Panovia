import { cn } from '@/lib/utils';

/**
 * Panovia wordmark. Shows the standard logo in light mode and the
 * inverted (white) variant in dark mode. Pass height via className, e.g. `h-8`.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <img src="/PanoviaLogo.png" alt="Panovia" className={cn('logo-light w-auto', className)} />
      <img src="/PanoviaLogo-dark.png" alt="Panovia" className={cn('logo-dark w-auto', className)} />
    </>
  );
}
