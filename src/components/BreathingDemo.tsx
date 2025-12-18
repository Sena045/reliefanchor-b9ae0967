import { useState, useEffect, useCallback, forwardRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreathingDemoProps {
  onGetStarted: () => void;
}

const INHALE_DURATION = 4000; // 4 seconds
const EXHALE_DURATION = 6000; // 6 seconds
const TOTAL_CYCLES = 6;

type BreathingPhase = 'idle' | 'inhale' | 'exhale' | 'complete';

export const BreathingDemo = forwardRef<HTMLElement, BreathingDemoProps>(function BreathingDemo({ onGetStarted }, ref) {
  const [phase, setPhase] = useState<BreathingPhase>('idle');
  const [cycle, setCycle] = useState(0);

  const startBreathing = useCallback(() => {
    setPhase('inhale');
    setCycle(1);
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

  const getCircleSize = () => {
    if (phase === 'inhale') return 'scale-110';
    if (phase === 'exhale') return 'scale-90';
    return 'scale-100';
  };

  const getAnimationDuration = () => {
    if (phase === 'inhale') return 'duration-[4000ms]';
    if (phase === 'exhale') return 'duration-[6000ms]';
    return 'duration-300';
  };

  return (
    <section ref={ref} className="px-4 py-16">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Experience Calm in 60 Seconds
        </h2>
        <p className="text-muted-foreground mb-8">
          Try our guided breathing exercise right now — no sign-up required.
        </p>

        <div className="flex flex-col items-center gap-6">
          {/* Breathing Circle */}
          <div
            onClick={phase === 'idle' ? startBreathing : undefined}
            className={`
              relative w-48 h-48 md:w-64 md:h-64 rounded-full 
              bg-gradient-to-br from-teal-200 via-cyan-200 to-sky-200
              dark:from-teal-800/50 dark:via-cyan-800/50 dark:to-sky-800/50
              flex items-center justify-center
              shadow-lg shadow-primary/20
              transition-transform ease-in-out
              ${getAnimationDuration()}
              ${getCircleSize()}
              ${phase === 'idle' ? 'cursor-pointer hover:scale-105' : ''}
            `}
          >
            <div className="text-center px-4">
              {phase === 'idle' && (
                <div className="animate-pulse">
                  <p className="text-lg md:text-xl font-semibold text-teal-800 dark:text-teal-100">
                    Try 60-Second Calm
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-200 mt-1">
                    Tap to start
                  </p>
                </div>
              )}

              {phase === 'inhale' && (
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-teal-800 dark:text-teal-100">
                    Breathe in
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-200 mt-2">
                    {cycle} / {TOTAL_CYCLES}
                  </p>
                </div>
              )}

              {phase === 'exhale' && (
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-teal-800 dark:text-teal-100">
                    Breathe out
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-200 mt-2">
                    {cycle} / {TOTAL_CYCLES}
                  </p>
                </div>
              )}

              {phase === 'complete' && (
                <div>
                  <p className="text-xl md:text-2xl font-bold text-teal-800 dark:text-teal-100">
                    Well done! ✨
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-200 mt-1">
                    Feeling calmer?
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA after completion */}
          {phase === 'complete' && (
            <div className="animate-fade-in">
              <Button size="lg" onClick={onGetStarted} className="text-lg px-6">
                Unlock more with Premium
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Reset button */}
          {phase === 'complete' && (
            <button
              onClick={() => {
                setPhase('idle');
                setCycle(0);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </section>
  );
});
