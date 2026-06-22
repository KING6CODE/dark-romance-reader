import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Erreur de signature webhook:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { email, type, chapterId, romanId } = session.metadata || {}

    if (!email || !type || !romanId) {
      console.error('Metadata incomplète sur la session Stripe', session.metadata)
      return NextResponse.json({ error: 'Metadata incomplète' }, { status: 400 })
    }

    try {
      await prisma.purchase.create({
        data: {
          email,
          type,
          chapterId: chapterId || null,
          romanId,
          stripeId: session.id,
        },
      })
    } catch (err) {
      // Si le même événement est renvoyé (stripeId déjà unique), on ignore l'erreur de doublon
      console.error('Erreur création Purchase:', err)
    }
  }

  return NextResponse.json({ received: true })
}
