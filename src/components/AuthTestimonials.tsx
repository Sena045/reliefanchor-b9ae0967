import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  { text: "Anya helped me through my worst anxiety in months. It felt like talking to a real friend.", name: "Sarah K.", mood: "😌" },
  { text: "I use the breathing exercises every morning. My stress levels have dropped noticeably.", name: "Raj M.", mood: "🧘" },
  { text: "Finally a mental health app that doesn't feel clinical. It's warm and actually helpful.", name: "Emily T.", mood: "💛" },
  { text: "The mood tracking helped me see patterns I never noticed. Game-changer for my therapy sessions.", name: "Alex P.", mood: "📊" },
  { text: "I was skeptical about AI therapy but Anya genuinely listens. Worth every minute.", name: "Priya D.", mood: "✨" },
];

export function AuthTestimonials() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % testimonials.length);
        setFade(true);
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const t = testimonials[current];

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div
        className={`p-4 rounded-xl bg-card border border-border shadow-sm transition-opacity duration-300 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          ))}
        </div>
        <p className="text-sm text-foreground/90 italic leading-relaxed">"{t.text}"</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-medium text-muted-foreground">— {t.name}</span>
          <span className="text-lg">{t.mood}</span>
        </div>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {testimonials.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === current ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
