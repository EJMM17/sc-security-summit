"use client";

import { useEffect, useRef, useState } from "react";

// Shared observer at threshold 0.3 for all AnimatedCounter instances
const counterObserverCallbacks = new WeakMap<Element, () => void>();
let _counterObserver: IntersectionObserver | null = null;

function getCounterObserver(): IntersectionObserver {
  if (_counterObserver) return _counterObserver;
  _counterObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = counterObserverCallbacks.get(entry.target);
          if (cb) {
            cb();
            _counterObserver!.unobserve(entry.target);
            counterObserverCallbacks.delete(entry.target);
          }
        }
      }
    },
    { threshold: 0.3 }
  );
  return _counterObserver;
}

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export default function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
  className = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasStarted) return;

    const observer = getCounterObserver();
    counterObserverCallbacks.set(el, () => setHasStarted(true));
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      counterObserverCallbacks.delete(el);
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animFrame: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    }

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [hasStarted, target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}
