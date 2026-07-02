'use client'

import { useEffect } from 'react'

interface ConversionTrackerProps {
  value: number
}

export default function ConversionTracker({ value }: ConversionTrackerProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      // Déclenche l'événement de conversion Google Ads
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'conversion', {
          send_to: 'AW-18003821360/achat_chapitre',
          value: value,
          currency: 'EUR',
        })
      }
      // Nettoie l'URL sans recharger la page
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      window.history.replaceState({}, '', url.toString())
    }
  }, [value])

  return null
}
