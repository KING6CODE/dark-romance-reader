import { PrismaClient } from '@prisma/client'
import chapters from './chapters-data'

const prisma = new PrismaClient()

async function main() {
  console.log('Suppression des données existantes...')
  await prisma.purchase.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.roman.deleteMany()

  console.log('Création du roman...')
  const roman = await prisma.roman.create({
    data: {
      slug: 'tu-netais-pas-cense-me-sauver',
      title: "Tu n'étais pas censé me sauver",
      author: 'Jade Morel',
      cover: '/cover.jpg',
      tagline:
        "Elle a fui un passé qu'elle voulait oublier. Il l'a retrouvée — et rien ne sera plus jamais pareil.",
      authorBio:
        "Jade Morel écrit des romances sombres et obsessionnelles depuis cinq ans. Passionnée par les anti-héros torturés et les histoires d'amour impossibles, elle vit entre Lyon et Lisbonne, où elle puise l'inspiration de ses intrigues les plus intenses.",
      authorImg: '/author.jpg',
    },
  })

  console.log('Création des chapitres...')
for (const chapter of chapters) {
  const isFree = chapter.number === 1 // Seul le chapitre 1 est gratuit
  await prisma.chapter.create({
    data: {
      romanId: roman.id,
      number: chapter.number,
      title: chapter.title,
      content: chapter.content,
      isFree,
      // Prix uniforme : 0 pour le chapitre gratuit, 0,99€ pour tous les autres.
      price: isFree ? 0 : 99,
    },
  })
}

  console.log('Seed terminé avec succès.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })