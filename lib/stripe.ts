import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PRICES = {
  chapter: 99, // 0,99 €
  full: 499, // 4,99 €
} as const

export type PurchaseType = keyof typeof PRICES
