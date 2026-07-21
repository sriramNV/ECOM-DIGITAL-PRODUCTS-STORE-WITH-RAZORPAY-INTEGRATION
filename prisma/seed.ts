import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { placeholderProducts, placeholderCategories } from "../apps/web/data/products";
import { slugify } from "../apps/web/lib/utils";

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminEmail = "admin@podstore.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const password = await hash("admin123", 12);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password,
        role: "ADMIN",
      },
    });
    console.log("Admin user created successfully");
  } else {
    console.log("Admin user already exists");
  }
}

async function seedProducts() {
  for (const cat of placeholderCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Seeded ${placeholderCategories.length} categories`);

  for (const product of placeholderProducts) {
    const category = await prisma.category.findUnique({ where: { slug: slugify(product.category) } });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        title: product.title,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice,
        marginPercent: product.marginPercent,
        categoryId: category?.id ?? null,
        tags: product.tags,
        images: {
          create: product.images.map((img, i) => ({
            url: img.url,
            alt: img.alt,
            position: i,
          })),
        },
        variants: {
          create: product.variants.map((v) => ({
            title: `${v.size} / ${v.color}`,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
          })),
        },
      },
    });
  }
  console.log(`Seeded ${placeholderProducts.length} products`);
}

async function main() {
  await seedAdmin();
  await seedProducts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
