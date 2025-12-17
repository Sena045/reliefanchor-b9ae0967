import { useState, useEffect } from 'react';
import { ArrowLeft, Brain, TrendingUp, Calendar, Sparkles, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface MoodInsightsProps {
  onClose: () => void;
  onUpgrade: () => void;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  anxious: '😰',
  angry: '😠',
};

const MOOD_COLORS: Record<string, string> = {
  happy: 'bg-yellow-500',
  calm: 'bg-blue-400',
  sad: 'bg-indigo-500',
  anxious: 'bg-orange-500',
  angry: 'bg-red-500',
};

export function MoodInsights({ onClose, onUpgrade }: MoodInsightsProps) {
  const { profile, isPremium, moods } = useApp();
  const { t } = useTranslation(profile.language);
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeklyMoods = moods.filter(m => 
    m.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  const moodCounts = weeklyMoods.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalMoods = weeklyMoods.length;
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const generateInsights = async () => {
    if (!isPremium) {
      onUpgrade();
      return;
    }

    if (weeklyMoods.length < 3) {
      setError('Need at least 3 mood entries this week to generate insights.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const moodData = weeklyMoods.map(m => ({
        mood: m.mood,
        note: m.note,
        date: new Date(m.timestamp).toLocaleDateString(),
      }));

      const { data, error: fnError } = await supabase.functions.invoke('mood-insights', {
        body: { moods: moodData, language: profile.language }
      });

      if (fnError) throw fnError;
      setInsights(data.insights);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium && weeklyMoods.length >= 3 && !insights) {
      generateInsights();
    }
  }, [isPremium]);

  return (
    <div className="min-h-screen bg-background p-4 safe-top">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={onClose} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Weekly Mood Insights</h1>
            <p className="text-sm text-muted-foreground">AI-powered analysis of your emotional patterns</p>
          </div>

          {/* Weekly Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This Week's Moods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalMoods === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No moods logged this week. Start tracking to get insights!
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center gap-2">
                    {Object.entries(moodCounts).map(([mood, count]) => (
                      <div key={mood} className="text-center">
                        <div className="text-2xl">{MOOD_EMOJIS[mood]}</div>
                        <div className="text-xs text-muted-foreground">{count}x</div>
                      </div>
                    ))}
                  </div>
                  
                  {dominantMood && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        Dominant mood: <span className="font-medium">{t(dominantMood as any)}</span>
                      </span>
                    </div>
                  )}

                  {/* Mood bar */}
                  <div className="h-3 rounded-full overflow-hidden flex">
                    {Object.entries(moodCounts).map(([mood, count]) => (
                      <div
                        key={mood}
                        className={`${MOOD_COLORS[mood]} transition-all`}
                        style={{ width: `${(count / totalMoods) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className={!isPremium ? 'border-amber-500/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                AI Analysis
                {!isPremium && (
                  <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded ml-auto">
                    Premium
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isPremium ? (
                <div className="text-center py-6 space-y-3">
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Unlock AI-powered insights to understand your emotional patterns better.
                  </p>
                  <Button onClick={onUpgrade}>
                    Upgrade to Premium
                  </Button>
                </div>
              ) : loading ? (
                <div className="text-center py-6">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Analyzing your moods...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={generateInsights}>
                    Try Again
                  </Button>
                </div>
              ) : insights ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insights}</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button onClick={generateInsights} disabled={weeklyMoods.length < 3}>
                    Generate Insights
                  </Button>
                  {weeklyMoods.length < 3 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Log at least 3 moods this week to get insights
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}