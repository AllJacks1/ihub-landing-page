"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  UtensilsCrossed,
  Egg,
  Users,
  Soup,
  Flame,
  Leaf,
  Star,
  Plus,
  Coffee,
  GlassWater,
  Martini,
  Milk,
  Candy,
  Beer,
  IceCreamBowl,
  ChefHat,
  Package,
  AlertCircle,
} from "lucide-react";
import HorizontalScroll from "@/hooks/horizontal-scroll";

type PriceVariant = {
  name: string;
  price: string;
};

type MenuItem = {
  name: string;
  description: string;
  price?: string;
  variants?: PriceVariant[];
  image: string;
  isPopular?: boolean;
  isNew?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
};

const mainCategories = [
  {
    id: "bowls",
    label: "Bowls",
    icon: IceCreamBowl,
    description: "Hearty rice bowls for every craving",
  },
  {
    id: "meals",
    label: "Meals",
    icon: UtensilsCrossed,
    description: "Classic Filipino favorites",
  },
  {
    id: "silog",
    label: "Silog",
    icon: Egg,
    description: "Garlic rice, egg, and your choice of protein",
  },
  {
    id: "barkada",
    label: "Barkada & Bundles",
    icon: Users,
    description: "Share the feast with friends",
  },
  {
    id: "soup",
    label: "Soup",
    icon: Soup,
    description: "Warm, comforting bowls",
  },
  {
    id: "noodles",
    label: "Noodles",
    icon: Flame,
    description: "Slurp-worthy classics",
  },
  {
    id: "pasta",
    label: "Pasta",
    icon: UtensilsCrossed,
    description: "Italian comfort food",
  },
  {
    id: "snacks",
    label: "Snacks",
    icon: Candy,
    description: "Bites between work sessions",
  },
  {
    id: "pamares",
    label: "Pamares",
    icon: IceCreamBowl,
    description: "Filipino meryenda staples",
  },
  {
    id: "healthy",
    label: "Healthy Options",
    icon: Leaf,
    description: "Guilt-free goodness",
  },
  {
    id: "drinks",
    label: "Drinks",
    icon: GlassWater,
    description: "Coffee, tea, shakes & more",
  },
];

const drinkSubCategories = [
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "non-coffee", label: "Non-Coffee", icon: Milk },
  { id: "milktea", label: "Milktea", icon: Milk },
  { id: "shake", label: "Shakes", icon: Candy },
  { id: "mocktails", label: "Mocktails", icon: GlassWater },
  { id: "cocktails", label: "Cocktails", icon: Martini },
  { id: "alcohol", label: "Alcohol", icon: Beer },
  { id: "carbonated", label: "Carbonated", icon: GlassWater },
];

// Sample data — replace with your actual menu items
const menuData: Record<string, MenuItem[]> = {
  bowls: [
    {
      name: "Chicken Teriyaki Bowl",
      description:
        "Grilled chicken thigh glazed with teriyaki, served over steamed rice with sautéed vegetables and sesame seeds.",
      variants: [
        { name: "Solo", price: "₱280" },
        { name: "Plate", price: "₱350" },
      ],
      image: "/images/menu/teriyaki-bowl.jpg",
      isPopular: true,
    },
    {
      name: "Chicken Curry Bowl",
      description:
        "Korean-style marinated beef with kimchi, pickled radish, and a sunny-side-up egg.",
      variants: [
        { name: "Solo", price: "₱320" },
        { name: "Plate", price: "₱390" },
      ],
      image: "/images/menu/bulgogi-bowl.jpg",
      isNew: true,
    },
    {
      name: "Pork Adobo Bowl",
      description:
        "Fresh salmon cubes, avocado, edamame, cucumber, and sesame over sushi rice.",
      price: "₱380",
      image: "/images/menu/poke-bowl.jpg",
      isPopular: true,
    },
    
    {
      name: "Pork Tonkatsu Bowl",
      description:
        "Korean-style marinated beef with kimchi, pickled radish, and a sunny-side-up egg.",
      variants: [
        { name: "Solo", price: "₱320" },
        { name: "Plate", price: "₱390" },
      ],
      image: "/images/menu/bulgogi-bowl.jpg",
      isNew: true,
    },
    
    {
      name: "Chopsuey Rice Bowl",
      description:
        "Korean-style marinated beef with kimchi, pickled radish, and a sunny-side-up egg.",
      variants: [
        { name: "Solo", price: "₱320" },
        { name: "Plate", price: "₱390" },
      ],
      image: "/images/menu/bulgogi-bowl.jpg",
      isNew: true,
    },
  ],
  silog: [
    {
      name: "Spamsilog",
      description:
        "Filipino-style cured beef tapa with garlic fried rice and egg. A breakfast classic.",
      variants: [
        { name: "Solo", price: "₱260" },
        { name: "Platter", price: "₱420" },
      ],
      image: "/images/menu/tapsilog.jpg",
      isPopular: true,
    },
    {
      name: "Tocinolog",
      description:
        "Crispy fried bangus (milkfish) with sinangag and fried egg.",
      variants: [
        { name: "Solo", price: "₱280" },
        { name: "Platter", price: "₱450" },
      ],
      image: "/images/menu/bangsilog.jpg",
    },
    {
      name: "Bangsilog",
      description: "Crispy fried chicken fillet with garlic rice and egg.",
      variants: [
        { name: "Solo", price: "₱240" },
        { name: "Platter", price: "₱380" },
      ],
      image: "/images/menu/chicksilog.jpg",
    },
    {
      name: "Tapsilog",
      description: "Crispy fried chicken fillet with garlic rice and egg.",
      variants: [
        { name: "Solo", price: "₱240" },
        { name: "Platter", price: "₱380" },
      ],
      image: "/images/menu/chicksilog.jpg",
    },
    {
      name: "Pork Sisig Silog",
      description: "Crispy fried chicken fillet with garlic rice and egg.",
      variants: [
        { name: "Solo", price: "₱240" },
        { name: "Platter", price: "₱380" },
      ],
      image: "/images/menu/chicksilog.jpg",
    },
  ],
  meals: [],
  barkada: [],
  soup: [],
  noodles: [],
  pasta: [],
  snacks: [],
  pamares: [],
  healthy: [],
  drinks: [],
};

const drinkData: Record<string, MenuItem[]> = {
  coffee: [
    {
      name: "Espresso",
      description: "Bold, rich, and perfectly pulled.",
      price: "₱120",
      image: "/images/menu/espresso.jpg",
      isPopular: true,
    },
    {
      name: "Caramel Macchiato",
      description: "Espresso with vanilla, steamed milk, and caramel drizzle.",
      price: "₱180",
      image: "/images/menu/caramel-macchiato.jpg",
    },
  ],
  "non-coffee": [],
  milktea: [],
  shake: [],
  mocktails: [],
  cocktails: [],
  alcohol: [],
  carbonated: [],
};

function EmptyState({ category }: { category: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
        <ChefHat className="h-8 w-8 text-stone-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-stone-900">Coming Soon</h3>
      <p className="max-w-sm text-stone-500">
        We&apos;re perfecting our {category} menu. Check back soon for delicious
        additions!
      </p>
    </div>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <Card className="group overflow-hidden border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-stone-900/5 pt-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {item.isPopular && (
            <Badge className="border-0 bg-[#F36509] text-xs font-bold text-white shadow-lg hover:bg-[#F36509]">
              <Star className="mr-1 h-3 w-3 fill-white" />
              Popular
            </Badge>
          )}
          {item.isNew && (
            <Badge className="border-0 bg-emerald-500 text-xs font-bold text-white shadow-lg hover:bg-emerald-500">
              New
            </Badge>
          )}
        </div>

        {/* Quick add */}
        <Button
          size="icon"
          className="absolute bottom-3 right-3 h-11 w-11 rounded-full bg-white text-stone-900 opacity-0 shadow-xl transition-all duration-300 group-hover:opacity-100 hover:bg-[#F36509] hover:text-white"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <CardContent className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl font-semibold leading-tight text-stone-900">
            {item.name}
          </h3>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-stone-500">
          {item.description}
        </p>

        {/* Price */}
        {item.variants ? (
          <div className="mb-4 space-y-2 rounded-xl bg-stone-50 p-3">
            {item.variants.map((v) => (
              <div key={v.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-600">
                  {v.name}
                </span>
                <span className="text-sm font-bold text-[#F36509]">
                  {v.price}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-xl font-bold text-[#F36509]">{item.price}</p>
        )}

        {/* Dietary badges */}
        <div className="flex flex-wrap gap-2">
          {item.isVegetarian && (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700"
            >
              <Leaf className="mr-1 h-3 w-3" />
              Vegetarian
            </Badge>
          )}
          {item.isSpicy && (
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-xs text-red-600"
            >
              <Flame className="mr-1 h-3 w-3" />
              Spicy
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryHeader({
  category,
}: {
  category: (typeof mainCategories)[number];
}) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F36509]/10">
        <category.icon className="h-6 w-6 text-[#F36509]" />
      </div>
      <div>
        <h2 className="font-serif text-3xl font-semibold tracking-tighter text-stone-900">
          {category.label}
        </h2>
        <p className="text-sm text-stone-500">{category.description}</p>
      </div>
    </div>
  );
}

export default function Menu() {
  const [activeTab, setActiveTab] = useState("bowls");
  const [activeDrinkSub, setActiveDrinkSub] = useState("coffee");

  const activeCategory = mainCategories.find((c) => c.id === activeTab)!;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-900 px-6 pb-20 pt-32 text-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#F36509]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <Badge
            variant="outline"
            className="mb-4 border-stone-600 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-400"
          >
            BISTRO & CAFÉ
          </Badge>
          <h1 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-white md:text-7xl">
            Our Menu
          </h1>
          <p className="mx-auto max-w-xl text-xl leading-relaxed text-stone-400">
            Authentic Filipino favorites, hearty meals, and refreshing drinks —
            made fresh and served with love.
          </p>
        </div>
      </section>

      {/* Main Menu */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Horizontal scrollable tab bar */}
            <div className="relative mb-10">
              <HorizontalScroll>
                <TabsList className="flex h-auto w-max min-w-full justify-start gap-2 rounded-2xl bg-white p-2 py-8 shadow-lg">
                  {mainCategories.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="shrink-0 rounded-xl px-5 py-6 text-sm font-semibold text-stone-500 transition-all data-[state=active]:bg-[#F36509] data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      <cat.icon className="mr-2 h-4 w-4" />
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </HorizontalScroll>
            </div>

            {/* Regular Categories */}
            {mainCategories
              .filter((cat) => cat.id !== "drinks")
              .map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-0 p-10">
                  <CategoryHeader category={cat} />

                  {menuData[cat.id]?.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {menuData[cat.id].map((item) => (
                        <MenuItemCard key={item.name} item={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState category={cat.label} />
                  )}
                </TabsContent>
              ))}

            {/* Drinks with Sub-tabs */}
            <TabsContent value="drinks" className="mt-0">
              <CategoryHeader category={activeCategory} />

              <Tabs value={activeDrinkSub} onValueChange={setActiveDrinkSub}>
                <TabsList className="mb-8 flex h-auto flex-wrap justify-start gap-2 rounded-xl bg-white p-2 shadow-md">
                  {drinkSubCategories.map((sub) => (
                    <TabsTrigger
                      key={sub.id}
                      value={sub.id}
                      className="rounded-full px-5 py-2.5 text-sm font-medium text-stone-500 transition-all data-[state=active]:bg-[#F36509] data-[state=active]:text-white"
                    >
                      <sub.icon className="mr-2 h-4 w-4" />
                      {sub.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {drinkSubCategories.map((sub) => (
                  <TabsContent key={sub.id} value={sub.id} className="mt-0">
                    {drinkData[sub.id]?.length > 0 ? (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {drinkData[sub.id].map((item) => (
                          <MenuItemCard key={item.name} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState category={sub.label} />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden bg-stone-900 px-6 py-20">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F36509]/10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509]/20">
            <Package className="h-7 w-7 text-[#F36509]" />
          </div>
          <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-white md:text-4xl">
            Can&apos;t decide? Try a Barkada Bundle.
          </h2>
          <p className="mb-8 text-stone-400">
            Perfect for groups of 4-6. Mix and match your favorites at a better
            price.
          </p>
          <Button
            size="lg"
            className="h-14 rounded-full bg-[#F36509] px-10 text-base font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
          >
            <a href="/reserve/table">Reserve a Table</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
