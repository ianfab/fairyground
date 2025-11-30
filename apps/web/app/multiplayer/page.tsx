import type { Metadata } from "next";
import { SeoLandingPage } from "../components/SeoLandingPage";
import { SEO_PAGES } from "@/lib/seo-pages";

const config = SEO_PAGES.find((p) => p.slug === "multiplayer")!;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  openGraph: {
    title: config.metaTitle,
    description: config.metaDescription,
    url: `https://splork.io/${config.slug}`,
  },
};

export const dynamic = "force-dynamic";

export default function MultiplayerPage() {
  return (
    <SeoLandingPage
      title={config.keyword}
      description={config.bodyDescription}
      tagFilters={config.tagFilters}
    />
  );
}


