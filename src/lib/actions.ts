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

type BlogTag = {
  id: number;
  name: string;
  slug: string;
};

type PostTag = {
  blog_tags: BlogTag | null;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

type PostWithRelations = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  featured_image: string | null;
  published_at: string | null;
  blog_categories: Category | null;
  post_tags: PostTag[];
};

// ==================== READ-ONLY CLIENT (for Server Components) ====================
export async function createSupabaseClientForRead() {
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
export async function createSupabaseClient() {
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

export async function getPostsByCategory(categorySlug: string) {
  const supabase = await createSupabaseClientForRead();

  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        blog_categories!inner (
          id,
          name,
          slug
        ),
        post_tags (
          blog_tags (
            id,
            name,
            slug
          )
        )
      `,
      )
      .eq("status", "published")
      .eq("blog_categories.slug", categorySlug)
      .order("published_at", { ascending: false });

    if (error) throw error;

    const formattedPosts = data.map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      featured_image: post.featured_image,
      published_at: post.published_at,
      author_name: null,
      category_name: post.blog_categories?.name || null,
      tags: (post.post_tags || [])
        .map((pt: any) => pt.blog_tags)
        .filter(
          (tag: any): tag is { id: number; name: string; slug: string } =>
            !!tag && typeof tag.id === "number",
        ),
    }));

    const categoryName = data[0]?.blog_categories?.name || categorySlug;

    return {
      success: true,
      data: formattedPosts,
      categoryName,
    };
  } catch (error: any) {
    console.error("Error fetching posts by category:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch posts for this category",
      data: [],
      categoryName: categorySlug,
    };
  }
}

export async function getCommentsByPostId(postId: string) {
  const supabase = await createSupabaseClientForRead();

  const { data, error } = await supabase
    .from("blog_comments")
    .select(
      `
      id,
      content,
      author_name,
      author_email,
      user_id,
      parent_id,
      status,
      created_at
    `,
    )
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

// createComment
export async function createComment(formData: FormData) {
  "use server";

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const postId = formData.get("postId") as string;
  const content = (formData.get("content") as string)?.trim();
  const parentId = (formData.get("parentId") as string) || null;
  const authorName = (formData.get("authorName") as string)?.trim();
  const authorEmail = (formData.get("authorEmail") as string)?.trim();

  if (!postId || !content) {
    return { success: false, error: "Comment content is required" };
  }

  // Guest comments require name + email
  if (!user && (!authorName || !authorEmail)) {
    return {
      success: false,
      error: "Name and email are required for guest comments",
    };
  }

  const { error } = await supabase.from("blog_comments").insert({
    post_id: postId,
    user_id: user?.id ?? null,
    parent_id: parentId,
    author_name: user ? null : authorName,
    author_email: user ? null : authorEmail,
    content,
    status: "pending", // or "approved" if you want auto-approve
  });

  if (error) {
    return { success: false, error: error.message };
  }

  //revalidatePath(`/blogs/${/* you may need the slug here */}`); // or use the post slug
  return { success: true };
}

export async function getAllComments() {
  const supabase = await createSupabaseClientForRead();

  const { data, error } = await supabase
    .from("blog_comments")
    .select(
      `
      id,
      content,
      author_name,
      author_email,
      user_id,
      parent_id,
      status,
      created_at,
      post_id,
      post:posts (
        id,
        title,
        slug
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

export async function updateComment(
  id: string,
  data: {
    content?: string;
    author_name?: string;
    author_email?: string;
    status?: "pending" | "approved" | "spam" | "rejected";
  },
) {
  const supabase = await createSupabaseClient();

  const { data: updated, error } = await supabase
    .from("blog_comments")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: updated };
}

export async function deleteComment(id: string) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.from("blog_comments").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function approveComment(id: string) {
  const supabase = await createSupabaseClient();

  const { data: updated, error } = await supabase
    .from("blog_comments")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: updated };
}

export async function rejectComment(id: string) {
  const supabase = await createSupabaseClient();

  const { data: updated, error } = await supabase
    .from("blog_comments")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: updated };
}

export async function markCommentAsSpam(id: string) {
  const supabase = await createSupabaseClient();

  const { data: updated, error } = await supabase
    .from("blog_comments")
    .update({
      status: "spam",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: updated };
}

type Zone = "bistro" | "study" | "room";
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "rejected"
  | "cancelled"
  | "no_show";

interface Reservation {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  pax: number;
  zone: Zone;
  start_at: string;
  end_at: string;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type GetReservationsOptions = {
  status?: ReservationStatus | ReservationStatus[];
  zone?: Zone | Zone[];
  from?: string; // ISO date
  to?: string; // ISO date
  limit?: number;
};

const reservationSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  pax: z.coerce.number().min(1).max(50),
  zone: z.enum(["bistro", "study", "room"]),
  start_at: z.string().datetime(), // ISO string from the client
  end_at: z.string().datetime(),
  notes: z.string().optional(),
  status: z
    .enum([
      "pending",
      "confirmed",
      "seated",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),
  mode: z.enum(["admin", "client"]),
});

export type CreateReservationState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createReservation(
  _prevState: CreateReservationState | null,
  formData: FormData,
): Promise<CreateReservationState> {
  const raw = {
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    pax: formData.get("pax"),
    zone: formData.get("zone"),
    start_at: formData.get("start_at"),
    end_at: formData.get("end_at"),
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || undefined,
    mode: formData.get("mode"),
  };

  const parsed = reservationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { mode, ...data } = parsed.data;

  const payload = {
    ...data,
    status: mode === "client" ? "pending" : (data.status ?? "pending"),
  };

  const supabase = await createSupabaseClient();

  const { error } = await supabase.from("reservations").insert(payload);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/reservations");
  revalidatePath("/");

  return {
    success: true,
    message:
      mode === "client"
        ? "Reservation submitted successfully."
        : "Reservation created successfully.",
  };
}

export async function getReservations(options: GetReservationsOptions = {}) {
  try {
    const supabase = await createSupabaseClientForRead();

    let query = supabase
      .from("reservations")
      .select("*")
      .order("start_at", { ascending: true });

    // Status filter
    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in("status", options.status);
      } else {
        query = query.eq("status", options.status);
      }
    }

    // Zone filter
    if (options.zone) {
      if (Array.isArray(options.zone)) {
        query = query.in("zone", options.zone);
      } else {
        query = query.eq("zone", options.zone);
      }
    }

    // Date range (on start_at)
    if (options.from) {
      query = query.gte("start_at", options.from);
    }
    if (options.to) {
      query = query.lte("start_at", options.to);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch reservations error:", error);
      return {
        success: false,
        error: error.message,
        data: [] as Reservation[],
      };
    }

    return {
      success: true,
      data: (data ?? []) as Reservation[],
    };
  } catch (error) {
    console.error("Unexpected error in getReservations:", error);
    return {
      success: false,
      error: "Failed to fetch reservations",
      data: [] as Reservation[],
    };
  }
}

// ==================== TABLES & ROOMS ====================

type TableZone = "bistro" | "coworking";

interface Table {
  id: string;
  table_number: string;
  seats: number;
  zone: TableZone;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Room {
  id: string;
  name: string;
  seats: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateTableInput = {
  table_number: string;
  seats: number;
  zone: string;
  is_active?: boolean;
};

export type UpdateTableInput = Partial<CreateTableInput>;

const createTableSchema = z.object({
  table_number: z.string().min(1, "Table number is required").max(20),
  seats: z.coerce.number().min(1).max(20),
  zone: z.enum(["bistro", "coworking"]),
});

const createRoomSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  seats: z.coerce.number().min(1).max(50),
  description: z.string().max(500).optional().nullable(),
});

export async function getTables() {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("zone")
      .order("table_number");

    if (error) {
      console.error("Fetch tables error:", error);
      return { success: false, error: error.message, data: [] as Table[] };
    }

    return { success: true, data: (data ?? []) as Table[] };
  } catch (error) {
    console.error("Unexpected error in getTables:", error);
    return {
      success: false,
      error: "Failed to fetch tables",
      data: [] as Table[],
    };
  }
}

export async function getRooms() {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("name");

    if (error) {
      console.error("Fetch rooms error:", error);
      return { success: false, error: error.message, data: [] as Room[] };
    }

    return { success: true, data: (data ?? []) as Room[] };
  } catch (error) {
    console.error("Unexpected error in getRooms:", error);
    return {
      success: false,
      error: "Failed to fetch rooms",
      data: [] as Room[],
    };
  }
}

export async function createTable(formData: {
  table_number: string;
  seats: number;
  zone: TableZone;
}) {
  try {
    const validated = createTableSchema.parse(formData);
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Optional: check unique table_number per zone
    const { data: existing } = await supabase
      .from("tables")
      .select("id")
      .eq("table_number", validated.table_number)
      .eq("zone", validated.zone)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "A table with this number already exists in this zone",
      };
    }

    const { data, error } = await supabase
      .from("tables")
      .insert({
        table_number: validated.table_number,
        seats: validated.seats,
        zone: validated.zone,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/spaces");
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return { success: false, error: "Failed to create table" };
  }
}

export async function createRoom(formData: {
  name: string;
  seats: number;
  description?: string | null;
}) {
  try {
    const validated = createRoomSchema.parse(formData);
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        name: validated.name,
        seats: validated.seats,
        description: validated.description ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/spaces");
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return { success: false, error: "Failed to create room" };
  }
}

export async function toggleTableActive(id: string, isActive: boolean) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("tables")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/spaces");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update table" };
  }
}

export async function toggleRoomActive(id: string, isActive: boolean) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("rooms")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/spaces");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update room" };
  }
}

// ==================== RESERVATION ASSIGNMENTS ====================

export async function assignTableToReservation(
  reservationId: string,
  tableId: string,
) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Optional: prevent assigning the same table twice
    const { data: existing } = await supabase
      .from("reservation_tables")
      .select("reservation_id")
      .eq("reservation_id", reservationId)
      .eq("table_id", tableId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "Table already assigned to this reservation",
      };
    }

    const { error } = await supabase.from("reservation_tables").insert({
      reservation_id: reservationId,
      table_id: tableId,
    });

    if (error) return { success: false, error: error.message };

    // Mark table as occupied
    await supabase
      .from("tables")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", tableId);

    await supabase
      .from("reservations")
      .update({
        status: "seated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId);

    revalidatePath("/admin/spaces");
    return { success: true };
  } catch (error) {
    console.error("assignTableToReservation error:", error);
    return { success: false, error: "Failed to assign table" };
  }
}

export async function assignRoomToReservation(
  reservationId: string,
  roomId: string,
) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: existing } = await supabase
      .from("reservation_rooms")
      .select("reservation_id")
      .eq("reservation_id", reservationId)
      .eq("room_id", roomId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "Room already assigned to this reservation",
      };
    }

    const { error } = await supabase.from("reservation_rooms").insert({
      reservation_id: reservationId,
      room_id: roomId,
    });

    if (error) return { success: false, error: error.message };

    // Mark room as occupied
    await supabase
      .from("rooms")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", roomId);

    await supabase
      .from("reservations")
      .update({
        status: "seated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId);

    revalidatePath("/admin/spaces");
    return { success: true };
  } catch (error) {
    console.error("assignRoomToReservation error:", error);
    return { success: false, error: "Failed to assign room" };
  }
}

export async function unassignTable(reservationId: string, tableId: string) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("reservation_tables")
      .delete()
      .eq("reservation_id", reservationId)
      .eq("table_id", tableId);

    if (error) return { success: false, error: error.message };

    // Free the table
    await supabase
      .from("tables")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", tableId);

    revalidatePath("/admin/spaces");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to unassign table" };
  }
}

export async function unassignRoom(reservationId: string, roomId: string) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("reservation_rooms")
      .delete()
      .eq("reservation_id", reservationId)
      .eq("room_id", roomId);

    if (error) return { success: false, error: error.message };

    // Free the room
    await supabase
      .from("rooms")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", roomId);

    revalidatePath("/admin/spaces");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to unassign room" };
  }
}

// ==================== FETCH ASSIGNMENTS ====================

export async function getAssignedTables(reservationId: string) {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("reservation_tables")
      .select(
        `
        table_id,
        tables (
          id,
          table_number,
          seats,
          zone,
          is_active
        )
      `,
      )
      .eq("reservation_id", reservationId);

    if (error) {
      console.error("Fetch assigned tables error:", error);
      return { success: false, error: error.message, data: [] as Table[] };
    }

    const tables: Table[] =
      data
        ?.map((row) => {
          const t = row.tables;
          // Supabase sometimes returns the relation as an array
          const table = Array.isArray(t) ? t[0] : t;
          return table as Table | null;
        })
        .filter((t): t is Table => t != null) ?? [];

    return { success: true, data: tables };
  } catch (error) {
    console.error("Unexpected error in getAssignedTables:", error);
    return {
      success: false,
      error: "Failed to fetch assigned tables",
      data: [] as Table[],
    };
  }
}

export async function getAssignedRooms(reservationId: string) {
  try {
    const supabase = await createSupabaseClientForRead();

    const { data, error } = await supabase
      .from("reservation_rooms")
      .select(
        `
        room_id,
        rooms (
          id,
          name,
          seats,
          description,
          is_active
        )
      `,
      )
      .eq("reservation_id", reservationId);

    if (error) {
      console.error("Fetch assigned rooms error:", error);
      return { success: false, error: error.message, data: [] as Room[] };
    }

    const rooms: Room[] =
      data
        ?.map((row) => {
          const r = row.rooms;
          const room = Array.isArray(r) ? r[0] : r;
          return room as Room | null;
        })
        .filter((r): r is Room => r != null) ?? [];

    return { success: true, data: rooms };
  } catch (error) {
    console.error("Unexpected error in getAssignedRooms:", error);
    return {
      success: false,
      error: "Failed to fetch assigned rooms",
      data: [] as Room[],
    };
  }
}

export async function getReservationsWithAssignments(
  options: GetReservationsOptions = {},
) {
  try {
    const supabase = await createSupabaseClientForRead();

    let query = supabase
      .from("reservations")
      .select(
        `
        *,
        reservation_tables (
          tables (
            id,
            table_number,
            seats,
            zone,
            is_active
          )
        ),
        reservation_rooms (
          rooms (
            id,
            name,
            seats,
            description,
            is_active
          )
        )
      `,
      )
      .order("start_at", { ascending: true });

    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in("status", options.status);
      } else {
        query = query.eq("status", options.status);
      }
    }
    if (options.zone) {
      if (Array.isArray(options.zone)) {
        query = query.in("zone", options.zone);
      } else {
        query = query.eq("zone", options.zone);
      }
    }
    if (options.from) query = query.gte("start_at", options.from);
    if (options.to) query = query.lte("start_at", options.to);
    if (options.limit) query = query.limit(options.limit);

    const { data, error } = await query;

    if (error) {
      console.error("Fetch reservations with assignments error:", error);
      return { success: false, error: error.message, data: [] };
    }

    const formatted =
      data?.map((row) => {
        const tables =
          row.reservation_tables
            ?.map((rt: any) => {
              const t = rt.tables;
              return Array.isArray(t) ? t[0] : t;
            })
            .filter(Boolean) ?? [];

        const rooms =
          row.reservation_rooms
            ?.map((rr: any) => {
              const r = rr.rooms;
              return Array.isArray(r) ? r[0] : r;
            })
            .filter(Boolean) ?? [];

        const { reservation_tables, reservation_rooms, ...rest } = row;

        return {
          ...rest,
          assigned_tables: tables as Table[],
          assigned_rooms: rooms as Room[],
        };
      }) ?? [];

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Unexpected error in getReservationsWithAssignments:", error);
    return {
      success: false,
      error: "Failed to fetch reservations",
      data: [],
    };
  }
}

export async function updateReservation(
  id: string,
  data: {
    full_name?: string;
    email?: string;
    phone?: string | null;
    pax?: number;
    zone?: "bistro" | "study" | "room";
    start_at?: string;
    end_at?: string;
    notes?: string | null;
    status?:
      | "pending"
      | "confirmed"
      | "seated"
      | "completed"
      | "rejeced"
      | "cancelled"
      | "no_show";
  },
) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: updated, error } = await supabase
      .from("reservations")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/reservations");
    revalidatePath("/admin/reservations/calendar");

    return { success: true, data: updated };
  } catch (error) {
    console.error("updateReservation error:", error);
    return { success: false, error: "Failed to update reservation" };
  }
}

export async function updateReservationStatus(
  id: string,
  status:
    | "pending"
    | "confirmed"
    | "seated"
    | "completed"
    | "cancelled"
    | "no_show",
) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("reservations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false as const, message: error.message };
  }

  revalidatePath("/admin/reservations");
  revalidatePath("/admin/reservations/calendar");

  return { success: true as const };
}

export async function logoutUser() {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export type CurrentUser = {
  full_name: string;
  email: string;
  initials: string;
  avatarUrl?: string | null;
};

function getInitials(name: string | null | undefined, email?: string | null) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // Prefer profile row (your table)
  const { data: profile } = await supabase
    .from("profiles") // change if your table name differs
    .select("full_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const full_name =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User";

  const email = profile?.email || user.email || "";

  return {
    full_name,
    email,
    initials: getInitials(full_name, email),
    avatarUrl: null,
  };
}
