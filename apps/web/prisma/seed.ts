import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nexus.com" },
    update: {},
    create: {
      email: "admin@nexus.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Test User",
      password: userPassword,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "ui-kits" }, update: {}, create: { name: "UI Kits", slug: "ui-kits", order: 0 } }),
    prisma.category.upsert({ where: { slug: "icons" }, update: {}, create: { name: "Icons", slug: "icons", order: 1 } }),
    prisma.category.upsert({ where: { slug: "templates" }, update: {}, create: { name: "Templates", slug: "templates", order: 2 } }),
    prisma.category.upsert({ where: { slug: "fonts" }, update: {}, create: { name: "Fonts", slug: "fonts", order: 3 } }),
    prisma.category.upsert({ where: { slug: "mockups" }, update: {}, create: { name: "Mockups", slug: "mockups", order: 4 } }),
  ]);

  const products = [
    { title: "Cyber UI Kit", slug: "cyber-ui-kit", description: "A complete UI kit with a cyberpunk aesthetic. Includes buttons, cards, forms, and more.", price: 29.99, salePrice: null, categorySlug: "ui-kits" },
    { title: "Neon Icon Pack", slug: "neon-icon-pack", description: "500+ neon-styled SVG icons for modern web projects.", price: 19.99, salePrice: 14.99, categorySlug: "icons" },
    { title: "Dark Portfolio Template", slug: "dark-portfolio-template", description: "A premium dark-themed portfolio template built with Tailwind CSS.", price: 39.99, salePrice: null, categorySlug: "templates" },
    { title: "Digital Font Collection", slug: "digital-font-collection", description: "15 futuristic display fonts for digital products and branding.", price: 24.99, salePrice: 19.99, categorySlug: "fonts" },
    { title: "Product Mockup Bundle", slug: "product-mockup-bundle", description: "50+ photorealistic device mockups in PSD and Figma formats.", price: 34.99, salePrice: null, categorySlug: "mockups" },
    { title: "Dashboard UI Kit", slug: "dashboard-ui-kit", description: "Complete dashboard UI components with charts, tables, and widgets.", price: 49.99, salePrice: 39.99, categorySlug: "ui-kits" },
  ];

  for (const p of products) {
    const cat = categories.find((c) => c.slug === p.categorySlug);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice,
        categoryId: cat?.id,
        isActive: true,
      },
    });
  }

  console.log("✅ Done");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
