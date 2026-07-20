export const metadata = { title: "FAQ — POD Store" };

const faqs = [
  { q: "How long does shipping take?", a: "Standard shipping takes 7–14 business days. Express shipping is available at checkout for 3–5 business days." },
  { q: "What is your return policy?", a: "We accept returns within 30 days of delivery. Items must be unworn and in original packaging. Print quality issues are covered by our satisfaction guarantee." },
  { q: "Do you ship internationally?", a: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by destination." },
  { q: "How do I care for my printed products?", a: "Machine wash cold inside out, tumble dry low. Avoid bleach and fabric softener to preserve print quality." },
  { q: "Can I track my order?", a: "Yes, a tracking link is emailed when your order ships. You can also check order status in your account." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, UPI, and net banking through our secure Razorpay payment gateway." },
  { q: "How do I choose the right size?", a: "Check our Size Guide for detailed measurements. If between sizes, we recommend sizing up for a relaxed fit." },
];

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
      <p className="text-foreground-muted mb-12">Everything you need to know before ordering.</p>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-border pb-6 last:border-0">
            <h2 className="text-lg font-semibold text-foreground mb-2">{faq.q}</h2>
            <p className="text-foreground-muted leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
