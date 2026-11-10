import { useId } from 'react';

/** Savora mark: a chef's hat in forest green (from the brand logo). */
export function LogoMark({ size = 40, className, tile = true }: { size?: number; className?: string; tile?: boolean }) {
  // unique per instance: a gradient defined inside a hidden <svg> (e.g. the mobile-hidden sidebar) won't paint elsewhere
  const gid = `hat-${useId().replace(/:/g, '')}`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Savora">
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="420">
          <stop offset="0" style={{ stopColor: 'var(--hat-top, #2F6B28)' }} />
          <stop offset="1" style={{ stopColor: 'var(--hat-bottom, #173F1B)' }} />
        </linearGradient>
      </defs>
      {tile && <rect width="512" height="512" rx="116" style={{ fill: 'var(--hat-tile, #FDF6E6)' }} />}
      <g transform="translate(-32 6)" fill="none" stroke={`url(#${gid})`} strokeWidth="30" strokeLinecap="round" strokeLinejoin="round">
        <path d="M160 312C112 306 92 268 100 234C110 192 152 170 196 182C206 138 250 104 300 108C350 112 386 148 392 190C432 174 474 202 476 246C478 286 448 308 400 312" />
        <path d="M160 312L168 412C232 388 330 392 396 412L400 312" />
        <path d="M172 352C236 334 330 336 392 352" />
      </g>
    </svg>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word" style={{ fontSize: size * 0.74 }}>Savora</span>
    </span>
  );
}
