import { Users, Star, Shield } from 'lucide-react';

export function SocialProof() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 py-4 text-sm">
      <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
        <Users className="h-4 w-4 text-primary" />
        <span className="font-medium">1,000+ users</span>
      </div>
      
      <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          ))}
        </div>
        <span className="font-medium">4.8/5</span>
      </div>
      
      <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
        <Shield className="h-4 w-4 text-green-600" />
        <span className="font-medium">100% Private</span>
      </div>
    </div>
  );
}