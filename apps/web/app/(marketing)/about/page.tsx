export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-6">About POD Store</h1>

      <div className="prose prose-gray max-w-none space-y-4 text-foreground-muted">
        <p>
          POD Store is a premium print-on-demand platform that brings your ideas to life. We partner with
          top-quality print providers to deliver custom products right to your doorstep.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">Our Mission</h2>
        <p>
          We believe everyone should be able to express themselves through the products they use every day.
          Our platform makes it easy to create, customize, and order high-quality printed products.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">Quality</h2>
        <p>
          Every product goes through rigorous quality checks before it reaches you. We use state-of-the-art
          printing technology and premium materials to ensure your products look and feel amazing.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">Contact</h2>
        <p>
          Have questions? Reach out to us at{" "}
          <a href="mailto:support@podstore.com" className="text-accent hover:underline">
            support@podstore.com
          </a>
        </p>
      </div>
    </div>
  );
}
