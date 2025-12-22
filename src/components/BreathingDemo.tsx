import { useState, useEffect, useCallback, forwardRef } from 'react';
import { ArrowRight, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreathingDemoProps {
  onGetStarted: () => void;
  compact?: boolean;
}

const INHALE_DURATION = 4000; // 4 seconds
const EXHALE_DURATION = 6000; // 6 seconds
const TOTAL_CYCLES = 3; // Reduced for demo to keep engagement

type BreathingPhase = 'idle' | 'inhale' | 'exhale' | 'complete';

export const BreathingDemo = forwardRef<HTMLElement, BreathingDemoProps>(function BreathingDemo({ onGetStarted, compact = false }, ref) {
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [cycle, setCycle] = useState(0);
  const [showPulse, setShowPulse] = useState(true);

  const startBreathing = useCallback(() => {
    setPhase('inhale');
    setCycle(1);
    setShowPulse(false);
  }, []);

  const resetDemo = useCallback(() => {
    setPhase('idle');
    setCycle(0);
    setShowPulse(true);
  }, []);

  useEffect(() => {
    if (phase === 'idle' || phase === 'complete') return;

    const duration = phase === 'inhale' ? INHALE_DURATION : EXHALE_DURATION;

    const timer = setTimeout(() => {
      if (phase === 'inhale') {
        setPhase('exhale');
      } else if (phase === 'exhale') {
        if (cycle >= TOTAL_CYCLES) {
          setPhase('complete');
        } else {
          setCycle((c) => c + 1);
          setPhase('inhale');
        }
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [phase, cycle]);

  // Pulsing animation for idle state to attract attention
  useEffect(() => {
    if (phase !== 'idle') return;
    const interval = setInterval(() => {
      setShowPulse((p) => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  const getCircleSize = () => {
    if (phase === 'inhale') return 'scale-125';
    if (phase === 'exhale') return 'scale-90';
    if (phase === 'idle' && showPulse) return 'scale-105';
    return 'scale-100';
  };

  const getAnimationDuration = () => {
    if (phase === 'inhale') return 'duration-[4000ms]';
    if (phase === 'exhale') return 'duration-[6000ms]';
    return 'duration-1000';
  };

  const circleSize = compact ? 'w-40 h-40 md:w-48 md:h-48' : 'w-48 h-48 md:w-64 md:h-64';
  const textSize = compact ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl';

  return (
    <section ref={ref} className={`px-4 ${compact ? 'py-8' : 'py-16'}`}>
      <div className="max-w-lg mx-auto text-center">
        {!compact && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Try It Now — Free
            </h2>
            <p className="text-muted-foreground mb-6">
              Experience calm in 30 seconds. No sign-up needed.
            </p>
          </>
        )}

        <div className="flex flex-col items-center gap-4">
          {/* Breathing Circle */}
          <div
            onClick={phase === 'idle' ? startBreathing : undefined}
            className={`
              relative ${circleSize} rounded-full 
              bg-gradient-to-br from-teal-300 via-cyan-300 to-sky-300
              dark:from-teal-700/60 dark:via-cyan-700/60 dark:to-sky-700/60
              flex items-center justify-center
              shadow-xl shadow-primary/30
              transition-all ease-in-out
              ${getAnimationDuration()}
              ${getCircleSize()}
              ${phase === 'idle' ? 'cursor-pointer hover:shadow-2xl hover:shadow-primary/40' : ''}
            `}
          >
            {/* Outer ring animation */}
            {phase !== 'idle' && phase !== 'complete' && (
              <div className="absolute inset-0 rounded-full border-4 border-teal-400/50 animate-ping" />
            )}
            
            <div className="text-center px-4 z-10">
              {phase === 'idle' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/80 dark:bg-white/20 flex items-center justify-center shadow-md">
                    <Play className="w-6 h-6 text-teal-700 dark:text-teal-200 ml-0.5" />
                  </div>
                  <p className="text-base md:text-lg font-semibold text-teal-800 dark:text-teal-100">
                    Tap to start
                  </p>
                </div>
              )}

              {phase === 'inhale' && (
                <div>
                  <p className={`${textSize} font-bold text-teal-800 dark:text-teal-100`}>
                    Breathe in...
                  </p>
                  <div className="flex justify-center gap-1 mt-3">
                    {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < cycle ? 'bg-teal-600 dark:bg-teal-300' : 'bg-teal-400/40 dark:bg-teal-500/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {phase === 'exhale' && (
                <div>
                  <p className={`${textSize} font-bold text-teal-800 dark:text-teal-100`}>
                    Breathe out...
                  </p>
                  <div className="flex justify-center gap-1 mt-3">
                    {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < cycle ? 'bg-teal-600 dark:bg-teal-300' : 'bg-teal-400/40 dark:bg-teal-500/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {phase === 'complete' && (
                <div>
                  <p className="text-xl md:text-2xl font-bold text-teal-800 dark:text-teal-100">
                    ✨ Well done!
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-200 mt-1">
                    Feeling calmer?
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA after completion - AGGRESSIVE */}
          {phase === 'complete' && (
            <div className="animate-fade-in flex flex-col items-center gap-2">
              <p className="text-base font-semibold text-foreground">
                🎉 You just reduced your anxiety!
              </p>
              <p className="text-sm text-muted-foreground">
                Get <span className="text-primary font-medium">unlimited exercises + AI support</span>
              </p>
              <Button size="lg" onClick={onGetStarted} className="text-lg px-8 mt-2 shadow-lg shadow-primary/25 animate-pulse">
                Unlock Free Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-xs text-green-600 font-medium">
                ✓ 2,847 people signed up today
              </p>
              <button
                onClick={resetDemo}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <RotateCcw className="w-3 h-3" />
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
