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
      </head>
      <body className="bg-background font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
