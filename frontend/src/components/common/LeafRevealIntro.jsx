import React, { useState, useEffect } from "react";
import metafitLogo from "../../assets/metafit-logo.png";

const LEAF_TINTS = ["#5c8a4a", "#7aa95c", "#4a7a3f", "#8fbc6b", "#6b9a52"];

function generatePetals(count = 28) {
  return Array.from({ length: count }, (_, t) => ({
    left: (t * 97) % 100,
    delay: (t % 12) * 0.18,
    duration: 2.2 + ((t * 37) % 14) / 10,
    size: 14 + ((t * 53) % 18),
    sway: 20 + ((t * 29) % 40),
    rotate: (t * 61) % 120 - 60,
    tint: LEAF_TINTS[t % LEAF_TINTS.length],
  }));
}

const PETALS = generatePetals(28);

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

export default function LeafRevealIntro({ children, onlyOncePerSession = false }) {
  const [phase, setPhase] = useState(() => {
    if (onlyOncePerSession && typeof window !== "undefined") {
      const shown = sessionStorage.getItem("mwellness_intro_shown");
      if (shown) return "done";
    }
    return "fall"; // 'fall' | 'reveal' | 'done'
  });

  useEffect(() => {
    if (phase === "done") return;

    if (onlyOncePerSession) {
      sessionStorage.setItem("mwellness_intro_shown", "true");
    }

    const timer1 = setTimeout(() => {
      setPhase("reveal");
    }, 2100);

    const timer2 = setTimeout(() => {
      setPhase("done");
    }, 2900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [phase, onlyOncePerSession]);

  return (
    <>
      {phase !== "done" && (
        <div
          aria-hidden="true"
          className={`leaf-reveal-overlay ${phase === "reveal" ? "leaf-reveal-out" : ""
            }`}
        >
          {PETALS.map((p, idx) => (
            <LeafPetal key={idx} p={p} />
          ))}
          <div className="leaf-reveal-brand px-4 text-center">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/10 mb-3 flex items-center justify-center bg-white">
              <img
                src={metafitLogo}
                alt="Metafit Wellness"
                className="w-full h-full object-cover select-none"
              />
            </div>
            <span className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-wide text-[#1e2920] select-none">
              M Wellness Bazaar
            </span>
          </div>
        </div>
      )}
      <div className={phase === "fall" ? "leaf-reveal-hidden" : "leaf-reveal-shown"}>
        {children}
      </div>
    </>
  );
}
