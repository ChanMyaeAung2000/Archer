import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const client = await prisma.user.upsert({
    where: { email: "client@archer.local" },
    update: {},
    create: {
      email: "client@archer.local",
      passwordHash,
      role: "CLIENT",
      profile: { create: { name: "Archer Client", headline: "Product founder" } }
    }
  });
  await prisma.user.upsert({
    where: { email: "freelancer@archer.local" },
    update: {},
    create: {
      email: "freelancer@archer.local",
      passwordHash,
      role: "FREELANCER",
      profile: { create: { name: "Archer Freelancer", headline: "Full-stack developer" } }
    }
  });

  const skillNames = ["React", "Node.js", "UI Design", "TypeScript"];
  const skills = await Promise.all(skillNames.map((name) => prisma.skill.upsert({
    where: { slug: slugify(name) },
    update: {},
    create: { name, slug: slugify(name) }
  })));

  const existingJob = await prisma.job.findFirst({ where: { clientId: client.id, title: "Build an Archer landing page" } });
  if (!existingJob) {
    await prisma.job.create({
      data: {
        clientId: client.id,
        title: "Build an Archer landing page",
        description: "Create a responsive marketing landing page for a freelance marketplace MVP.",
        category: "Web Development",
        budgetAmount: 150000,
        budgetCurrency: "USD",
        status: "PUBLISHED",
        publishedAt: new Date(),
        skills: { create: skills.slice(0, 2).map((skill) => ({ skillId: skill.id })) }
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
