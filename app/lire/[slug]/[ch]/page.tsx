import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getReaderEmail, hasAccessToChapter } from '@/lib/access'
import ChapterLock from '@/components/ChapterLock'
import ReadingProgress from '@/components/ReadingProgress'

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

  // Chapitre 1 toujours accessible. Sinon, vérifie l'accès via email/cookie + DB.
  let hasAccess = chapter.isFree
  if (!hasAccess) {
    const email = getReaderEmail()
    hasAccess = await hasAccessToChapter(email, chapter.id, roman.id)
  }

  const paragraphs = chapter.content.split('\n\n').filter(Boolean)
  const visibleParagraphs = hasAccess ? paragraphs : paragraphs.slice(0, 3)

  return (
    <main className="min-h-screen pb-20">
      <ReadingProgress />

      {/* HEADER */}
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

      {/* CORPS DU TEXTE */}
      <article className="mx-auto max-w-65ch px-6 py-12">
        <h1 className="mb-8 text-center font-serif text-2xl text-text-primary">
          {chapter.title}
        </h1>

        <div className="font-serif text-[18px] leading-reading text-text-primary">
          {visibleParagraphs.map((p, i) => (
            <p key={i} className="mb-6">
              {p}
            </p>
          ))}
        </div>

        {!hasAccess && nextChapter && (
          <ChapterLock
            slug={roman.slug}
            romanId={roman.id}
            chapterId={nextChapter.id}
            nextChapter={nextChapter.number}
            nextChapterTitle={nextChapter.title}
            teaser="Ce qu'elle découvre derrière cette porte va tout changer entre eux."
          />
        )}

        {!hasAccess && !nextChapter && (
          <p className="mt-10 text-center font-sans text-sm text-text-secondary">
            C&apos;était le dernier chapitre. Merci d&apos;avoir lu.
          </p>
        )}
      </article>

      {/* NAVIGATION BAS DE PAGE */}
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
          {nextChapter ? (
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
