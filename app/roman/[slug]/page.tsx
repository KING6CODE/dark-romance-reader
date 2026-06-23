import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function RomanPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { canceled?: string }
}) {
  const roman = await prisma.roman.findUnique({
    where: { slug: params.slug },
    include: { chapters: { orderBy: { number: 'asc' } } },
  })

  if (!roman) notFound()

  const wasCanceled = searchParams.canceled === 'true'

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        {wasCanceled && (
          <div className="mb-8 rounded-md border border-accent/30 bg-accent/10 px-5 py-4 text-center">
            <p className="font-sans text-sm text-accent">
              Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
          <div className="relative h-48 w-32 flex-shrink-0 overflow-hidden rounded-md border border-white/10">
            <Image
              src={roman.cover}
              alt={roman.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-5 sm:mt-0">
            <h1 className="font-serif text-3xl text-text-primary">
              {roman.title}
            </h1>
            <p className="mt-2 font-sans text-sm text-text-secondary">
              {roman.author}
            </p>
            <p className="mt-4 font-sans text-sm leading-relaxed text-text-secondary">
              {roman.tagline}
            </p>
          </div>
        </div>

        <h2 className="mt-12 mb-6 font-serif text-xl text-text-primary">
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
                  <span className="flex-shrink-0 font-sans text-xs text-text-secondary">
                    {(chapter.price / 100).toFixed(2)} €
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="font-sans text-sm text-text-secondary underline-offset-4 hover:text-accent hover:underline"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  )
}
