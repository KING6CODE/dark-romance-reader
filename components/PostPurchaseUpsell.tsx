'use client'

import { useState, useEffect } from 'react'
import { EMAIL_COOKIE } from '@/lib/constants'

interface PostPurchaseUpsellProps {
  slug: string
  romanId: string
  currentChapterNumber: number
}

const UPSELL_DURATION_SECONDS = 15 * 60
const UPSELL_TIMER_KEY = 'pack_upsell_started_at'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function PostPurchaseUpsell({
  slug,
  romanId,
  currentChapterNumber,
}: PostPurchaseUpsellProps) {
  const [email] = useState(getCookie(EMAIL_COOKIE))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    let startedAt = localStorage.getItem(UPSELL_TIMER_KEY)
    if (!startedAt) {
      startedAt = String(Date.now())
      localStorage.setItem(UPSELL_TIMER_KEY, startedAt)
    }

    const tick = () => {
      const elapsedMs = Date.now() - Number(startedAt)
      const remainingMs = UPSELL_DURATION_SECONDS * 1000 - elapsedMs
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
      setSecondsLeft(remaining)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const timerActive = secondsLeft !== null && secondsLeft > 0
  const currentPrice = timerActive ? 3.99 : 4.99

  async function handlePurchase() {
    if (!email || !email.includes('@')) {
      setError('Une erreur est survenue avec votre email. Merci de recharger la page.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'pack-upsell',
          romanId,
          slug,
          cancelChapter: currentChapterNumber,
          timerActive,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Une erreur est survenue. Merci de réessayer.')
        setLoading(false)
      }
    } catch (err) {
      setError('Une erreur est survenue. Merci de réessayer.')
      setLoading(false)
    }
  }

  if (secondsLeft === null) {
    return null
  }

  return (
    <div className="mt-10 rounded-lg border border-accent/30 bg-surface px-6 py-10 text-center sm:px-10">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
        La suite vous attend...
      </p>

      <h3 className="mt-3 font-serif text-xl text-text-primary">
        Les chapitres 3 à 8 vous attendent. Dont la révélation finale.
      </h3>

      <div className="mx-auto mt-5 max-w-sm rounded-md border border-accent/40 bg-accent/10 px-4 py-3">
        <p className="font-sans text-sm text-text-primary">
          {timerActive ? (
            <>
              <span className="text-text-secondary line-through">4,99 €</span>{' '}
              <span className="text-lg font-semibold text-accent">3,99 €</span>
            </>
          ) : (
            <span className="text-lg font-semibold text-accent">4,99 €</span>
          )}
        </p>
        {timerActive ? (
          <p className="mt-2 font-sans text-xs text-text-secondary">
            Offre valable encore{' '}
            <span className="font-semibold text-accent">
              {formatTime(secondsLeft)}
            </span>
          </p>
        ) : (
          <p className="mt-2 font-sans text-xs text-text-secondary">
            L&apos;offre de lancement est terminée.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-3 font-sans text-xs text-red-400">{error}</p>
      )}

      <div className="mx-auto mt-5 max-w-sm">
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full rounded-md bg-accent px-6 py-3 font-sans text-sm font-semibold text-background transition-opacity disabled:opacity-60"
        >
          {loading
            ? 'Redirection...'
            : `Débloquer les chapitres 3 à 8 maintenant — ${currentPrice
                .toFixed(2)
                .replace('.', ',')} €`}
        </button>
      </div>

      <p className="mt-5 font-sans text-xs text-text-secondary">
        Paiement sécurisé par Stripe. Aucun compte requis.
      </p>
    </div>
  )
}
