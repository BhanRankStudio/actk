const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const departments = [{ name: "Account" }];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
  }

  console.log("Seeded departments");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
