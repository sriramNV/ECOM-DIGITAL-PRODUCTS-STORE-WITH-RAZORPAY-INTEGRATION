export const metadata = { title: "Size Guide — POD Store" };

const sizes = [
  { size: "XS", chest: "31–34", length: "27", sleeve: "32" },
  { size: "S", chest: "34–37", length: "28", sleeve: "33" },
  { size: "M", chest: "38–41", length: "29", sleeve: "34" },
  { size: "L", chest: "42–45", length: "30", sleeve: "35" },
  { size: "XL", chest: "46–49", length: "31", sleeve: "36" },
  { size: "2XL", chest: "50–53", length: "32", sleeve: "37" },
  { size: "3XL", chest: "54–57", length: "33", sleeve: "38" },
];

const hoodieSizes = [
  { size: "S", chest: "36–38", length: "26", sleeve: "33" },
  { size: "M", chest: "39–41", length: "27", sleeve: "34" },
  { size: "L", chest: "42–44", length: "28", sleeve: "35" },
  { size: "XL", chest: "45–47", length: "29", sleeve: "36" },
  { size: "2XL", chest: "48–50", length: "30", sleeve: "37" },
];

export default function SizeGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-2">Size Guide</h1>
      <p className="text-foreground-muted mb-8">Measurements in inches. If between sizes, size up for a relaxed fit.</p>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">T-Shirts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 font-medium text-foreground">Size</th>
                <th className="text-left py-3 font-medium text-foreground">Chest</th>
                <th className="text-left py-3 font-medium text-foreground">Length</th>
                <th className="text-left py-3 font-medium text-foreground">Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((s) => (
                <tr key={s.size} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{s.size}</td>
                  <td className="py-3 text-foreground-muted">{s.chest}</td>
                  <td className="py-3 text-foreground-muted">{s.length}</td>
                  <td className="py-3 text-foreground-muted">{s.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Hoodies</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 font-medium text-foreground">Size</th>
                <th className="text-left py-3 font-medium text-foreground">Chest</th>
                <th className="text-left py-3 font-medium text-foreground">Length</th>
                <th className="text-left py-3 font-medium text-foreground">Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {hoodieSizes.map((s) => (
                <tr key={s.size} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{s.size}</td>
                  <td className="py-3 text-foreground-muted">{s.chest}</td>
                  <td className="py-3 text-foreground-muted">{s.length}</td>
                  <td className="py-3 text-foreground-muted">{s.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12 bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">How to Measure</h2>
        <ul className="space-y-2 text-sm text-foreground-muted">
          <li><strong className="text-foreground">Chest:</strong> Measure around the fullest part of your chest, keeping the tape parallel to the floor.</li>
          <li><strong className="text-foreground">Length:</strong> Measure from the highest point of the shoulder to the bottom hem.</li>
          <li><strong className="text-foreground">Sleeve:</strong> Measure from the center back of the neck, across the shoulder, and down to the wrist.</li>
        </ul>
      </div>
    </div>
  );
}
