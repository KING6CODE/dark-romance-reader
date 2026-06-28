import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { EMAIL_COOKIE } from '@/lib/constants'

export function getReaderEmail(): string | null {
  const cookie = cookies().get(EMAIL_COOKIE)
  return cookie?.value || null
}

/**
 * Vérifie si l'email (lu depuis le cookie) a accès à un chapitre donné,
 * soit via l'achat du chapitre seul, soit via l'achat du pack complet du roman
 * (type "full"), soit via l'upsell post-achat (type "pack-upsell", qui débloque
 * également l'ensemble du roman pour l'email concerné).
 */
export async function hasAccessToChapter(
  email: string | null,
  chapterId: string,
  romanId: string
): Promise<boolean> {
  if (!email) return false

  const purchase = await prisma.purchase.findFirst({
    where: {
      email,
      OR: [
        { chapterId, type: 'chapter' },
        { romanId, type: 'full' },
        { romanId, type: 'pack-upsell' },
      ],
    },
  })

  return !!purchase
}
