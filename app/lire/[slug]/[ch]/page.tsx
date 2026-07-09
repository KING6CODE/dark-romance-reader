import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getReaderEmail, hasAccessToChapter } from '@/lib/access'
import ChapterLock from '@/components/ChapterLock'
import ReadingProgress from '@/components/ReadingProgress'
import PostPurchaseUpsell from '@/components/PostPurchaseUpsell'
import ConversionTracker from '@/components/ConversionTracker'

export const dynamic = 'force-dynamic'

export default async function LirePage({
  params,
}: {
  params: { slug: string; ch: string }
}) {
  const chapterNumber = parseInt(params.ch, 10)
  if (isNaN(chapterNumber)) notFound()

  const roman = await prisma.roman.findUnique({
    where: { slug: params.slug },
    include: { chapters: { orderBy: { number: 'asc' } } },
  })

  if (!roman) notFound()

  const chapter = roman.chapters.find((c) => c.number === chapterNumber)
  if (!chapter) notFound()

  const prevChapter = roman.chapters.find((c) => c.number === chapterNumber - 1)
  const nextChapter = roman.chapters.find((c) => c.number === chapterNumber + 1)
  const chapterAfterNext = roman.chapters.find((c) => c.number === chapterNumber + 2)

  // Perf: un seul cookie read, puis les 3 requêtes Prisma d'accès partent
  // en parallèle au lieu d'être awaited séquentiellement. Sur une page
  // SSR pure (pas d'images), c'est le TTFB qui domine le LCP : chaque
  // aller-retour DB évité ici réduit directement le temps avant le
  // premier rendu.
  const email = getReaderEmail()

  const [hasAccess, hasAccessToNext, hasAccessToChapterAfterNext] =
    await Promise.all([
      chapter.isFree
        ? Promise.resolve(true)
        : hasAccessToChapter(email, chapter.id, roman.id),
      !nextChapter
        ? Promise.resolve(false)
        : nextChapter.isFree
          ? Promise.resolve(true)
          : hasAccessToChapter(email, nextChapter.id, roman.id),
      !chapterAfterNext
        ? Promise.resolve(false)
        : chapterAfterNext.isFree
          ? Promise.resolve(true)
          : hasAccessToChapter(email, chapterAfterNext.id, roman.id),
    ])
  const showPostPurchaseUpsell =
    chapter.number === 2 && hasAccess && !hasAccessToChapterAfterNext

  const paragraphs = chapter.content.split('\n').filter((p) => p.trim().length > 0)
  const visibleParagraphs = hasAccess ? paragraphs : paragraphs.slice(0, 3)

  return (
    <main className="min-h-screen pb-20">
      <ConversionTracker value={chapter.price / 100} />
      <ReadingProgress />

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-background/90 px-5 py-4 backdrop-blur-sm">
        <Link
          href={`/roman/${roman.slug}`}
          className="font-sans text-sm text-text-secondary hover:text-accent"
          aria-label="Retour au roman"
        >
          ← Retour
        </Link>
        <div className="text-center">
          <p className="font-sans text-xs text-text-secondary">
            {roman.title}
          </p>
          <p className="font-sans text-xs uppercase tracking-wide text-accent">
            Chapitre {chapter.number}
          </p>
        </div>
        <div className="w-12" />
      </header>

      <article className="mx-auto max-w-65ch px-6 py-12">
        <h1 className="mb-8 text-center font-serif text-2xl text-text-primary">
          {chapter.title}
        </h1>

        <div className="font-serif text-[18px] leading-reading text-text-primary">
          {visibleParagraphs.map((p, i) => {
            const isDialogue = p.trim().startsWith('—')
            return (
              <p
                key={i}
                className={
                  isDialogue
                    ? 'mb-5 text-text-primary/95'
                    : 'mb-7 text-text-primary'
                }
              >
                {p.trim()}
              </p>
            )
          })}
        </div>

        {!hasAccessToNext && nextChapter && !showPostPurchaseUpsell && (
          <ChapterLock
            slug={roman.slug}
            romanId={roman.id}
            chapterId={nextChapter.id}
            nextChapter={nextChapter.number}
            nextChapterTitle={nextChapter.title}
            nextChapterPrice={nextChapter.price}
            currentChapterNumber={chapter.number}
            teaser="Ce qu'elle découvre derrière cette porte va tout changer entre eux."
          />
        )}

        {showPostPurchaseUpsell && (
          <PostPurchaseUpsell
            slug={roman.slug}
            romanId={roman.id}
            currentChapterNumber={chapter.number}
          />
        )}

        {hasAccess && !nextChapter && (
          <p className="mt-10 text-center font-sans text-sm text-text-secondary">
            C&apos;était le dernier chapitre. Merci d&apos;avoir lu.
          </p>
        )}
      </article>

      {hasAccess && (
        <nav className="mx-auto flex max-w-65ch items-center justify-between border-t border-white/5 px-6 py-6">
          {prevChapter ? (
            <Link
              href={`/lire/${roman.slug}/${prevChapter.number}`}
              className="font-sans text-sm text-text-secondary hover:text-accent"
            >
              ← Chapitre {prevChapter.number}
            </Link>
          ) : (
            <span />
          )}
          {hasAccessToNext && nextChapter ? (
            <Link
              href={`/lire/${roman.slug}/${nextChapter.number}`}
              className="font-sans text-sm text-text-secondary hover:text-accent"
            >
              Chapitre {nextChapter.number} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  )
}
