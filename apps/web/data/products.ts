export const placeholderProducts = [
  {
    title: "Classic Cotton T-Shirt",
    slug: "classic-cotton-t-shirt",
    description: "Premium quality 100% combed ring-spun cotton t-shirt. Pre-shrunk fabric, seamless double-needle collar, and taped neck and shoulders for durability.",
    basePrice: 499,
    marginPercent: 40,
    category: "T-Shirts",
    tags: ["cotton", "classic", "essential"],
    images: [
      { url: "https://picsum.photos/seed/tshirt1/600/600", alt: "Classic Cotton T-Shirt front" },
      { url: "https://picsum.photos/seed/tshirt2/600/600", alt: "Classic Cotton T-Shirt back" },
    ],
    variants: [
      { size: "S", color: "Black", colorHex: "#000000", price: 698 },
      { size: "M", color: "Black", colorHex: "#000000", price: 698 },
      { size: "L", color: "Black", colorHex: "#000000", price: 698 },
      { size: "XL", color: "Black", colorHex: "#000000", price: 698 },
      { size: "S", color: "White", colorHex: "#FFFFFF", price: 698 },
      { size: "M", color: "White", colorHex: "#FFFFFF", price: 698 },
      { size: "L", color: "White", colorHex: "#FFFFFF", price: 698 },
    ],
  },
  {
    title: "Premium Hoodie",
    slug: "premium-hoodie",
    description: "Ultra-soft 80/20 cotton-polyester blend hoodie with front pouch pocket, adjustable drawstring hood, and ribbed cuffs and hem.",
    basePrice: 899,
    marginPercent: 40,
    category: "Hoodies",
    tags: ["hoodie", "premium", "warm"],
    images: [
      { url: "https://picsum.photos/seed/hoodie1/600/600", alt: "Premium Hoodie front" },
    ],
    variants: [
      { size: "S", color: "Navy", colorHex: "#1a2744", price: 1258 },
      { size: "M", color: "Navy", colorHex: "#1a2744", price: 1258 },
      { size: "L", color: "Navy", colorHex: "#1a2744", price: 1258 },
      { size: "S", color: "Gray", colorHex: "#808080", price: 1258 },
      { size: "M", color: "Gray", colorHex: "#808080", price: 1258 },
    ],
  },
];

export const placeholderCategories = [
  { name: "T-Shirts", slug: "tshirts", description: "Classic and printed t-shirts", order: 1 },
  { name: "Hoodies", slug: "hoodies", description: "Warm and comfortable hoodies", order: 2 },
  { name: "Mugs", slug: "mugs", description: "Ceramic printed mugs", order: 3 },
  { name: "Posters", slug: "posters", description: "High-quality art prints", order: 4 },
];
