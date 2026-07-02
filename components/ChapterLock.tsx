'use client'

import { useState, useEffect, useRef } from 'react'
import { EMAIL_COOKIE } from '@/lib/constants'

interface ChapterLockProps {
  slug: string
  romanId: string
  chapterId: string
  nextChapter: number
  nextChapterTitle: string
  teaser: string
  /** Prix du chapitre suivant en centimes (ex: 50 pour 0,50€, 99 pour 0,99€) */
  nextChapterPrice: number
  /** Numéro du chapitre actuellement affiché (celui depuis lequel l'achat est initié). */
  currentChapterNumber: number
}

const INTRO_OFFER_DURATION_SECONDS = 10 * 60 // 10 minutes
const INTRO_OFFER_TIMER_KEY = 'intro_offer_expires_at'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ChapterLock({
  slug,
  romanId,
  chapterId,
  nextChapter,
  nextChapterTitle,
  teaser,
  nextChapterPrice,
  currentChapterNumber,
}: ChapterLockProps) {
  const [email, setEmail] = useState(getCookie(EMAIL_COOKIE))
  const [loading, setLoading] = useState<'chapter' | 'full' | null>(null)
  const [error, setError] = useState('')

  // L'offre d'appel ne s'applique qu'au chapitre 2 (prix défini à 50 centimes en base).
  const isIntroOffer = nextChapter === 2 && nextChapterPrice === 50

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!isIntroOffer) return

    let expiresAt = sessionStorage.getItem(INTRO_OFFER_TIMER_KEY)
    if (!expiresAt) {
      const newExpiry = Date.now() + INTRO_OFFER_DURATION_SECONDS * 1000
      sessionStorage.setItem(INTRO_OFFER_TIMER_KEY, String(newExpiry))
      expiresAt = String(newExpiry)
    }

    const tick = () => {
      const remainingMs = Number(expiresAt) - Date.now()
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        expiredRef.current = true
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isIntroOffer])

  const offerExpired = isIntroOffer && secondsLeft === 0

  async function handlePurchase(type: 'chapter' | 'full') {
    if (!email || !email.includes('@')) {
      setError('Merci de saisir un email valide pour continuer.')
      return
    }
    setError('')
    setLoading(type)

    try {
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
          cancelChapter: currentChapterNumber,
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

  // Calcul de l'ancrage de prix pour le pack complet (non affiché sur l'offre d'appel)
  const standardChapterPrice = 0.99
  const remainingChaptersEstimate = 14
  const fullPackPrice = 4.99
  const fullPriceIfUnit = (standardChapterPrice * remainingChaptersEstimate).toLocaleString(
    'fr-FR',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )
  const savingsPercent = Math.round(
    (1 - fullPackPrice / (standardChapterPrice * remainingChaptersEstimate)) * 100
  )

  return (
    <div className="relative">
      {/* Fondu sur les dernières lignes visibles */}
      <div className="pointer-events-none absolute -top-40 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-background" />

      <div className="mt-2 rounded-lg border border-white/10 bg-surface px-6 py-10 text-center sm:px-10">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
          La suite vous attend...
        </p>

        <h3 className="mt-3 font-serif text-2xl text-text-primary">
          Chapitre {nextChapter}
        </h3>

        <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-text-secondary">
          {teaser}
        </p>

        {/* OFFRE D'APPEL — Chapitre 2 uniquement */}
        {isIntroOffer && !offerExpired && (
          <div className="mx-auto mt-6 max-w-sm rounded-md border border-accent/40 bg-accent/10 px-4 py-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-accent">
              Offre de bienvenue — −49%
            </p>
            <p className="mt-1 font-sans text-sm text-text-primary">
              <span className="text-text-secondary line-through">0,99 €</span>{' '}
              <span className="text-lg font-semibold text-accent">0,50 €</span>{' '}
              pour ce chapitre
            </p>
            {secondsLeft !== null && (
              <p className="mt-2 font-sans text-xs text-text-secondary">
                Offre valable encore{' '}
                <span className="font-semibold text-accent">
                  {formatTime(secondsLeft)}
                </span>
              </p>
            )}
          </div>
        )}

        {isIntroOffer && offerExpired && (
          <div className="mx-auto mt-6 max-w-sm rounded-md border border-white/10 bg-background/40 px-4 py-3">
            <p className="font-sans text-sm text-text-secondary">
              L&apos;offre de bienvenue est terminée. Le chapitre reste disponible au prix standard.
            </p>
          </div>
        )}

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
          {isIntroOffer ? (
            // Sur l'offre d'appel : un seul bouton, pas de pack complet pour maximiser la conversion sur le micro-paiement
            <button
              onClick={() => handlePurchase('chapter')}
              disabled={loading !== null}
              className="rounded-md bg-accent px-6 py-3 font-sans text-sm font-semibold text-background transition-opacity disabled:opacity-60"
            >
              {loading === 'chapter'
                ? 'Redirection...'
                : offerExpired
                ? 'Débloquer ce chapitre — 0,99 €'
                : 'Débloquer ce chapitre — 0,50 €'}
            </button>
          ) : (
            <>
              <button
                onClick={() => handlePurchase('full')}
                disabled={loading !== null}
                className="rounded-md bg-accent px-6 py-3 font-sans text-sm font-semibold text-background transition-opacity disabled:opacity-60"
              >
                {loading === 'full' ? 'Redirection...' : 'Pack complet — 4,99 €'}
              </button>
              <p className="-mt-1 font-sans text-xs text-text-secondary">
                Soit {savingsPercent}% d&apos;économie vs {fullPriceIfUnit} € à l&apos;unité
              </p>
              <button
                onClick={() => handlePurchase('chapter')}
                disabled={loading !== null}
                className="rounded-md border border-accent/40 px-6 py-3 font-sans text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
              >
                {loading === 'chapter'
                  ? 'Redirection...'
                  : `Chapitre suivant — ${(nextChapterPrice / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
              </button>
            </>
          )}
        </div>

        <p className="mt-5 font-sans text-xs text-text-secondary">
          Paiement sécurisé par Stripe. Aucun compte requis.
        </p>
      </div>
    </div>
  )
}
