import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Heart, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
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

const MEMORY_EMOJIS = ['🌸', '🌿', '☀️', '🌙', '🦋', '🌊'];

export function MentalWellnessGames() {
  const [activeGame, setActiveGame] = useState<'memory' | 'affirmation' | 'gratitude' | null>(null);
  
  return (
    <div className="space-y-4">
      {!activeGame && (
        <div className="grid gap-3">
          <GameCard
            icon={Brain}
            title="Memory Match"
            description="Match calming symbols to improve focus"
            onClick={() => setActiveGame('memory')}
          />
          <GameCard
            icon={Sparkles}
            title="Affirmation Spin"
            description="Discover your daily positive affirmation"
            onClick={() => setActiveGame('affirmation')}
          />
          <GameCard
            icon={Heart}
            title="Gratitude Jar"
            description="Collect and reflect on moments of joy"
            onClick={() => setActiveGame('gratitude')}
          />
        </div>
      )}
      
      {activeGame === 'memory' && <MemoryGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'affirmation' && <AffirmationGame onBack={() => setActiveGame(null)} />}
      {activeGame === 'gratitude' && <GratitudeGame onBack={() => setActiveGame(null)} />}
    </div>
  );
}

function GameCard({ icon: Icon, title, description, onClick }: {
  icon: typeof Brain;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
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
