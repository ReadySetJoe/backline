import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genres = [
  "Rock", "Punk", "Hardcore", "Metal", "Indie Rock", "Indie Pop",
  "Emo", "Post-Punk", "Shoegaze", "Noise", "Garage Rock", "Psychedelic",
  "Folk", "Country", "Americana", "Bluegrass", "Singer-Songwriter",
  "Jazz", "Blues", "Soul", "R&B", "Funk",
  "Hip Hop", "Rap", "Electronic", "DJ", "Ambient", "Experimental",
  "Pop", "Pop Punk", "Ska", "Reggae", "Latin", "World",
];

async function main() {
  for (const name of genres) {
    await prisma.genre.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    });
  }
  console.log(`Seeded ${genres.length} genres`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
