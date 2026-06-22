import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES, PurchaseType } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, type, chapterId, romanId, slug } = body as {
      email: string
      type: PurchaseType
      chapterId?: string
      romanId: string
      slug: string
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    if (type !== 'chapter' && type !== 'full') {
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
    } else {
      nextChapterNumber = 2
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const amount = PRICES[type]

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
      cancel_url: `${baseUrl}/roman/${slug}`,
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
