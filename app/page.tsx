import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const roman = await prisma.roman.findFirst({
    orderBy: { createdAt: 'asc' },
    include: { chapters: { orderBy: { number: 'asc' } } },
  })

  if (!roman) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="font-sans text-text-secondary">
          Aucun roman trouvé. Lancez le seed de données pour commencer.
        </p>
      </main>
    )
  }

  const chapter2 = roman.chapters.find((c) => c.number === 2)

  return (
    <main className="min-h-screen pb-24 sm:pb-0">
      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0">
          <Image
            src={roman.cover}
            alt={roman.title}
            fill
            priority
            className="object-cover opacity-40 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-accent">
            Roman par chapitres
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-text-primary sm:text-5xl">
            {roman.title}
          </h1>
          <p className="mt-5 font-sans text-base text-text-secondary sm:text-lg">
            {roman.tagline}
          </p>
          <Link
            href={`/lire/${roman.slug}/1`}
            className="mt-8 inline-block rounded-md bg-accent px-8 py-4 font-sans text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
          >
            Lire le chapitre 1 — Gratuit
          </Link>
        </div>
      </section>

      {/* À PROPOS */}
      <section className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
          <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full border border-white/10">
            <Image
              src={roman.authorImg}
              alt={roman.author}
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-5 sm:mt-0">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
              L&apos;auteure
            </p>
            <h2 className="mt-2 font-serif text-2xl text-text-primary">
              {roman.author}
            </h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
              {roman.authorBio}
            </p>
          </div>
        </div>
      </section>

      {/* CHAPITRES */}
      <section className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center font-serif text-2xl text-text-primary">
            Chapitres
          </h2>
          <ul className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10">
            {roman.chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={`/lire/${roman.slug}/${chapter.number}`}
                  className="flex items-center justify-between gap-4 bg-surface px-5 py-4 transition-colors hover:bg-white/5"
                >
                  <div>
                    <p className="font-sans text-xs text-text-secondary">
                      Chapitre {chapter.number}
                    </p>
                    <p className="mt-1 font-serif text-base text-text-primary">
                      {chapter.title}
                    </p>
                  </div>
                  {chapter.isFree ? (
                    <span className="flex-shrink-0 font-sans text-xs uppercase tracking-wide text-accent">
                      Libre
                    </span>
                  ) : (
                    <span className="flex flex-shrink-0 items-center gap-1.5 font-sans text-xs text-text-secondary">
                      <LockIcon />
                      {(chapter.price / 100).toFixed(2)} €
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* BANDEAU STICKY MOBILE */}
      {chapter2 && (
        <Link
          href={`/lire/${roman.slug}/2`}
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-white/10 bg-surface px-5 py-4 sm:hidden"
        >
          <div>
            <p className="font-sans text-xs text-text-secondary">
              Continuer la lecture
            </p>
            <p className="font-serif text-sm text-text-primary">
              Chapitre 2 — 0,99 €
            </p>
          </div>
          <span className="rounded-md bg-accent px-4 py-2 font-sans text-xs font-semibold text-background">
            Continuer
          </span>
        </Link>
      )}
    </main>
  )
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
