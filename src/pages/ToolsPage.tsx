import { useState } from 'react';
import { Wind, Eye, Volume2, BookOpen, Play, Pause, VolumeX, Gamepad2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { audioService } from '@/services/audioService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MentalWellnessGames } from '@/components/games/MentalWellnessGames';

const JOURNAL_PROMPTS = {
  en: ['What are you grateful for today?', 'What made you smile recently?', 'What challenge are you facing?', 'Describe your ideal peaceful moment.'],
  hi: ['आज आप किस बात के लिए आभारी हैं?', 'हाल ही में किस बात ने आपको मुस्कुराया?', 'आप किस चुनौती का सामना कर रहे हैं?', 'अपने आदर्श शांतिपूर्ण क्षण का वर्णन करें।'],
};

const GROUNDING_STEPS = {
  en: ['5 things you can SEE', '4 things you can TOUCH', '3 things you can HEAR', '2 things you can SMELL', '1 thing you can TASTE'],
  hi: ['5 चीज़ें जो आप देख सकते हैं', '4 चीज़ें जो आप छू सकते हैं', '3 चीज़ें जो आप सुन सकते हैं', '2 चीज़ें जो आप सूंघ सकते हैं', '1 चीज़ जो आप चख सकते हैं'],
};

const TAB_LABELS = {
  breathing: { en: 'Breathing', hi: 'सांस' },
  grounding: { en: 'Grounding', hi: 'ग्राउंडिंग' },
  sounds: { en: 'Sounds', hi: 'ध्वनि' },
  journal: { en: 'Journal', hi: 'जर्नल' },
  games: { en: 'Games', hi: 'खेल' },
} as const;

export function ToolsPage() {
  const { profile, addJournal } = useApp();
  const { t } = useTranslation(profile.language);
  const { toast } = useToast();
  
  const lang = profile.language === 'hi' ? 'hi' : 'en';
  
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'sounds' | 'journal' | 'games'>('breathing');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [groundingStep, setGroundingStep] = useState(0);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [journalText, setJournalText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(JOURNAL_PROMPTS[lang][0]);

  const startBreathing = () => {
    setBreathingActive(true);
    let phase: 'inhale' | 'hold' | 'exhale' = 'inhale';
    const cycle = () => {
      if (phase === 'inhale') { setBreathPhase('inhale'); setTimeout(() => { phase = 'hold'; cycle(); }, 4000); }
      else if (phase === 'hold') { setBreathPhase('hold'); setTimeout(() => { phase = 'exhale'; cycle(); }, 7000); }
      else { setBreathPhase('exhale'); setTimeout(() => { phase = 'inhale'; cycle(); }, 8000); }
    };
    cycle();
  };

  const stopBreathing = () => setBreathingActive(false);

  const toggleSound = async (type: 'rain' | 'forest' | 'brown' | 'campfire') => {
    if (playingSound === type) { audioService.stopNoise(); setPlayingSound(null); }
    else { await audioService.playNoise(type, volume); setPlayingSound(type); }
  };

  const saveJournal = () => {
    if (!journalText.trim()) return;
    addJournal(currentPrompt, journalText);
    toast({ title: lang === 'hi' ? 'जर्नल सहेजा!' : 'Journal saved!' });
    setJournalText('');
    setCurrentPrompt(JOURNAL_PROMPTS[lang][Math.floor(Math.random() * JOURNAL_PROMPTS[lang].length)]);
  };

  const tabs = [
    { id: 'breathing' as const, icon: Wind },
    { id: 'grounding' as const, icon: Eye },
    { id: 'sounds' as const, icon: Volume2 },
    { id: 'journal' as const, icon: BookOpen },
    { id: 'games' as const, icon: Gamepad2 },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Left Sidebar */}
      <aside className="w-16 md:w-48 border-r border-border bg-muted/30 flex flex-col py-4 px-2 md:px-3 shrink-0">
        <h1 className="hidden md:block text-lg font-semibold px-2 mb-4">{t('wellnessTools')}</h1>
        <nav className="flex flex-col gap-1">
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">{TAB_LABELS[id][lang]}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'breathing' && (
          <Card><CardContent className="p-6 flex flex-col items-center">
            <h2 className="text-lg font-medium mb-4">{TAB_LABELS.breathing[lang]} (4-7-8)</h2>
            <div className={cn('w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-4', breathingActive && 'animate-breathe')}>
              <span className="text-lg font-medium text-primary">{breathingActive ? t(breathPhase) : '4-7-8'}</span>
            </div>
            <Button onClick={breathingActive ? stopBreathing : startBreathing}>
              {breathingActive ? <><Pause className="h-4 w-4 mr-2" />{t('stopBreathing')}</> : <><Play className="h-4 w-4 mr-2" />{t('startBreathing')}</>}
            </Button>
          </CardContent></Card>
        )}

        {activeTab === 'grounding' && (
          <Card><CardContent className="p-6">
            <h2 className="text-lg font-medium mb-4">{TAB_LABELS.grounding[lang]} (5-4-3-2-1)</h2>
            <div className="space-y-4">
              {GROUNDING_STEPS[lang].map((step, i) => (
                <div key={i} className={cn('p-3 rounded-lg transition-all', i === groundingStep ? 'bg-primary text-primary-foreground' : i < groundingStep ? 'bg-success/20' : 'bg-muted')}>
                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGroundingStep(Math.max(0, groundingStep - 1))} disabled={groundingStep === 0}>Back</Button>
                <Button onClick={() => setGroundingStep(Math.min(4, groundingStep + 1))} disabled={groundingStep === 4}>Next</Button>
              </div>
            </div>
          </CardContent></Card>
        )}

        {activeTab === 'sounds' && (
          <Card><CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-medium mb-2">{TAB_LABELS.sounds[lang]}</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['rain', 'forest', 'brown', 'campfire'] as const).map((type) => (
                <Button key={type} variant={playingSound === type ? 'default' : 'outline'} className="flex-1" onClick={() => toggleSound(type)}>
                  {playingSound === type ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                  {type === 'brown' ? t('brownNoise') : type === 'campfire' ? (lang === 'hi' ? 'कैम्पफ़ायर' : 'Campfire') : t(type)}
                </Button>
              ))}
            </div>
            {playingSound === 'campfire' && (
              <p className="text-xs text-muted-foreground text-center">
                {lang === 'hi' ? 'बारिश • आग • गड़गड़ाहट • उल्लू • हवा • विनाइल' : 'Rain • Fire • Thunder • Owl • Wind • Vinyl'}
              </p>
            )}
            {playingSound && <Slider value={[volume]} onValueChange={([v]) => { setVolume(v); audioService.setVolume(v); }} max={1} step={0.1} />}
          </CardContent></Card>
        )}

        {activeTab === 'journal' && (
          <Card><CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-medium mb-2">{TAB_LABELS.journal[lang]}</h2>
            <div className="p-3 bg-muted rounded-lg"><p className="text-sm italic">"{currentPrompt}"</p></div>
            <Textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder={t('writeHere')} rows={6} />
            <Button onClick={saveJournal} disabled={!journalText.trim()} className="w-full">{t('save')}</Button>
          </CardContent></Card>
        )}

        {activeTab === 'games' && (
          <div>
            <h2 className="text-lg font-medium mb-4">{TAB_LABELS.games[lang]}</h2>
            <MentalWellnessGames />
          </div>
        )}
      </main>
    </div>
  );
}
