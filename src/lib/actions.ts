"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
  post_count?: number;
}

interface PostTagJoin {
  blog_tags: Tag | null;
}

interface RawCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  parent: { name: string } | { name: string }[] | null;
}

// ==================== READ-ONLY CLIENT (for Server Components) ====================
async function createSupabaseClientForRead() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // IMPORTANT: Do NOT set cookies in read-only client
        setAll() {},
      },
    },
  );
}

// ==================== FULL CLIENT (for Server Actions) ====================
async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (err) {
            console.error("Cookie set error:", err);
          }
        },
      },
    },
  );
}

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  summary: z.string().optional().nullable(),
  content: z.string().min(1, "Content is required"),
  featured_image: z.string().url().optional().nullable().or(z.literal("")),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().uuid()).optional().default([]),
});

export async function createPost(formData: {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  featured_image?: string;
  category_id?: string | null;
  status: string;
  published_at?: string | null;
}) {
  try {
    const validated = createPostSchema.parse(formData);
    const supabase = await createSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to create a post",
      };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error("Fetch profile error:", profileError);
      return { success: false, error: profileError.message, data: [] };
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: profileData.id,
        title: validated.title,
        slug: validated.slug,
        summary: validated.summary || null,
        content: validated.content,
        featured_image: validated.featured_image || null,
        category_id: validated.category_id || null,
        status: validated.status,
        published_at: validated.published_at || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "23505") {
        return {
          success: false,
          error: "A post with this slug already exists",
        };
      }
      return { success: false, error: error.message };
    }

    if (validated.tags && validated.tags.length > 0) {
      const tagInserts = validated.tags.map((tagId) => ({
        post_id: data.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("post_tags")
        .insert(tagInserts);

      if (tagError) {
        console.error("Failed to attach tags:", tagError);
        // Don't fail the whole post creation
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/posts");

    return { success: true, data };
  } catch (error) {
    console.error("Create post error:", error);

    if (error instanceof z.ZodError) {
      // Fixed line:
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid input data",
      };
    }

    return {
      success: false,
      error: "Failed to create post. Please try again.",
    };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message.includes("Invalid login credentials")
          ? "Invalid email or password"
          : error.message,
      };
    }

    // Revalidate protected routes
    revalidatePath("/admin");
    revalidatePath("/admin/*");

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error("Unexpected login error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),

  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)",
    )
    .trim()
    .toLowerCase(),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),

  parent_id: z.string().uuid("Invalid parent ID").optional().nullable(),
});

export async function createCategory(formData: {
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
}) {
  try {
    const validated = createCategorySchema.parse(formData);
    const supabase = await createSupabaseClient();

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", validated.slug)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "A category with this slug already exists",
      };
    }

    const { data, error } = await supabase
      .from("blog_categories")
      .insert({
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        parent_id: validated.parent_id,
      })
      .select(
        `
        *,
        parent:blog_categories!parent_id_fkey (name)
      `,
      )
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/categories");

    return { success: true, data };
  } catch (error) {
    console.error("Create category error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }

    return { success: false, error: "Failed to create category" };
  }
}

export async function getCategories() {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("blog_categories")
      .select(
        `
        *,
        parent:blog_categories!parent_id(name)
      `,
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Fetch categories error:", error);
      return { success: false, error: error.message, data: [] };
    }

    const formatted =
      data?.map((cat: RawCategory) => {
        const parentObj = Array.isArray(cat.parent)
          ? cat.parent[0]
          : cat.parent;
        return {
          ...cat,
          parent_name: parentObj?.name || null,
          parent: undefined, // clean up
        };
      }) || [];

    return {
      success: true,
      data: formatted,
    };
  } catch (error) {
    console.error("Unexpected error in getCategories:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
      data: [],
    };
  }
}

export async function getPosts() {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey (
          full_name,
          email
        ),
        category:blog_categories!posts_category_id_fkey (name),
        post_tags!post_tags_post_id_fkey (
          blog_tags (
            id,
            name,
            slug
          )
        )
      `,
      )
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Fetch posts error:", error);
      return { success: false, error: error.message, data: [] };
    }

    const formatted =
      data?.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        featured_image: post.featured_image,
        published_at: post.published_at,

        author_name:
          post.author?.full_name ||
          post.author?.email?.split("@")[0] ||
          "Unknown",

        category_name: post.category?.name || null,

        // Format tags
        tags: post.post_tags
          ? post.post_tags
              .map((pt: PostTagJoin) => pt.blog_tags)
              .filter(Boolean)
          : [],

        // Cleanup
        author: undefined,
        category: undefined,
        post_tags: undefined,
      })) || [];

    return {
      success: true,
      data: formatted,
    };
  } catch (error) {
    console.error("Unexpected error in getPosts:", error);
    return {
      success: false,
      error: "Failed to fetch posts",
      data: [],
    };
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey (
          full_name,
          email
        ),
        category:blog_categories!posts_category_id_fkey (name),
        post_tags!post_tags_post_id_fkey (
          blog_tags (
            id,
            name,
            slug
          )
        )
      `,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return { success: false, error: "Post not found" };
    }

    const post = {
      ...data,
      author_name:
        data.author?.full_name ??
        data.author?.email?.split("@")[0] ??
        "Unknown",
      category_name: data.category?.name ?? null,
      tags:
        data.post_tags
          ?.map((pt: PostTagJoin) => pt.blog_tags)
          .filter(Boolean) ?? [],
      author: undefined,
      category: undefined,
      post_tags: undefined,
    };

    return { success: true, data: post };
  } catch (error) {
    console.error("Error fetching post:", error);
    return { success: false, error: "Failed to load post" };
  }
}

export async function updatePost(
  postId: string,
  formData: Partial<{
    title: string;
    slug: string;
    summary?: string | null;
    content: string;
    featured_image?: string | null;
    category_id?: string | null;
    status: "draft" | "published" | "archived";
    published_at?: string | null;
  }>,
) {
  try {
    const validated = createPostSchema.partial().parse(formData);
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("posts")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("author_id", user.id) // Important: ownership check
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Slug already taken" };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/posts");
    revalidatePath(`/blog/${validated.slug}`); // optional

    return { success: true, data };
  } catch (error) {
    console.error("Error updating post:", error);
    return { success: false, error: "Failed to update post" };
  }
}

export async function deletePost(postId: string) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("author_id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath("/admin/posts");

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be less than 50 characters")
    .trim(),

  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)",
    )
    .trim()
    .toLowerCase(),
});

export async function createTag(formData: { name: string; slug: string }) {
  try {
    const validated = createTagSchema.parse(formData);
    const supabase = await createSupabaseClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be logged in to create a tag",
      };
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug", validated.slug)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "A tag with this slug already exists",
      };
    }

    const { data, error } = await supabase
      .from("blog_tags")
      .insert({
        name: validated.name,
        slug: validated.slug,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase tag insert error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/tags");

    return { success: true, data };
  } catch (error) {
    console.error("Create tag error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }

    return { success: false, error: "Failed to create tag" };
  }
}

export async function getTags() {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("blog_tags")
      .select(
        `
        id,
        name,
        slug,
        created_at,
        updated_at,
        post_count: post_tags!inner(count)
      `,
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Fetch tags error:", error);
      return { success: false, error: error.message, data: [] };
    }

    // Transform post_count from { count: X } → X
    const formatted =
      data?.map((tag) => ({
        ...tag,
        post_count: tag.post_count?.[0]?.count || 0,
        posts: [],
      })) || [];

    return {
      success: true,
      data: formatted,
    };
  } catch (error) {
    console.error("Unexpected error in getTags:", error);
    return {
      success: false,
      error: "Failed to fetch tags",
      data: [],
    };
  }
}
