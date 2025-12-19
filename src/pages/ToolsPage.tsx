import { useState, useEffect, useRef } from 'react';
import { Wind, Eye, Volume2, BookOpen, Play, Pause, VolumeX, Gamepad2, Check, RotateCcw, Timer, Waves, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { audioService } from '@/services/audioService';
import { referralService } from '@/services/referralService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MentalWellnessGames } from '@/components/games/MentalWellnessGames';
import { Language } from '@/types';

const JOURNAL_PROMPTS: Record<Language, string[]> = {
  en: ['What are you grateful for today?', 'What made you smile recently?', 'What challenge are you facing?', 'Describe your ideal peaceful moment.'],
  hi: ['आज आप किस बात के लिए आभारी हैं?', 'हाल ही में किस बात ने आपको मुस्कुराया?', 'आप किस चुनौती का सामना कर रहे हैं?', 'अपने आदर्श शांतिपूर्ण क्षण का वर्णन करें।'],
  es: ['¿Por qué estás agradecido hoy?', '¿Qué te hizo sonreír recientemente?', '¿Qué desafío enfrentas?', 'Describe tu momento de paz ideal.'],
  fr: ['Pour quoi êtes-vous reconnaissant aujourd\'hui?', 'Qu\'est-ce qui vous a fait sourire récemment?', 'Quel défi affrontez-vous?', 'Décrivez votre moment de paix idéal.'],
  de: ['Wofür sind Sie heute dankbar?', 'Was hat Sie kürzlich zum Lächeln gebracht?', 'Welche Herausforderung stehen Sie gegenüber?', 'Beschreiben Sie Ihren idealen friedlichen Moment.'],
  pt: ['Pelo que você é grato hoje?', 'O que te fez sorrir recentemente?', 'Qual desafio você está enfrentando?', 'Descreva seu momento de paz ideal.'],
  zh: ['今天你感激什么？', '最近什么让你微笑了？', '你面临什么挑战？', '描述你理想的平静时刻。'],
  ja: ['今日感謝していることは？', '最近何があなたを笑顔にしましたか？', 'どんな課題に直面していますか？', '理想の平和な瞬間を描写してください。'],
};

const GROUNDING_STEPS: Record<Language, { prompt: string; count: number; icon: string }[]> = {
  en: [
    { prompt: 'things you can SEE', count: 5, icon: '👁️' },
    { prompt: 'things you can TOUCH', count: 4, icon: '✋' },
    { prompt: 'things you can HEAR', count: 3, icon: '👂' },
    { prompt: 'things you can SMELL', count: 2, icon: '👃' },
    { prompt: 'thing you can TASTE', count: 1, icon: '👅' },
  ],
  hi: [
    { prompt: 'चीज़ें जो आप देख सकते हैं', count: 5, icon: '👁️' },
    { prompt: 'चीज़ें जो आप छू सकते हैं', count: 4, icon: '✋' },
    { prompt: 'चीज़ें जो आप सुन सकते हैं', count: 3, icon: '👂' },
    { prompt: 'चीज़ें जो आप सूंघ सकते हैं', count: 2, icon: '👃' },
    { prompt: 'चीज़ जो आप चख सकते हैं', count: 1, icon: '👅' },
  ],
  es: [
    { prompt: 'cosas que puedes VER', count: 5, icon: '👁️' },
    { prompt: 'cosas que puedes TOCAR', count: 4, icon: '✋' },
    { prompt: 'cosas que puedes ESCUCHAR', count: 3, icon: '👂' },
    { prompt: 'cosas que puedes OLER', count: 2, icon: '👃' },
    { prompt: 'cosa que puedes SABOREAR', count: 1, icon: '👅' },
  ],
  fr: [
    { prompt: 'choses que vous pouvez VOIR', count: 5, icon: '👁️' },
    { prompt: 'choses que vous pouvez TOUCHER', count: 4, icon: '✋' },
    { prompt: 'choses que vous pouvez ENTENDRE', count: 3, icon: '👂' },
    { prompt: 'choses que vous pouvez SENTIR', count: 2, icon: '👃' },
    { prompt: 'chose que vous pouvez GOÛTER', count: 1, icon: '👅' },
  ],
  de: [
    { prompt: 'Dinge, die Sie SEHEN können', count: 5, icon: '👁️' },
    { prompt: 'Dinge, die Sie BERÜHREN können', count: 4, icon: '✋' },
    { prompt: 'Dinge, die Sie HÖREN können', count: 3, icon: '👂' },
    { prompt: 'Dinge, die Sie RIECHEN können', count: 2, icon: '👃' },
    { prompt: 'Ding, das Sie SCHMECKEN können', count: 1, icon: '👅' },
  ],
  pt: [
    { prompt: 'coisas que você pode VER', count: 5, icon: '👁️' },
    { prompt: 'coisas que você pode TOCAR', count: 4, icon: '✋' },
    { prompt: 'coisas que você pode OUVIR', count: 3, icon: '👂' },
    { prompt: 'coisas que você pode CHEIRAR', count: 2, icon: '👃' },
    { prompt: 'coisa que você pode PROVAR', count: 1, icon: '👅' },
  ],
  zh: [
    { prompt: '你能看到的东西', count: 5, icon: '👁️' },
    { prompt: '你能触摸的东西', count: 4, icon: '✋' },
    { prompt: '你能听到的声音', count: 3, icon: '👂' },
    { prompt: '你能闻到的气味', count: 2, icon: '👃' },
    { prompt: '你能尝到的味道', count: 1, icon: '👅' },
  ],
  ja: [
    { prompt: '見えるもの', count: 5, icon: '👁️' },
    { prompt: '触れるもの', count: 4, icon: '✋' },
    { prompt: '聞こえるもの', count: 3, icon: '👂' },
    { prompt: '匂うもの', count: 2, icon: '👃' },
    { prompt: '味わえるもの', count: 1, icon: '👅' },
  ],
};

interface ToolsPageProps {
  onShowPremium?: () => void;
}

export function ToolsPage({ onShowPremium }: ToolsPageProps) {
  const { profile, addJournal, isPremium } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation(profile.language);
  const { toast } = useToast();
  const breathingCycleRef = useRef<number>(0);
  const exerciseCompletedRef = useRef<boolean>(false);
  
  const lang = profile.language;
  
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'sounds' | 'journal' | 'games'>('breathing');
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingInputs, setGroundingInputs] = useState<string[][]>([[], [], [], [], []]);
  const [currentInput, setCurrentInput] = useState('');
  const [groundingComplete, setGroundingComplete] = useState(false);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [journalText, setJournalText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(JOURNAL_PROMPTS[lang]?.[0] || JOURNAL_PROMPTS.en[0]);

  // Update prompt when language changes
  useEffect(() => {
    const prompts = JOURNAL_PROMPTS[lang] || JOURNAL_PROMPTS.en;
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, [lang]);

  // Track and reward first exercise completion
  const handleExerciseComplete = async () => {
    if (exerciseCompletedRef.current || !user) return;
    exerciseCompletedRef.current = true;
    
    try {
      await referralService.completeReferralAfterExercise(user.id);
    } catch (error) {
      console.error('Error completing referral:', error);
    }
  };

  const startBreathing = () => {
    setBreathingActive(true);
    breathingCycleRef.current = 0;
    let phase: 'inhale' | 'hold' | 'exhale' = 'inhale';
    const cycle = () => {
      if (phase === 'inhale') { 
        setBreathPhase('inhale'); 
        setTimeout(() => { phase = 'hold'; cycle(); }, 4000); 
      }
      else if (phase === 'hold') { 
        setBreathPhase('hold'); 
        setTimeout(() => { phase = 'exhale'; cycle(); }, 7000); 
      }
      else { 
        setBreathPhase('exhale');
        breathingCycleRef.current++;
        // After 3 full cycles (about 1 minute), count as exercise completed
        if (breathingCycleRef.current >= 3) {
          handleExerciseComplete();
        }
        setTimeout(() => { phase = 'inhale'; cycle(); }, 8000); 
      }
    };
    cycle();
  };

  const stopBreathing = () => setBreathingActive(false);

  const premiumSounds = ['sleep', 'ocean'] as const;
  
  const toggleSound = async (type: 'rain' | 'forest' | 'brown' | 'campfire' | 'sleep' | 'ocean') => {
    // Check if sound is premium-only
    if (premiumSounds.includes(type as any) && !isPremium) {
      onShowPremium?.();
      return;
    }
    
    if (playingSound === type) { 
      audioService.stopNoise(); 
      setPlayingSound(null);
      setSleepTimer(null);
    } else { 
      await audioService.playNoise(type, volume); 
      setPlayingSound(type);
    }
  };

  const handleSleepTimer = (minutes: number) => {
    if (sleepTimer === minutes) {
      audioService.clearSleepTimer();
      setSleepTimer(null);
    } else {
      audioService.setSleepTimer(minutes);
      setSleepTimer(minutes);
    }
  };

  const saveJournal = () => {
    if (!journalText.trim()) return;
    addJournal(currentPrompt, journalText);
    toast({ title: t('save') + '!' });
    setJournalText('');
    const prompts = JOURNAL_PROMPTS[lang] || JOURNAL_PROMPTS.en;
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  const addGroundingItem = () => {
    if (!currentInput.trim()) return;
    const steps = GROUNDING_STEPS[lang] || GROUNDING_STEPS.en;
    const currentStep = steps[groundingStep];
    if (groundingInputs[groundingStep].length < currentStep.count) {
      const newInputs = [...groundingInputs];
      newInputs[groundingStep] = [...newInputs[groundingStep], currentInput.trim()];
      setGroundingInputs(newInputs);
      setCurrentInput('');
      
      // Auto advance if step is complete
      if (newInputs[groundingStep].length === currentStep.count && groundingStep < 4) {
        setTimeout(() => setGroundingStep(groundingStep + 1), 500);
      } else if (newInputs[groundingStep].length === currentStep.count && groundingStep === 4) {
        setGroundingComplete(true);
      }
    }
  };

  const resetGrounding = () => {
    setGroundingStep(0);
    setGroundingInputs([[], [], [], [], []]);
    setCurrentInput('');
    setGroundingComplete(false);
  };

  const tabs = [
    { id: 'breathing' as const, icon: Wind },
    { id: 'grounding' as const, icon: Eye },
    { id: 'sounds' as const, icon: Volume2 },
    { id: 'journal' as const, icon: BookOpen },
    { id: 'games' as const, icon: Gamepad2 },
  ];

  const steps = GROUNDING_STEPS[lang] || GROUNDING_STEPS.en;
  const currentStepData = steps[groundingStep];

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
              <span className="hidden md:inline">{t(id)}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'breathing' && (
          <Card><CardContent className="p-6 flex flex-col items-center">
            <h2 className="text-lg font-medium mb-4">{t('breathing')} (4-7-8)</h2>
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
            <h2 className="text-lg font-medium mb-4">{t('grounding')} (5-4-3-2-1)</h2>
            
            {groundingComplete ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-xl font-medium text-green-600">{t('complete')}</p>
                <p className="text-muted-foreground text-sm">
                  {lang === 'hi' ? 'आपने सभी 5 इंद्रियों के साथ जुड़ गए हैं।' : 
                   lang === 'es' ? 'Te has conectado con tus 5 sentidos.' :
                   lang === 'fr' ? 'Vous êtes connecté à vos 5 sens.' :
                   lang === 'de' ? 'Sie haben sich mit Ihren 5 Sinnen verbunden.' :
                   lang === 'pt' ? 'Você se conectou com seus 5 sentidos.' :
                   lang === 'zh' ? '你已经与你的5种感官连接。' :
                   lang === 'ja' ? '5つの感覚とつながりました。' :
                   'You\'ve connected with all 5 senses.'}
                </p>
                <Button onClick={resetGrounding} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />{t('restart')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress indicator */}
                <div className="flex justify-center gap-2 mb-6">
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all',
                        i < groundingStep ? 'bg-green-500/20 text-green-600' :
                        i === groundingStep ? 'bg-primary text-primary-foreground scale-110' :
                        'bg-muted text-muted-foreground'
                      )}
                    >
                      {i < groundingStep ? <Check className="h-5 w-5" /> : step.count}
                    </div>
                  ))}
                </div>

                {/* Current step */}
                <div className="text-center p-6 bg-primary/10 rounded-xl">
                  <span className="text-4xl mb-2 block">{currentStepData.icon}</span>
                  <p className="text-xl font-medium">
                    {currentStepData.count} {currentStepData.prompt}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {groundingInputs[groundingStep].length} / {currentStepData.count}
                  </p>
                </div>

                {/* Input area */}
                <div className="flex gap-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addGroundingItem()}
                    placeholder={t('enterItems')}
                    className="flex-1"
                  />
                  <Button onClick={addGroundingItem} disabled={!currentInput.trim()}>
                    {t('next')}
                  </Button>
                </div>

                {/* Items entered */}
                {groundingInputs[groundingStep].length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {groundingInputs[groundingStep].map((item, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm animate-in fade-in slide-in-from-bottom-2"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setGroundingStep(Math.max(0, groundingStep - 1))} 
                    disabled={groundingStep === 0}
                  >
                    {t('back')}
                  </Button>
                  <Button 
                    onClick={() => {
                      if (groundingStep < 4) setGroundingStep(groundingStep + 1);
                      else setGroundingComplete(true);
                    }}
                    disabled={groundingInputs[groundingStep].length === 0}
                    className="flex-1"
                  >
                    {groundingStep === 4 ? t('complete') : t('next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent></Card>
        )}

        {activeTab === 'sounds' && (
          <Card><CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-medium mb-2">{t('sounds')}</h2>
            
            {/* Featured sounds (Premium) */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={playingSound === 'sleep' ? 'default' : 'secondary'} 
                className="h-16 flex-col relative"
                onClick={() => toggleSound('sleep')}
              >
                {!isPremium && <Lock className="h-3 w-3 absolute top-1 right-1 text-amber-500" />}
                {playingSound === 'sleep' ? <VolumeX className="h-5 w-5 mb-1" /> : <Volume2 className="h-5 w-5 mb-1" />}
                <span className="text-xs">{t('sleepMix')}</span>
              </Button>
              <Button 
                variant={playingSound === 'ocean' ? 'default' : 'secondary'} 
                className="h-16 flex-col relative"
                onClick={() => toggleSound('ocean')}
              >
                {!isPremium && <Lock className="h-3 w-3 absolute top-1 right-1 text-amber-500" />}
                {playingSound === 'ocean' ? <VolumeX className="h-5 w-5 mb-1" /> : <Waves className="h-5 w-5 mb-1" />}
                <span className="text-xs">{t('ocean')}</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {(['rain', 'forest', 'brown', 'campfire'] as const).map((type) => (
                <Button key={type} variant={playingSound === type ? 'default' : 'outline'} className="flex-1" onClick={() => toggleSound(type)}>
                  {playingSound === type ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                  {type === 'brown' ? t('brownNoise') : t(type as 'rain' | 'forest' | 'campfire')}
                </Button>
              ))}
            </div>
            
            {playingSound && (
              <div className="space-y-3">
                <Slider value={[volume]} onValueChange={([v]) => { setVolume(v); audioService.setVolume(v); }} max={1} step={0.1} />
                
                {/* Sleep Timer */}
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sleep timer:</span>
                  <div className="flex gap-1 flex-1">
                    {[15, 30, 60].map((mins) => (
                      <Button
                        key={mins}
                        variant={sleepTimer === mins ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleSleepTimer(mins)}
                      >
                        {mins}m
                      </Button>
                    ))}
                  </div>
                </div>
                {sleepTimer && (
                  <p className="text-xs text-center text-muted-foreground">
                    Sound will fade out in {sleepTimer} minutes
                  </p>
                )}
                
                {playingSound === 'sleep' && (
                  <p className="text-xs text-muted-foreground text-center">
                    🎧 Use headphones for binaural beats effect
                  </p>
                )}
              </div>
            )}
          </CardContent></Card>
        )}

        {activeTab === 'journal' && (
          <Card><CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-medium mb-2">{t('journal')}</h2>
            <div className="p-3 bg-muted rounded-lg"><p className="text-sm italic">"{currentPrompt}"</p></div>
            <Textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder={t('writeHere')} rows={6} />
            <Button onClick={saveJournal} disabled={!journalText.trim()} className="w-full">{t('save')}</Button>
          </CardContent></Card>
        )}

        {activeTab === 'games' && (
          <div>
            <h2 className="text-lg font-medium mb-4">{t('games')}</h2>
            <MentalWellnessGames onShowPremium={onShowPremium} />
          </div>
        )}
      </main>
    </div>
  );
}
