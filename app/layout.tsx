import type { Metadata } from 'next'
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
      <body className="bg-background font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
