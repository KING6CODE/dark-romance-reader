import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: "Tu n'étais pas censé me sauver — Roman par chapitres",
  description:
    'Une romance sombre et obsessionnelle, chapitre après chapitre. Lisez le premier chapitre gratuitement.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        {/*
          Pas de <link rel="preload"> pour la police "serif" : c'est une
          stack système (Georgia, Cambria, Times New Roman — voir
          tailwind.config.js), aucun fichier n'est téléchargé, donc rien
          à précharger. Idem pour "sans" (Helvetica/Arial). Si un jour
          vous passez à une police web (Google Fonts ou fichier local),
          utilisez next/font/google ou next/font/local plutôt qu'un
          <link rel="preload"> manuel : Next.js génère alors le preload
          correct automatiquement et évite le FOUT/layout shift.
        */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />

        {/* Google Ads */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18003821360"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18003821360');
          `}
        </Script>

        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xj6l8ejn8z");
          `}
        </Script>
      </head>
      <body className="bg-background font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
