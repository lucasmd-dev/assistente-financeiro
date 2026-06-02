'use client';

interface SectionHeaderProps {
  kicker: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ kicker, title, description, children }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-[oklch(0.82_0.14_286)] uppercase">
          {kicker}
        </span>
        <h2 className="font-display mt-0.5 text-xl font-bold text-white">{title}</h2>
        {description && <p className="mt-1 max-w-prose text-sm text-white/45">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
