export function SplashLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <img 
        src="/favicon.png" 
        alt="ReliefAnchor" 
        className="w-24 h-24 animate-pulse"
      />
      <p className="mt-4 text-muted-foreground text-sm animate-pulse">Loading...</p>
    </div>
  );
}
