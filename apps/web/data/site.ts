export const siteConfig = {
  name: "POD Store",
  description: "Premium print-on-demand products",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "INR",
  taxRate: 18,
  shipping: {
    freeThreshold: 999,
    standard: 99,
    express: 199,
  },
  email: {
    from: process.env.SMTP_FROM ?? "store@podstore.com",
  },
  social: {
    instagram: "#",
    twitter: "#",
  },
  navbar: {
    links: [
      { label: "Products", href: "/products" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
};
