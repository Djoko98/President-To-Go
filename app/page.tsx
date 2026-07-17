import { PublicHeader } from "@/components/public/public-header";
import { CatalogExperience } from "@/components/public/catalog-experience";
import { getCatalog } from "@/lib/supabase/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  return <><PublicHeader /><CatalogExperience catalog={catalog} initialCategory={params.category} /></>;
}
