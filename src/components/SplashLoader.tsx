export function SplashLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {/* Inline SVG heart icon for instant display without network request */}
      <div className="w-24 h-24 flex items-center justify-center animate-pulse">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="w-16 h-16 text-primary"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" 
          />
        </svg>
      </div>
      <p className="mt-4 text-muted-foreground text-sm animate-pulse">Loading...</p>
    </div>
  );
}
