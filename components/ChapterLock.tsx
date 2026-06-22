'use client'

import { useState } from 'react'
import { EMAIL_COOKIE } from '@/lib/constants'

interface ChapterLockProps {
  slug: string
  romanId: string
  chapterId: string
  nextChapter: number
  nextChapterTitle: string
  teaser: string
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

export default function ChapterLock({
  slug,
  romanId,
  chapterId,
  nextChapter,
  nextChapterTitle,
  teaser,
}: ChapterLockProps) {
  const [email, setEmail] = useState(getCookie(EMAIL_COOKIE))
  const [loading, setLoading] = useState<'chapter' | 'full' | null>(null)
  const [error, setError] = useState('')

  async function handlePurchase(type: 'chapter' | 'full') {
    if (!email || !email.includes('@')) {
      setError('Merci de saisir un email valide pour continuer.')
      return
    }
    setError('')
    setLoading(type)

    try {
      // Stocke l'email dans un cookie côté client
      await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type,
          chapterId: type === 'chapter' ? chapterId : undefined,
          romanId,
          slug,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Une erreur est survenue. Merci de réessayer.')
        setLoading(null)
      }
    } catch (err) {
      setError('Une erreur est survenue. Merci de réessayer.')
      setLoading(null)
    }
  }

  return (
    <div className="relative">
      {/* Fondu sur les dernières lignes visibles */}
      <div className="pointer-events-none absolute -top-40 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-background" />

      <div className="mt-2 rounded-lg border border-white/10 bg-surface px-6 py-10 text-center sm:px-10">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
          La suite vous attend...
        </p>

        <h3 className="mt-3 font-serif text-2xl text-text-primary">
          Chapitre {nextChapter} — {nextChapterTitle}
        </h3>

        <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-text-secondary">
          {teaser}
        </p>

        <div className="mx-auto mt-6 max-w-sm">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-background px-4 py-3 font-sans text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          {error && (
            <p className="mt-2 font-sans text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="mx-auto mt-5 flex max-w-sm flex-col gap-3">
          <button
            onClick={() => handlePurchase('full')}
            disabled={loading !== null}
            className="rounded-md bg-accent px-6 py-3 font-sans text-sm font-semibold text-background transition-opacity disabled:opacity-60"
          >
            {loading === 'full' ? 'Redirection...' : 'Pack complet — 4,99 €'}
          </button>
          <button
            onClick={() => handlePurchase('chapter')}
            disabled={loading !== null}
            className="rounded-md border border-accent/40 px-6 py-3 font-sans text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
          >
            {loading === 'chapter' ? 'Redirection...' : `Chapitre suivant — 0,99 €`}
          </button>
        </div>

        <p className="mt-5 font-sans text-xs text-text-secondary">
          Paiement sécurisé par Stripe. Aucun compte requis.
        </p>
      </div>
    </div>
  )
}
