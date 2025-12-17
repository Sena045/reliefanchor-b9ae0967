import { useState, useMemo } from 'react';
import { Smile, Meh, Frown, AlertCircle, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MoodType } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const moodConfig: Record<MoodType, { icon: typeof Smile; color: string; value: number }> = {
  happy: { icon: Smile, color: 'text-mood-happy', value: 5 },
  calm: { icon: Meh, color: 'text-mood-calm', value: 4 },
  sad: { icon: Frown, color: 'text-mood-sad', value: 2 },
  anxious: { icon: AlertCircle, color: 'text-mood-anxious', value: 3 },
  angry: { icon: Flame, color: 'text-mood-angry', value: 1 },
};

const moodKeys: MoodType[] = ['happy', 'calm', 'sad', 'anxious', 'angry'];

export function MoodPage() {
  const { profile, addMood, getMoods } = useApp();
  const { t } = useTranslation(profile.language);
  const { toast } = useToast();
  
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState('');
  const [viewDays, setViewDays] = useState<7 | 30>(7);
  
  const moods = getMoods(viewDays);
  
  const chartData = useMemo(() => {
    const days: Record<string, { total: number; count: number }> = {};
    
    moods.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (!days[date]) {
        days[date] = { total: 0, count: 0 };
      }
      days[date].total += moodConfig[entry.mood].value;
      days[date].count += 1;
    });
    
    return Object.entries(days)
      .map(([date, { total, count }]) => ({
        date,
        mood: Math.round((total / count) * 10) / 10,
      }))
      .reverse();
  }, [moods]);

  const handleLogMood = () => {
    if (!selectedMood) return;
    
    addMood(selectedMood, note);
    toast({
      title: profile.language === 'hi' ? 'मूड लॉग किया!' : 'Mood logged!',
      description: profile.language === 'hi' 
        ? 'आपका मूड सहेज लिया गया है।' 
        : 'Your mood has been saved.',
    });
    setSelectedMood(null);
    setNote('');
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto safe-top">
      <div className="pt-4">
        <h1 className="text-xl font-semibold">{t('howAreYou')}</h1>
      </div>

      {/* Mood Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between gap-2">
            {moodKeys.map((mood) => {
              const { icon: Icon, color } = moodConfig[mood];
              const isSelected = selectedMood === mood;
              
              return (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg flex-1 transition-all tap-highlight-none',
                    isSelected 
                      ? 'bg-primary/10 ring-2 ring-primary' 
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className={cn('h-8 w-8', color)} />
                  <span className="text-xs font-medium">{t(mood)}</span>
                </button>
              );
            })}
          </div>
          
          {selectedMood && (
            <div className="mt-4 space-y-3 animate-fade-in-up">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('addNote')}
                className="resize-none"
                rows={3}
              />
              <Button onClick={handleLogMood} className="w-full">
                {t('logMood')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood History Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('moodHistory')}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewDays === 7 ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewDays(7)}
              >
                {t('last7Days')}
              </Button>
              <Button
                variant={viewDays === 30 ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewDays(30)}
              >
                {t('last30Days')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={20}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {profile.language === 'hi' 
                ? 'अभी तक कोई मूड लॉग नहीं किया।' 
                : 'No moods logged yet.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Moods */}
      {moods.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {profile.language === 'hi' ? 'हाल की प्रविष्टियाँ' : 'Recent Entries'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {moods.slice(0, 5).map((entry) => {
              const { icon: Icon, color } = moodConfig[entry.mood];
              return (
                <div 
                  key={entry.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <Icon className={cn('h-5 w-5', color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{t(entry.mood)}</p>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground truncate">{entry.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
