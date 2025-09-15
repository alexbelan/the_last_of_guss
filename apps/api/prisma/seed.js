const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [adminRole, survivorRole, bannedRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: "admin" },
      update: {},
      create: { name: "admin" },
    }),
    prisma.role.upsert({
      where: { name: "survivor" },
      update: {},
      create: { name: "survivor" },
    }),
    prisma.role.upsert({
      where: { name: "banned" },
      update: {},
      create: { name: "banned" },
    }),
  ]);

  const passwordHash = await bcrypt.hash("123456", 10);

  await Promise.all([
    prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        passwordHash: passwordHash,
        roleId: adminRole.id,
      },
    }),
    prisma.user.upsert({
      where: { username: "nikita" },
      update: { passwordHash: passwordHash, roleId: bannedRole.id },
      create: {
        username: "nikita",
        passwordHash: passwordHash,
        roleId: bannedRole.id,
      },
    }),
    prisma.user.upsert({
      where: { username: "ivan" },
      update: {},
      create: {
        username: "ivan",
        passwordHash: passwordHash,
        roleId: survivorRole.id,
      },
    }),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
