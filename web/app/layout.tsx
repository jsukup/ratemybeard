import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { AdProvider } from '@/components/AdScriptSimple';
import AdControlPanel from '@/components/AdControlPanel';

const inter = Inter({ subsets: ['latin'] });

// Set this to false to enable real ads
const TEST_ADS = false;

export const metadata: Metadata = {
  title: 'RateMyBeard - GET WEIRD...with YOUR BEARD!',
  description: 'Upload photos of beards and get rated by the community! Join our leaderboard and see how you rank.',
  keywords: ['beard', 'rating', 'attractiveness', 'community', 'leaderboard', 'photo', 'rating', 'facial hair', 'beard pics'],
  authors: [{ name: 'RateMyBeard Team' }],
  verification: {
    // Add your Google site verification here once you get it from Google AdSense
    google: 'google-site-verification=YOUR_VERIFICATION_CODE',
  },
};

// Separate viewport export as per Next.js recommendation
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// This helps suppress hydration warnings when there's a mismatch between server and client HTML
// It uses suppressHydrationWarning prop on the html element
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        
        {/* Google AdSense */}
        <Script
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8459009337119987"
          crossOrigin="anonymous"
        />
        
        {/* Canvas Confetti library */}
        <Script
          id="canvas-confetti"
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"
          strategy="beforeInteractive"
        />
        
        {/* Adcash ads are loaded dynamically by the AdContainer components */}
        
        {/* Google Analytics */}
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-RL6TWY65QC`}
        />
        <Script
          id="google-analytics-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RL6TWY65QC', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} colorful-bg`}>
        <div className="flex flex-col min-h-screen">
          <AdProvider>
            <div className="page-animation flex-grow flex flex-col">
              {children}
            </div>
            <AdControlPanel />
          </AdProvider>
        </div>
        
        {/* Firework elements with absolute positioning */}
        <div className="firework absolute" style={{ '--x': '10vw', '--y': '-80vh', '--initialY': '105vh' } as React.CSSProperties}></div>
        <div className="firework absolute" style={{ '--x': '-10vw', '--y': '-85vh', '--initialY': '110vh', animationDelay: '0.25s' } as React.CSSProperties}></div>
        <div className="firework absolute" style={{ '--x': '0vw', '--y': '-90vh', '--initialY': '115vh', animationDelay: '0.4s' } as React.CSSProperties}></div>
        <div className="firework absolute" style={{ '--x': '15vw', '--y': '-75vh', '--initialY': '100vh', animationDelay: '0.6s' } as React.CSSProperties}></div>
        <div className="firework absolute" style={{ '--x': '-15vw', '--y': '-82vh', '--initialY': '108vh', animationDelay: '0.8s' } as React.CSSProperties}></div>
        <div className="firework absolute" style={{ '--x': '5vw', '--y': '-88vh', '--initialY': '112vh', animationDelay: '1s' } as React.CSSProperties}></div>
        
        {/* Script to set correct viewport height for mobile browsers */}
        <Script id="viewport-height-fix" strategy="afterInteractive">
          {`
            // First we get the viewport height and we multiply it by 1% to get a value for a vh unit
            let vh = window.innerHeight * 0.01;
            // Then we set the value in the --vh custom property to the root of the document
            document.documentElement.style.setProperty('--vh', \`\${vh}px\`);
            
            // We listen to the resize event
            window.addEventListener('resize', () => {
              // We execute the same script as before
              let vh = window.innerHeight * 0.01;
              document.documentElement.style.setProperty('--vh', \`\${vh}px\`);
            });
          `}
        </Script>
        
        {/* Confetti and fireworks animation script for first visit */}
        <Script id="confetti-animation" strategy="afterInteractive">
          {`
            // Check if this is the first visit
            const hasVisited = localStorage.getItem('hasVisitedRateMyBeard');
            
            // Function to trigger confetti
            function triggerConfetti() {
              if (typeof confetti !== 'undefined') {
                // Trigger confetti from the bottom
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 1 }
                });
                
                // Trigger confetti from the left side
                setTimeout(() => {
                  confetti({
                    particleCount: 80,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.5 }
                  });
                }, 500);
                
                // Trigger confetti from the right side
                setTimeout(() => {
                  confetti({
                    particleCount: 80,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.5 }
                  });
                }, 800);
                
                // Add the firework animation class to make them visible
                document.querySelectorAll('.firework').forEach(fw => {
                  fw.classList.add('active');
                });
                
                // Set the flag in localStorage
                localStorage.setItem('hasVisitedRateMyBeard', 'true');
                
                // Create a fireworks effect with confetti
                setTimeout(() => {
                  const duration = 5 * 1000;
                  const animationEnd = Date.now() + duration;
                  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
                  
                  function randomInRange(min, max) {
                    return Math.random() * (max - min) + min;
                  }
                  
                  const interval = setInterval(function() {
                    const timeLeft = animationEnd - Date.now();
                    
                    if (timeLeft <= 0) {
                      return clearInterval(interval);
                    }
                    
                    const particleCount = 50 * (timeLeft / duration);
                    
                    // since particles fall down, start a bit higher than random
                    confetti(Object.assign({}, defaults, { 
                      particleCount, 
                      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
                    }));
                    confetti(Object.assign({}, defaults, { 
                      particleCount, 
                      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
                    }));
                  }, 250);
                }, 1500);
                
                // Remove the animation class after the animation completes
                setTimeout(() => {
                  document.querySelectorAll('.firework').forEach(fw => {
                    fw.classList.remove('active');
                  });
                }, 8000);
              }
            }
            
            // Always trigger the animation for better user experience
            setTimeout(triggerConfetti, 1500);
          `}
        </Script>
      </body>
    </html>
  );
}
