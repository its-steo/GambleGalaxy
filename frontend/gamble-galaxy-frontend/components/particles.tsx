// components/particles.tsx
"use client";

import { useMemo } from "react";

export function Particles() {
  const particles = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-[0.5vw] h-[0.5vw] max-w-[5px] max-h-[5px] bg-white/30 rounded-full animate-pulse"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}
    </div>
  );
}