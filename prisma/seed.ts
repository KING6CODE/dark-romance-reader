import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const chapterTitles = [
  'La nuit où tout a basculé',
  'Un inconnu trop familier',
  "Le prix du silence",
  'Ce que ses yeux cachaient',
  'Une promesse dangereuse',
  'Le secret de la maison rouge',
  'Plus près du danger',
  'Tu n\'étais pas censé me sauver',
]

function placeholderContent(chapterNumber: number, title: string): string {
  const intro = `Le froid s'était installé dans la pièce avant même que la porte ne se referme. Elena resserra son manteau autour d'elle, le regard fixé sur l'ombre qui venait d'apparaître au seuil. Elle savait qu'elle n'aurait pas dû venir ici, pas seule, pas après ce qui s'était passé la veille. Mais quelque chose dans la lettre qu'elle avait reçue l'avait poussée à franchir cette limite qu'elle s'était pourtant juré de ne jamais dépasser.`

  const middle = `« Tu n'aurais pas dû venir », dit-il enfin, sa voix grave résonnant contre les murs de pierre. Il y avait dans son ton quelque chose qui ressemblait à de l'inquiétude, presque à de la peur — une émotion qu'elle ne lui avait jamais connue. Elena fit un pas en arrière, mais ses jambes refusaient d'obéir complètement. Une partie d'elle voulait fuir cette pièce, cette maison, cet homme. L'autre partie, plus sombre, plus secrète, voulait rester. Voulait comprendre pourquoi son cœur battait si fort chaque fois qu'il s'approchait.`

  const ending = `Elle ferma les yeux un instant, cherchant dans le silence un peu de courage. Quand elle les rouvrit, il était plus proche, bien plus proche qu'elle ne l'aurait cru possible. « Je ne suis pas venue pour être sauvée », murmura-t-elle. Un sourire amer traversa son visage à lui, comme si cette phrase contenait une vérité qu'il refusait d'admettre depuis trop longtemps. Dehors, l'orage commençait à gronder, et avec lui, quelque chose d'irréversible se mettait en marche entre eux deux, quelque chose qu'aucun des deux ne pourrait plus arrêter — chapitre ${chapterNumber}.`

  return `${intro}\n\n${middle}\n\n${ending}`
}

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
        'Elle a fui un passé qu\'elle voulait oublier. Il l\'a retrouvée — et rien ne sera plus jamais pareil.',
      authorBio:
        "Jade Morel écrit des romances sombres et obsessionnelles depuis cinq ans. Passionnée par les anti-héros torturés et les histoires d'amour impossibles, elle vit entre Lyon et Lisbonne, où elle puise l'inspiration de ses intrigues les plus intenses.",
      authorImg: '/author.jpg',
    },
  })

  console.log('Création des chapitres...')
  for (let i = 0; i < 8; i++) {
    const number = i + 1
    const title = chapterTitles[i]
    await prisma.chapter.create({
      data: {
        romanId: roman.id,
        number,
        title,
        content: placeholderContent(number, title),
        isFree: number === 1,
        price: 99,
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
