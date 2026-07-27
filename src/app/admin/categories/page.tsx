"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Search, Folder, FolderTree, Plus } from "lucide-react";
import { toast } from "sonner";
import { getCategories } from "@/lib/actions";
import CreateCategoryModal from "@/components/sections/CreateCategoryModal";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  parent_name?: string | null;
  // Add other fields from your schema as needed
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const result = await getCategories();
      if (result.success) {
        setCategories(result.data);
      } else {
        toast.error(result.error || "Failed to load categories");
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.parent_name &&
          cat.parent_name.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [categories, searchQuery]);

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  );

  const childCategories = useMemo(
    () => categories.filter((c) => !!c.parent_id),
    [categories],
  );

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Categories
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Manage your blog categories and hierarchy
          </p>
        </div>

        <CreateCategoryModal onCategoryCreated={fetchCategories} />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Categories
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {categories.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Parent Categories
            </p>
            <p className="mt-1 text-3xl font-semibold text-[#F36509]">
              {parentCategories.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Child Categories
            </p>
            <p className="mt-1 text-3xl font-semibold text-green-600">
              {childCategories.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Orphan / Root
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {parentCategories.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20"
        />
      </div>

      {/* Categories Table */}
      <Card className="mt-6 border-stone-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading categories...
              </span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-stone-900">
                {searchQuery ? "No matching categories" : "No categories yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first category to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pl-6 pr-4 text-left font-medium text-stone-500">
                      Category
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Slug
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Parent
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Description
                    </th>
                    <th className="py-3.5 pr-6 pl-4 text-right font-medium text-stone-500 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="group hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-[#F36509]/10 p-2">
                            {category.parent_id ? (
                              <Folder className="h-4 w-4 text-[#F36509]" />
                            ) : (
                              <FolderTree className="h-4 w-4 text-[#F36509]" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900">
                              {category.name}
                            </div>
                            <div className="text-xs text-stone-500 font-mono mt-0.5">
                              /categories/{category.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className="font-normal font-mono"
                        >
                          {category.slug}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {category.parent_name ? (
                          <Badge
                            variant="outline"
                            className="font-normal text-stone-600"
                          >
                            {category.parent_name}
                          </Badge>
                        ) : (
                          <span className="text-stone-400 text-xs">Root</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {category.description ? (
                          <span className="text-xs text-stone-600 line-clamp-1 max-w-xs">
                            {category.description}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Edit ${category.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
