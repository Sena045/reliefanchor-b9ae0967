import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Heart, RefreshCw, Circle, Lock, Crown, Zap, Box, Palette, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

interface MentalWellnessGamesProps {
  onShowPremium?: () => void;
}

interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
}

const AFFIRMATIONS = [
  "I am worthy of love and respect.",
  "I choose peace over worry.",
  "I am stronger than my challenges.",
  "My feelings are valid.",
  "I deserve happiness and joy.",
  "I am enough, just as I am.",
  "Every breath I take calms me.",
  "I release what I cannot control.",
  "I am grateful for this moment.",
  "I trust my journey.",
];

const MOTIVATION_QUOTES = [
  { quote: "The only way out is through.", author: "Robert Frost" },
  { quote: "You are braver than you believe.", author: "A.A. Milne" },
  { quote: "This too shall pass.", author: "Persian Proverb" },
  { quote: "Be gentle with yourself.", author: "Unknown" },
  { quote: "Progress, not perfection.", author: "Unknown" },
  { quote: "You've survived 100% of your worst days.", author: "Unknown" },
  { quote: "Healing is not linear.", author: "Unknown" },
  { quote: "Small steps still move you forward.", author: "Unknown" },
];

const BODY_PARTS = [
  { name: "Feet", instruction: "Curl your toes tightly, hold for 5 seconds, then release." },
  { name: "Legs", instruction: "Tense your calf and thigh muscles, hold, then let go." },
  { name: "Stomach", instruction: "Tighten your abdominal muscles, hold, then relax." },
  { name: "Hands", instruction: "Make tight fists, hold for 5 seconds, then open." },
  { name: "Arms", instruction: "Flex your biceps, hold the tension, then release." },
  { name: "Shoulders", instruction: "Raise your shoulders to your ears, hold, then drop." },
  { name: "Face", instruction: "Scrunch your face tightly, hold, then smooth it out." },
];

const MEMORY_EMOJIS = ['🌸', '🌿', '☀️', '🌙', '🦋', '🌊'];

const BUBBLE_COLORS = [
  'bg-pink-400/60',
  'bg-purple-400/60', 
  'bg-blue-400/60',
  'bg-teal-400/60',
  'bg-green-400/60',
  'bg-amber-400/60',
];

const BREATH_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#A78BFA'];

export function MentalWellnessGames({ onShowPremium }: MentalWellnessGamesProps) {
  const { isPremium } = useApp();
  const [activeGame, setActiveGame] = useState<'memory' | 'affirmation' | 'gratitude' | 'bubble' | 'bodyscan' | 'motivation' | 'worrybox' | 'colorbreath' | null>(null);

  const handleGameClick = (game: typeof activeGame, requiresPremium: boolean) => {
    if (requiresPremium && !isPremium) {
      onShowPremium?.();
      return;
    }
    setActiveGame(game);
  };
  
  return (
    <div className="space-y-4">
      {!activeGame && (
        <div className="grid gap-3">
          {/* Free Games */}
          <GameCard
            icon={Circle}
            title="Bubble Pop"
            description="Pop calming bubbles for stress relief"
            onClick={() => handleGameClick('bubble', false)}
          />
          <GameCard
            icon={Sparkles}
            title="Affirmation Spin"
            description="Discover your daily positive affirmation"
            onClick={() => handleGameClick('affirmation', false)}
          />
          
          {/* Premium Games */}
          <GameCard
            icon={Brain}
            title="Memory Match"
            description="Match calming symbols to improve focus"
            onClick={() => handleGameClick('memory', true)}
            isPremium={!isPremium}
          />
          <GameCard
            icon={Heart}
            title="Gratitude Jar"
            description="Collect and reflect on moments of joy"
            onClick={() => handleGameClick('gratitude', true)}
            isPremium={!isPremium}
          />
          <GameCard
            icon={Activity}
            title="Body Scan Meditation"
            description="Guided progressive muscle relaxation"
            onClick={() => handleGameClick('bodyscan', true)}
            isPremium={!isPremium}
          />
          <GameCard
            icon={Zap}
            title="Daily Motivation"
            description="Inspiring quotes for your journey"
            onClick={() => handleGameClick('motivation', true)}
            isPremium={!isPremium}
          />
          <GameCard
            icon={Box}
            title="Worry Box"
            description="Park your worries for later"
            onClick={() => handleGameClick('worrybox', true)}
            isPremium={!isPremium}
          />
          <GameCard
            icon={Palette}
            title="Color Breathing"
            description="Visualize calm with color therapy"
            onClick={() => handleGameClick('colorbreath', true)}
            isPremium={!isPremium}
          />
        </div>
      )}
      
      {activeGame === 'bubble' && <BubblePopGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'memory' && <MemoryGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'affirmation' && <AffirmationGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'gratitude' && <GratitudeGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'bodyscan' && <BodyScanGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'motivation' && <MotivationGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'worrybox' && <WorryBoxGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'colorbreath' && <ColorBreathGame onBack={() => setActiveGame(null)} />}
    </div>
  );
}

function GameCard({ icon: Icon, title, description, onClick, isPremium }: {
  icon: typeof Brain;
  title: string;
  description: string;
  onClick: () => void;
  isPremium?: boolean;
}) {
  return (
    <Card className={cn("cursor-pointer transition-colors", isPremium ? "opacity-80" : "hover:bg-accent/50")} onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-3 rounded-full", isPremium ? "bg-amber-500/20" : "bg-primary/10")}>
          {isPremium ? <Lock className="h-6 w-6 text-amber-500" /> : <Icon className="h-6 w-6 text-primary" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{title}</h3>
            {isPremium && (
              <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                <Crown className="h-3 w-3" /> Premium
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BubblePopGame({ onBack }: { onBack: () => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const createBubble = useCallback((): Bubble => {
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10,
      y: 100,
      size: Math.random() * 30 + 30,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      speed: Math.random() * 1 + 0.5,
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      setBubbles(prev => [...prev.slice(-15), createBubble()]);
    }, 800);

    const moveInterval = setInterval(() => {
      setBubbles(prev => 
        prev
          .map(b => ({ ...b, y: b.y - b.speed }))
          .filter(b => b.y > -10)
      );
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [isPlaying, createBubble]);

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(s => s + 1);
  };

  const startGame = () => {
    setBubbles([]);
    setScore(0);
    setIsPlaying(true);
  };

  const stopGame = () => {
    setIsPlaying(false);
    setBubbles([]);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
          <span className="text-sm font-medium text-primary">Score: {score}</span>
        </div>

        <div 
          className="relative h-64 bg-gradient-to-b from-primary/5 to-primary/20 rounded-xl overflow-hidden"
        >
          {!isPlaying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {score > 0 && (
                <p className="text-lg font-medium">You popped {score} bubbles!</p>
              )}
              <Button onClick={startGame} size="lg">
                {score > 0 ? 'Play Again' : 'Start Popping'}
              </Button>
            </div>
          )}

          {isPlaying && (
            <>
              {bubbles.map(bubble => (
                <button
                  key={bubble.id}
                  onClick={() => popBubble(bubble.id)}
                  style={{
                    left: `${bubble.x}%`,
                    bottom: `${bubble.y}%`,
                    width: bubble.size,
                    height: bubble.size,
                  }}
                  className={cn(
                    'absolute rounded-full transition-transform hover:scale-110 active:scale-90',
                    'shadow-lg backdrop-blur-sm border border-white/30',
                    'animate-pulse cursor-pointer',
                    bubble.color
                  )}
                />
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopGame}
                className="absolute bottom-2 right-2"
              >
                Stop
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Tap the bubbles as they float up. Relax and enjoy!
        </p>
      </CardContent>
    </Card>
  );
}

function MemoryGame({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<MemoryCard[]>(() => {
    const shuffled = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, isFlipped: false, isMatched: false }));
    return shuffled;
  });
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  
  const allMatched = cards.every(c => c.isMatched);

  const handleCardClick = (id: number) => {
    if (isChecking || flippedIds.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsChecking(true);
      const [first, second] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);
      
      setTimeout(() => {
        if (first.emoji === second.emoji) {
          setCards(prev => prev.map(c => 
            c.id === first.id || c.id === second.id ? { ...c, isMatched: true } : c
          ));
        } else {
          setCards(prev => prev.map(c => 
            c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c
          ));
        }
        setFlippedIds([]);
        setIsChecking(false);
      }, 800);
    }
  };

  const resetGame = () => {
    const shuffled = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, isFlipped: false, isMatched: false }));
    setCards(shuffled);
    setFlippedIds([]);
    setMoves(0);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
          <span className="text-sm text-muted-foreground">Moves: {moves}</span>
        </div>
        
        {allMatched ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-4xl">🎉</div>
            <p className="font-medium">Well done! You completed it in {moves} moves.</p>
            <Button onClick={resetGame}>Play Again</Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={cn(
                  'aspect-square rounded-lg text-2xl flex items-center justify-center transition-all duration-300',
                  card.isFlipped || card.isMatched
                    ? 'bg-primary/20 rotate-0'
                    : 'bg-muted hover:bg-muted/80 rotate-y-180'
                )}
              >
                {(card.isFlipped || card.isMatched) ? card.emoji : '?'}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AffirmationGame({ onBack }: { onBack: () => void }) {
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    setIsSpinning(true);
    setAffirmation(null);
    
    setTimeout(() => {
      setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
      setIsSpinning(false);
    }, 1500);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <div className={cn(
            'w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center',
            isSpinning && 'animate-spin'
          )}>
            <Sparkles className={cn('h-12 w-12 text-primary', isSpinning && 'animate-pulse')} />
          </div>
          
          {affirmation && (
            <div className="text-center p-4 bg-primary/5 rounded-lg animate-fade-in">
              <p className="text-lg font-medium text-primary">{affirmation}</p>
            </div>
          )}
          
          <Button onClick={spin} disabled={isSpinning} size="lg">
            <RefreshCw className={cn('h-4 w-4 mr-2', isSpinning && 'animate-spin')} />
            {isSpinning ? 'Finding...' : 'Get Affirmation'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GratitudeGame({ onBack }: { onBack: () => void }) {
  const [gratitudes, setGratitudes] = useState<string[]>(() => {
    const stored = localStorage.getItem('gratitude_jar');
    return stored ? JSON.parse(stored) : [];
  });
  const [input, setInput] = useState('');
  const [showingRandom, setShowingRandom] = useState<string | null>(null);

  const addGratitude = () => {
    if (!input.trim()) return;
    const updated = [input.trim(), ...gratitudes];
    setGratitudes(updated);
    localStorage.setItem('gratitude_jar', JSON.stringify(updated));
    setInput('');
  };

  const pickRandom = () => {
    if (gratitudes.length === 0) return;
    setShowingRandom(gratitudes[Math.floor(Math.random() * gratitudes.length)]);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGratitude()}
            placeholder="Something you're grateful for..."
            className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm"
          />
          <Button onClick={addGratitude} size="sm">Add</Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {gratitudes.length} moments in your jar
          </span>
          <Button variant="outline" size="sm" onClick={pickRandom} disabled={gratitudes.length === 0}>
            <Heart className="h-4 w-4 mr-1" /> Pick One
          </Button>
        </div>
        
        {showingRandom && (
          <div className="p-4 bg-primary/10 rounded-lg animate-fade-in text-center">
            <p className="text-primary font-medium">"{showingRandom}"</p>
          </div>
        )}
        
        {gratitudes.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-2">
            {gratitudes.slice(0, 5).map((g, i) => (
              <div key={i} className="text-sm p-2 bg-muted/50 rounded text-muted-foreground">
                {g}
              </div>
            ))}
            {gratitudes.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{gratitudes.length - 5} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Body Scan Meditation Game
function BodyScanGame({ onBack }: { onBack: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && isActive) {
      if (currentStep < BODY_PARTS.length - 1) {
        setCurrentStep(s => s + 1);
        setTimer(10);
      } else {
        setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timer, currentStep]);

  const startSession = () => {
    setCurrentStep(0);
    setTimer(10);
    setIsActive(true);
  };

  const part = BODY_PARTS[currentStep];
  const isComplete = !isActive && currentStep === BODY_PARTS.length - 1 && timer === 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        
        {!isActive && !isComplete && (
          <div className="text-center py-8 space-y-4">
            <Activity className="h-16 w-16 text-primary mx-auto" />
            <h3 className="text-lg font-medium">Body Scan Meditation</h3>
            <p className="text-sm text-muted-foreground">
              Relax each body part progressively to release tension
            </p>
            <Button onClick={startSession} size="lg">Begin Session</Button>
          </div>
        )}

        {isActive && (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center gap-1">
              {BODY_PARTS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    i < currentStep ? 'bg-green-500' :
                    i === currentStep ? 'bg-primary animate-pulse' : 'bg-muted'
                  )}
                />
              ))}
            </div>
            
            <div className="p-6 bg-primary/10 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Focus on your</p>
              <h3 className="text-2xl font-bold text-primary mb-3">{part.name}</h3>
              <p className="text-sm">{part.instruction}</p>
            </div>
            
            <div className="text-4xl font-mono text-primary">{timer}s</div>
            
            <Button variant="outline" onClick={() => setIsActive(false)}>Pause</Button>
          </div>
        )}

        {isComplete && (
          <div className="text-center py-8 space-y-4">
            <div className="text-4xl">🧘</div>
            <h3 className="text-lg font-medium text-green-600">Session Complete!</h3>
            <p className="text-sm text-muted-foreground">
              Take a moment to notice how your body feels now.
            </p>
            <Button onClick={startSession}>Start Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Daily Motivation Game
function MotivationGame({ onBack }: { onBack: () => void }) {
  const [quote, setQuote] = useState<typeof MOTIVATION_QUOTES[0] | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const revealQuote = () => {
    setIsRevealing(true);
    setQuote(null);
    setTimeout(() => {
      setQuote(MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]);
      setIsRevealing(false);
    }, 1000);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <div className={cn(
            'w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/30 flex items-center justify-center',
            isRevealing && 'animate-pulse'
          )}>
            <Zap className="h-10 w-10 text-amber-500" />
          </div>
          
          {quote && (
            <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl animate-fade-in-up max-w-sm">
              <p className="text-lg font-medium mb-2">"{quote.quote}"</p>
              <p className="text-sm text-muted-foreground">— {quote.author}</p>
            </div>
          )}
          
          <Button onClick={revealQuote} disabled={isRevealing} size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            {isRevealing ? 'Revealing...' : quote ? 'Another Quote' : 'Get Inspired'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Worry Box Game
function WorryBoxGame({ onBack }: { onBack: () => void }) {
  const [worries, setWorries] = useState<{ text: string; date: string }[]>(() => {
    const stored = localStorage.getItem('worry_box');
    return stored ? JSON.parse(stored) : [];
  });
  const [input, setInput] = useState('');
  const [showBox, setShowBox] = useState(false);

  const addWorry = () => {
    if (!input.trim()) return;
    const updated = [{ text: input.trim(), date: new Date().toLocaleDateString() }, ...worries];
    setWorries(updated);
    localStorage.setItem('worry_box', JSON.stringify(updated));
    setInput('');
  };

  const clearWorry = (index: number) => {
    const updated = worries.filter((_, i) => i !== index);
    setWorries(updated);
    localStorage.setItem('worry_box', JSON.stringify(updated));
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        
        <div className="text-center py-2">
          <Box className="h-12 w-12 text-purple-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Write down your worries to "park" them. Come back later to address or release them.
          </p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWorry()}
            placeholder="What's worrying you?"
            className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm"
          />
          <Button onClick={addWorry} size="sm" className="bg-purple-500 hover:bg-purple-600">
            Park It
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {worries.length} worries in the box
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowBox(!showBox)}
          >
            {showBox ? 'Close Box' : 'Open Box'}
          </Button>
        </div>
        
        {showBox && worries.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            {worries.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-background rounded text-sm">
                <div className="flex-1">
                  <p>{w.text}</p>
                  <p className="text-xs text-muted-foreground">{w.date}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => clearWorry(i)} className="text-xs h-6">
                  Release
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {showBox && worries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Your worry box is empty! 🎉
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Color Breathing Game
function ColorBreathGame({ onBack }: { onBack: () => void }) {
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [colorIndex, setColorIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!isBreathing) return;
    
    let timeout: NodeJS.Timeout;
    
    if (phase === 'inhale') {
      timeout = setTimeout(() => setPhase('hold'), 4000);
    } else if (phase === 'hold') {
      timeout = setTimeout(() => setPhase('exhale'), 4000);
    } else {
      timeout = setTimeout(() => {
        setPhase('inhale');
        setColorIndex(i => (i + 1) % BREATH_COLORS.length);
        setCycleCount(c => c + 1);
      }, 4000);
    }
    
    return () => clearTimeout(timeout);
  }, [isBreathing, phase]);

  const startBreathing = () => {
    setIsBreathing(true);
    setPhase('inhale');
    setCycleCount(0);
  };

  const stopBreathing = () => {
    setIsBreathing(false);
  };

  const currentColor = BREATH_COLORS[colorIndex];
  const scale = phase === 'inhale' ? 'scale-110' : phase === 'hold' ? 'scale-110' : 'scale-75';

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
          {isBreathing && <span className="text-sm text-muted-foreground">Cycles: {cycleCount}</span>}
        </div>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <div 
            className={cn(
              'w-40 h-40 rounded-full flex items-center justify-center transition-all duration-[4000ms] ease-in-out',
              scale
            )}
            style={{ backgroundColor: isBreathing ? currentColor : '#94A3B8' }}
          >
            <span className="text-white font-medium text-lg">
              {isBreathing ? (
                phase === 'inhale' ? 'Breathe In' : 
                phase === 'hold' ? 'Hold' : 'Breathe Out'
              ) : 'Ready'}
            </span>
          </div>
          
          {isBreathing && (
            <div className="flex gap-2">
              {BREATH_COLORS.map((color, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-4 h-4 rounded-full transition-all',
                    i === colorIndex ? 'ring-2 ring-offset-2 ring-primary' : ''
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {isBreathing 
              ? 'Follow the color as it expands and contracts with your breath'
              : 'Visualize calm colors while practicing deep breathing'
            }
          </p>
          
          <Button 
            onClick={isBreathing ? stopBreathing : startBreathing}
            size="lg"
            className={cn(
              isBreathing ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            )}
          >
            {isBreathing ? 'Stop' : 'Start Color Breathing'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
