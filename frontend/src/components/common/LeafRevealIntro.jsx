import React, { useState, useEffect } from "react";
import metafitLogo from "../../assets/metafit-logo.png";

const LEAF_TINTS = ["#4a7a3f", "#6b9a52", "#5c8a4a", "#7aa95c", "#8fbc6b", "#3b6332"];

function generatePetals(count = 32) {
  return Array.from({ length: count }, (_, t) => ({
    left: Math.round(((t * 31 + 7) % 96) + 2),
    delay: Number(((t * 0.13) % 1.6).toFixed(2)),
    duration: Number((2.0 + ((t * 7) % 14) / 10).toFixed(2)),
    size: 18 + ((t * 11) % 16),
    sway: (t % 2 === 0 ? 1 : -1) * (20 + ((t * 17) % 35)),
    rotate: (t * 47) % 360,
    tint: LEAF_TINTS[t % LEAF_TINTS.length],
  }));
}

const PETALS = generatePetals(32);

function LeafPetal({ p }) {
  return (
    <span
      aria-hidden="true"
      className="leaf-petal"
      style={{
        left: `${p.left}%`,
        animationDelay: `${p.delay}s`,
        animationDuration: `${p.duration}s`,
        "--sway": `${p.sway}px`,
        "--rot": `${p.rotate}deg`,
      }}
    >
      <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill={p.tint}>
        <path d="M12 2C7 7 4 11 4 15a8 8 0 0 0 16 0c0-4-3-8-8-13Zm0 18a1 1 0 0 1-1-1c0-3 1-6 1-9 0 3 1 6 1 9a1 1 0 0 1-1 1Z" />
      </svg>
    </span>
  );
}

export default function LeafRevealIntro({ children, onlyOncePerSession = true }) {
  const [phase, setPhase] = useState(() => {
    if (typeof window !== "undefined") {
      const shown = sessionStorage.getItem("mwellness_intro_shown");
      if (shown) return "done";
    }
    return "fall"; // 'fall' | 'reveal' | 'done'
  });

  // Lock scroll while intro animation plays
  useEffect(() => {
    if (phase !== "done") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "done") return;

    if (typeof window !== "undefined") {
      sessionStorage.setItem("mwellness_intro_shown", "true");
    }

    const timer1 = setTimeout(() => {
      setPhase("reveal");
    }, 2200);

    const timer2 = setTimeout(() => {
      setPhase("done");
    }, 2900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [phase]);

  return (
    <>
      <style>{`
        @keyframes leafFall {
          0% {
            transform: translateY(-40px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.9;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(105vh) translateX(var(--sway, 30px)) rotate(var(--rot, 45deg));
            opacity: 0;
          }
        }

        @keyframes introProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        .leaf-petal {
          position: absolute;
          top: -40px;
          pointer-events: none;
          animation-name: leafFall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }

        .animate-intro-progress {
          animation: introProgress 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {phase !== "done" && (
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-out select-none ${phase === "reveal"
              ? "opacity-0 scale-105 pointer-events-none"
              : "opacity-100 scale-100"
            }`}
          style={{
            background:
              "radial-gradient(ellipse at center, #FFFFFF 0%, #FAF6EE 55%, #EFE4D2 100%)",
          }}
        >
          {/* Falling Leaves Across Viewport */}
          {PETALS.map((p, idx) => (
            <LeafPetal key={idx} p={p} />
          ))}

          {/* Center Brand Luxury Card */}

          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-xl border border-[#A5794F]/25 mb-4 flex items-center justify-center bg-white p-2">
            <img
              src={metafitLogo}
              alt="Metafit Wellness"
              className="w-full h-full object-contain select-none"
            />
          </div>

          {/* Brand Name directly below logo */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#292117] select-none">
            M Wellness Bazaar
          </h1>

        </div>
      )}

      {/* Main Page & Hero Section (Smoothly reveals underneath) */}
      <div
        className={
          phase === "fall"
            ? "opacity-0 pointer-events-none"
            : "opacity-100 transition-opacity duration-700 ease-out"
        }
      >
        {children}
      </div>
    </>
  );
}
