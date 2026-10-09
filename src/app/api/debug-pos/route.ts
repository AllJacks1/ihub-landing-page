import { getPosProducts, getPosCategories } from "@/lib/pos-actions";

export async function GET() {
  const productsResult = await getPosProducts();
  const categoriesResult = await getPosCategories();

  return Response.json({
    products: productsResult,
    categories: categoriesResult,
    env: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
      SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
      ALL_SUPABASE_KEYS: Object.keys(process.env)
        .filter((k) => k.includes("SUPABASE") || k.includes("DATABASE"))
        .join(", "),
    },
  });
}
