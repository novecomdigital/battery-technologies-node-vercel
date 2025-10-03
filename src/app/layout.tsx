import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import OfflineInitializer from '@/components/OfflineInitializer';
import OfflineNavigationWrapper from '@/components/OfflineNavigationWrapper';
import OfflineNavigationGuard from '@/components/OfflineNavigationGuard';
import MobileInstallPrompt from '@/components/MobileInstallPrompt';
import MobileUsageGuide from '@/components/MobileUsageGuide';
import Navigation from '@/components/Navigation';
import UpdateNotification from '@/components/UpdateNotification';
import ZoomPrevention from '@/components/ZoomPrevention';
import ReplayQueueProvider from '@/components/ReplayQueueProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Battery Technologies",
  description: "Battery service management for engineers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Battery Technologies",
  },
  icons: {
    icon: [
      { url: "/icon-36x36.png", sizes: "36x36", type: "image/png" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5DA148",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  // If no publishable key is available (e.g., during build), render without Clerk
  if (!publishableKey) {
    return (
      <html lang="en">
        <head>
          <link
            href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
            rel="stylesheet"
          />
          <script
            src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
            async
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Required</h1>
              <p className="text-gray-600">
                Please set up your environment variables to run this application.
              </p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
      }}
    >
      <html lang="en">
        <head>
          {/* Apple-specific meta tags for iOS */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Battery Technologies" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
          
          {/* iOS splash screen and pull-to-refresh meta tags */}
          <meta name="theme-color" content="#5DA148" id="theme-color-meta" />
          <meta name="msapplication-navbutton-color" content="#5DA148" />
          
          {/* Dynamic theme color and PWA background script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Fix Clerk cookie domain issues for local network
                if (window.location.hostname.includes('192.168.') || window.location.hostname.includes('10.') || window.location.hostname.includes('172.')) {
                  // Override document.cookie to handle local network domains
                  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
                  if (originalCookieDescriptor) {
                    Object.defineProperty(document, 'cookie', {
                      get: originalCookieDescriptor.get,
                      set: function(value) {
                        // Allow all cookies for local network
                        return originalCookieDescriptor.set.call(this, value);
                      },
                      configurable: true
                    });
                  }
                }
                
                function isPhotoViewMode() {
                  // Check if we're in photo view by looking for photo modal elements
                  return document.querySelector('.fixed.inset-0.z-50') !== null ||
                         document.querySelector('.portrait-view') !== null ||
                         document.querySelector('.landscape-view') !== null;
                }
                
                function updatePWATheme() {
                  const isPhotoView = isPhotoViewMode();
                  const isLandscape = window.matchMedia('(orientation: landscape)').matches;
                  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
                  
                  if (!isPWA) return;
                  
                  const html = document.documentElement;
                  const themeColorMeta = document.getElementById('theme-color-meta');
                  
                  if (isPhotoView) {
                    // Photo view mode - all black
                    html.classList.add('photo-view-mode');
                    if (themeColorMeta) themeColorMeta.setAttribute('content', '#000000');
                  } else {
                    // Normal browsing mode
                    html.classList.remove('photo-view-mode');
                    
                    if (isLandscape) {
                      // Landscape - all white
                      if (themeColorMeta) themeColorMeta.setAttribute('content', '#ffffff');
                    } else {
                      // Portrait - green top
                      if (themeColorMeta) themeColorMeta.setAttribute('content', '#5DA148');
                    }
                  }
                }
                
                // Make function globally accessible
                window.updatePWATheme = updatePWATheme;
                
                // Update on load and orientation change
                updatePWATheme();
                window.addEventListener('orientationchange', updatePWATheme);
                window.addEventListener('resize', updatePWATheme);
                
                // Watch for photo modal changes
                const observer = new MutationObserver(updatePWATheme);
                if (document.body) {
                  observer.observe(document.body, { 
                    childList: true, 
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
                  });
                }
              `
            }}
          />
          
          {/* Android-specific meta tags */}
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="Battery Technologies" />
          
          {/* General PWA meta tags */}
          <meta name="msapplication-TileColor" content="#5DA148" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          
          <link
            href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
            rel="stylesheet"
          />
          <script
            src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
            async
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ReplayQueueProvider />
          <Navigation />
          <OfflineNavigationWrapper />
          <OfflineNavigationGuard />
          {children}
          <OfflineInitializer />
          <MobileInstallPrompt />
          <MobileUsageGuide />
          <UpdateNotification />
          <ZoomPrevention />
        </body>
      </html>
    </ClerkProvider>
  );
}
