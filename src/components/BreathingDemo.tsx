import { useState, useEffect, useCallback, forwardRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

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
  const [showPopup, setShowPopup] = useState(false);

  const startBreathing = useCallback(() => {
    setPhase('inhale');
    setCycle(1);
    setShowPulse(false);
  }, []);

  const resetDemo = useCallback(() => {
    setPhase('idle');
    setCycle(0);
    setShowPulse(true);
    setShowPopup(false);
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
          setShowPopup(true);
          // Mark that breathing popup was shown to prevent exit popup conflict
          sessionStorage.setItem('breathing_popup_shown', 'true');
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

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      console.error('Google sign-in error:', error.message);
    }
  };

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
    <>
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

            {/* Try again button after completion */}
            {phase === 'complete' && (
              <button
                onClick={resetDemo}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try again
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Post-exercise popup */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-center">
              🌱 Enjoyed that?
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-muted-foreground">
              Unlock personalized sessions and track your calm.
            </p>
            <Button 
              size="lg" 
              onClick={handleGoogleSignIn}
              className="w-full text-lg shadow-lg shadow-primary/25"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google — It's Free
            </Button>
            <p className="text-xs text-muted-foreground">
              Your data stays private • Free forever
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});