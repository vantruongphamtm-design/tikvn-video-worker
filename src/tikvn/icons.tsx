import { COLORS } from "./theme";

// Clean stroke icons in brand orange — consistent, no emoji-font roulette
const S = {
  fill: "none",
  stroke: COLORS.orangeLight,
  strokeWidth: 6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const SIZE = 128;

export const MicIcon: React.FC = () => (
  <svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
    <rect x="38" y="14" width="24" height="46" rx="12" {...S} />
    <path d="M28 46 a22 22 0 0 0 44 0" {...S} />
    <line x1="50" y1="68" x2="50" y2="82" {...S} />
    <line x1="36" y1="86" x2="64" y2="86" {...S} />
  </svg>
);

export const ScriptIcon: React.FC = () => (
  <svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
    <path d="M26 20 h34 l16 16 v44 a4 4 0 0 1 -4 4 H26 a4 4 0 0 1 -4 -4 V24 a4 4 0 0 1 4 -4 Z" {...S} />
    <path d="M60 20 v16 h16" {...S} />
    <line x1="34" y1="52" x2="60" y2="52" {...S} />
    <line x1="34" y1="66" x2="66" y2="66" {...S} />
    <path d="M74 44 l10 10 -20 20 -12 2 2 -12 Z" {...S} stroke={COLORS.amber} />
  </svg>
);

export const FilmIcon: React.FC = () => (
  <svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
    <rect x="18" y="24" width="64" height="52" rx="6" {...S} />
    <line x1="18" y1="42" x2="82" y2="42" {...S} />
    <path d="M22 24 l10 18 M42 24 l10 18 M62 24 l10 18" {...S} strokeWidth={4} />
    <path d="M42 52 v16 l14 -8 Z" {...S} stroke={COLORS.amber} />
  </svg>
);

export const CloneIcon: React.FC = () => (
  <svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
    <circle cx="50" cy="34" r="16" {...S} />
    <path d="M24 78 a26 22 0 0 1 52 0" {...S} />
    <path d="M78 40 c8 6 8 14 0 20 M86 34 c14 10 14 26 0 34" {...S} stroke={COLORS.amber} strokeWidth={5} />
  </svg>
);

export const MusicIcon: React.FC = () => (
  <svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
    <path d="M40 68 V28 l30 -8 v40" {...S} />
    <circle cx="32" cy="70" r="9" {...S} />
    <circle cx="62" cy="62" r="9" {...S} />
  </svg>
);
