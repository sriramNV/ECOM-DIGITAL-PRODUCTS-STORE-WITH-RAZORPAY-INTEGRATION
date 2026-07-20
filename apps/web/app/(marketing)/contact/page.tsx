export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-6">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Email</h2>
            <a href="mailto:support@podstore.com" className="text-accent hover:underline">
              support@podstore.com
            </a>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Phone</h2>
            <p className="text-foreground-muted">+91 123 456 7890</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Address</h2>
            <p className="text-foreground-muted">
              POD Store HQ
              <br />
              123 Design Street
              <br />
              Bangalore, Karnataka 560001
              <br />
              India
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              id="name"
              type="text"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Message</label>
            <textarea
              id="message"
              rows={4}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground resize-none"
              placeholder="How can we help?"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
