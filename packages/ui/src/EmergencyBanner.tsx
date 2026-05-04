import { cn } from './cn.js';

export type EmergencyBannerProps = { message: string; className?: string };

export function EmergencyBanner({ message, className }: EmergencyBannerProps) {
  return (
    <div
      role="note"
      className={cn(
        'border-b border-accent-copper/30 bg-accent-copper/10 px-4 py-2 text-center text-sm text-accent-copper',
        className,
      )}
    >
      {message}
    </div>
  );
}
