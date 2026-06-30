import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES, PurchaseType } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

type CheckoutType = PurchaseType | 'pack-upsell'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email,
      type,
      chapterId,
      romanId,
      slug,
      cancelChapter,
      timerActive,
    } = body as {
      email: string
      type: CheckoutType
      chapterId?: string
      romanId: string
      slug: string
      /** Numéro du chapitre depuis lequel l'achat a été initié (pour le bouton "Retour" Stripe). */
      cancelChapter?: number
      /** Pour le type "pack-upsell" : indique si le compte à rebours est encore actif (399) ou expiré (499). */
      timerActive?: boolean
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    if (type !== 'chapter' && type !== 'full' && type !== 'pack-upsell') {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    if (type === 'chapter' && !chapterId) {
      return NextResponse.json(
        { error: 'chapterId requis pour un achat de chapitre' },
        { status: 400 }
      )
    }

    const roman = await prisma.roman.findUnique({
      where: { id: romanId },
      include: { chapters: { orderBy: { number: 'asc' } } },
    })

    if (!roman) {
      return NextResponse.json({ error: 'Roman introuvable' }, { status: 404 })
    }

    let nextChapterNumber = 2
    let productName = `${roman.title} — Pack complet`

    if (type === 'chapter') {
      const chapter = roman.chapters.find((c) => c.id === chapterId)
      if (!chapter) {
        return NextResponse.json({ error: 'Chapitre introuvable' }, { status: 404 })
      }
      nextChapterNumber = chapter.number
      productName = `${roman.title} — Chapitre ${chapter.number} : ${chapter.title}`
    } else if (type === 'pack-upsell') {
      // L'upsell débloque la suite du roman (chapitres 3 à 15) après l'achat du chapitre 2.
      nextChapterNumber = 3
      productName = `${roman.title} — Chapitres 3 à 15`
    } else {
      nextChapterNumber = 2
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Le prix du chapitre vient de la base (respecte les offres dynamiques comme
    // l'offre d'appel à 0,50€ sur le chapitre 2). Le pack complet garde un prix fixe.
    // Le pack-upsell a un prix dynamique selon que le compte à rebours est actif ou non.
    let amount: number
    if (type === 'chapter') {
      const chapter = roman.chapters.find((c) => c.id === chapterId)!
      amount = chapter.price
    } else if (type === 'pack-upsell') {
      amount = timerActive ? 399 : 499
    } else {
      amount = PRICES.full
    }

    // cancel_url : revient sur le chapitre depuis lequel l'achat a été initié,
    // plutôt que sur la page produit générique du roman.
    const cancelUrl = cancelChapter
      ? `${baseUrl}/lire/${slug}/${cancelChapter}?canceled=true`
      : `${baseUrl}/roman/${slug}?canceled=true`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/lire/${slug}/${nextChapterNumber}?success=true`,
      cancel_url: cancelUrl,
      metadata: {
        email,
        type,
        chapterId: chapterId || '',
        romanId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erreur Stripe checkout:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
