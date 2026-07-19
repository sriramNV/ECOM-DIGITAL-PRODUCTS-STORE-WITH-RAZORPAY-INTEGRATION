import { AnnouncementBar } from "@/components/storefront/layout/announcement-bar";
import { Navbar } from "@/components/storefront/layout/navbar";
import { Footer } from "@/components/storefront/layout/footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
