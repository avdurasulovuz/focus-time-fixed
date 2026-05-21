import { TREE_STAGES } from "@/lib/focus";

interface Props {
  stage: number; // 0..6
  className?: string;
  withGround?: boolean;
}

// Realistic tree SVG built from layered shapes.
export function TreeArt({ stage, className, withGround = true }: Props) {
  const s = Math.max(0, Math.min(TREE_STAGES.length - 1, stage));
  return (
    <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sky" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(150 30% 25%)" />
          <stop offset="100%" stopColor="hsl(155 35% 14%)" />
        </radialGradient>
        <radialGradient id="canopy" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(135 55% 60%)" />
          <stop offset="60%" stopColor="hsl(145 55% 42%)" />
          <stop offset="100%" stopColor="hsl(150 60% 26%)" />
        </radialGradient>
        <linearGradient id="bark" x1="0" x2="1">
          <stop offset="0%" stopColor="#5b3a22" />
          <stop offset="50%" stopColor="#7a4d2c" />
          <stop offset="100%" stopColor="#3f2814" />
        </linearGradient>
        <radialGradient id="soil" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#3a2a18" />
          <stop offset="100%" stopColor="#1d1409" />
        </radialGradient>
        <radialGradient id="fruit" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ff8a6b" />
          <stop offset="60%" stopColor="#e2553a" />
          <stop offset="100%" stopColor="#982a17" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="190" fill="url(#sky)" opacity="0.4" />

      {withGround && (
        <>
          <ellipse cx="200" cy="350" rx="170" ry="22" fill="url(#soil)" />
          <ellipse cx="200" cy="346" rx="120" ry="10" fill="#2a1d10" opacity="0.6" />
        </>
      )}

      {/* Stage 0 — seed */}
      {s === 0 && (
        <g className="float">
          <ellipse cx="200" cy="340" rx="14" ry="9" fill="#3a2510" />
          <path d="M192 338 Q200 322 208 338" fill="none" stroke="#7a5a30" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {/* Stage 1 — sprout */}
      {s === 1 && (
        <g className="sway">
          <path d="M200 345 L200 310" stroke="#4a7c2a" strokeWidth="3" strokeLinecap="round" />
          <path d="M200 320 Q180 305 175 290 Q190 295 200 320" fill="#5fa53a" />
          <path d="M200 320 Q220 305 225 290 Q210 295 200 320" fill="#6fb84a" />
        </g>
      )}

      {/* Stage 2 — sapling */}
      {s === 2 && (
        <g className="sway">
          <path d="M198 345 L198 250 Q198 245 202 245 Q202 345 202 345 Z" fill="url(#bark)" />
          <ellipse cx="180" cy="260" rx="28" ry="22" fill="url(#canopy)" />
          <ellipse cx="220" cy="255" rx="32" ry="24" fill="url(#canopy)" />
          <ellipse cx="200" cy="235" rx="35" ry="26" fill="url(#canopy)" />
        </g>
      )}

      {/* Stage 3 — young tree */}
      {s === 3 && <YoungTree />}

      {/* Stage 4 — mature */}
      {s === 4 && <MatureTree />}

      {/* Stage 5 — flowering */}
      {s === 5 && <MatureTree flowers />}

      {/* Stage 6 — fruiting */}
      {s === 6 && <MatureTree fruits />}
    </svg>
  );
}

function YoungTree() {
  return (
    <g className="sway">
      <path d="M195 345 L195 220 Q195 215 205 215 Q205 345 205 345 Z" fill="url(#bark)" />
      <path d="M200 250 Q170 230 155 210" stroke="#5b3a22" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M200 250 Q230 230 245 210" stroke="#5b3a22" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="160" cy="215" rx="38" ry="30" fill="url(#canopy)" />
      <ellipse cx="240" cy="210" rx="42" ry="32" fill="url(#canopy)" />
      <ellipse cx="200" cy="185" rx="55" ry="42" fill="url(#canopy)" />
      <ellipse cx="200" cy="170" rx="35" ry="22" fill="hsl(140 60% 70%)" opacity="0.5" />
    </g>
  );
}

function MatureTree({ flowers, fruits }: { flowers?: boolean; fruits?: boolean }) {
  const dots: { x: number; y: number; r: number }[] = [
    { x: 150, y: 200, r: 6 }, { x: 175, y: 165, r: 7 }, { x: 210, y: 150, r: 6 },
    { x: 245, y: 170, r: 7 }, { x: 260, y: 215, r: 6 }, { x: 195, y: 215, r: 7 },
    { x: 165, y: 235, r: 6 }, { x: 230, y: 235, r: 7 }, { x: 200, y: 180, r: 6 },
    { x: 140, y: 220, r: 5 }, { x: 275, y: 195, r: 5 },
  ];
  return (
    <g className="sway">
      <path d="M188 345 L188 200 Q188 190 212 190 Q212 345 212 345 Z" fill="url(#bark)" />
      <path d="M195 260 Q160 240 130 215" stroke="#5b3a22" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M205 260 Q245 240 275 215" stroke="#5b3a22" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M200 220 Q200 200 200 175" stroke="#5b3a22" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="140" cy="195" rx="55" ry="45" fill="url(#canopy)" />
      <ellipse cx="265" cy="190" rx="58" ry="48" fill="url(#canopy)" />
      <ellipse cx="200" cy="160" rx="78" ry="60" fill="url(#canopy)" />
      <ellipse cx="200" cy="140" rx="50" ry="28" fill="hsl(140 60% 70%)" opacity="0.5" />
      {flowers && dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={d.r * 0.9} fill="#fde7f1" />
          <circle cx={d.x} cy={d.y} r={d.r * 0.35} fill="#f6c84a" />
        </g>
      ))}
      {fruits && dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={d.r} fill="url(#fruit)" />
          <path d={`M${d.x} ${d.y - d.r} q1 -4 4 -5`} stroke="#3a2410" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}
