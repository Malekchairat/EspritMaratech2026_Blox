import { eq, and, desc, inArray, like, sql, count, gte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { InsertUser, users, cases, casePhotos, donations, events, favorites, posts, postImages, likes, comments, follows, influencers, influencerCases, memberships, meetings, meetingParticipants, passwordResetTokens, webauthnCredentials, faceDescriptors, payments, impactScenarios, notifications } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      _db = drizzle(sql);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash", "avatar", "bio", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Cases queries
export async function getCases(filters?: {
  category?: string;
  status?: string;
  isUrgent?: boolean;
  search?: string;
  includeAll?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  // By default only show approved cases (unless includeAll is set for admin)
  if (!filters?.includeAll) {
    conditions.push(eq(cases.status, "approved"));
  }

  if (filters?.category) {
    conditions.push(eq(cases.category, filters.category as any));
  }

  if (filters?.status) {
    conditions.push(eq(cases.status, filters.status as any));
  }

  if (conditions.length > 0) {
    return await db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt));
  }

  return await db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCasePhotos(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(casePhotos).where(eq(casePhotos.caseId, caseId));
  return result;
}

export async function createCase(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cases).values(data);
  return result;
}

export async function updateCase(id: number, data: Partial<{
  title: string;
  description: string;
  category?: any;
  coverImage: string | null;
  cha9a9aLink: string;
  targetAmount: number;
  isUrgent: boolean;
  associationName: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cases).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(cases.id, id));

  return await getCaseById(id);
}

export async function getDonationsByCase(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(donations).where(eq(donations.caseId, caseId));
  return result;
}

export async function getDonationsByDonor(donorId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(donations).where(eq(donations.donorId, donorId));
  return result;
}

export async function getEvents() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(events);
  return result;
}

// Admin queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users);
  return result;
}

export async function updateUserRole(userId: number, role: "donor" | "association" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateCaseStatus(caseId: number, status: "pending" | "approved" | "rejected" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cases).set({ status }).where(eq(cases.id, caseId));
}

export async function deleteCase(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cases).where(eq(cases.id, caseId));
}

// Association queries
export async function getCasesByAssociation(associationId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(cases).where(eq(cases.associationId, associationId));
  return result;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    phone: users.phone,
    bio: users.bio,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Full user record (including openId) for internal auth flows */
export async function getFullUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function adminCreateUser(data: {
  name: string;
  email: string;
  role: "donor" | "association" | "admin";
  phone?: string | null;
  bio?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");
  const openId = `admin-created-${nanoid()}`;

  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    role: data.role,
    phone: data.phone ?? null,
    bio: data.bio ?? null,
    loginMethod: "admin-created",
  }).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  });
  return result[0];
}

export async function adminUpdateUser(userId: number, data: {
  name?: string;
  email?: string;
  role?: "donor" | "association" | "admin";
  phone?: string | null;
  bio?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.bio !== undefined) updateData.bio = data.bio;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function adminDeleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, userId));
}

// Favorites queries
export async function getFavoritesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(favorites).where(eq(favorites.userId, userId));
  return result;
}

export async function toggleFavorite(userId: number, caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.caseId, caseId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.caseId, caseId))
    );
    return { saved: false };
  } else {
    await db.insert(favorites).values({ userId, caseId });
    return { saved: true };
  }
}

export async function isCaseFavorited(userId: number, caseId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.caseId, caseId)))
    .limit(1);

  return result.length > 0;
}

export async function getFavoritesWithCases(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    favoriteId: favorites.id,
    savedAt: favorites.createdAt,
    caseId: cases.id,
    title: cases.title,
    description: cases.description,
    category: cases.category,
    coverImage: cases.coverImage,
    targetAmount: cases.targetAmount,
    currentAmount: cases.currentAmount,
    isUrgent: cases.isUrgent,
    status: cases.status,
  })
    .from(favorites)
    .innerJoin(cases, eq(favorites.caseId, cases.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return result;
}

// Profile queries
export async function updateUserProfile(userId: number, data: {
  name?: string;
  phone?: string | null;
  bio?: string | null;
  avatar?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ── Social: Posts ──────────────────────────────────────────────

export async function createPost(data: {
  associationId: number;
  content: string;
  type: "photo" | "event" | "activity";
  imageUrls?: string[];
  videoUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(posts).values({
    associationId: data.associationId,
    content: data.content,
    type: data.type,
    videoUrl: data.videoUrl || null,
  }).returning();

  const post = result[0];

  if (data.imageUrls && data.imageUrls.length > 0) {
    await db.insert(postImages).values(
      data.imageUrls.map((url, i) => ({
        postId: post.id,
        imageUrl: url,
        displayOrder: i,
      }))
    );
  }

  return post;
}

export async function updatePost(postId: number, associationId: number, data: {
  content?: string;
  type?: "photo" | "event" | "activity";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.content !== undefined) updateData.content = data.content;
  if (data.type !== undefined) updateData.type = data.type;

  await db.update(posts).set(updateData).where(
    and(eq(posts.id, postId), eq(posts.associationId, associationId))
  );
}

export async function deletePost(postId: number, associationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete related data first
  await db.delete(comments).where(eq(comments.postId, postId));
  await db.delete(likes).where(eq(likes.postId, postId));
  await db.delete(postImages).where(eq(postImages.postId, postId));
  await db.delete(posts).where(
    and(eq(posts.id, postId), eq(posts.associationId, associationId))
  );
}

export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({
    id: posts.id,
    associationId: posts.associationId,
    content: posts.content,
    type: posts.type,
    videoUrl: posts.videoUrl,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    authorName: users.name,
    authorAvatar: users.avatar,
  })
    .from(posts)
    .innerJoin(users, eq(posts.associationId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (result.length === 0) return undefined;

  const images = await db.select().from(postImages)
    .where(eq(postImages.postId, postId))
    .orderBy(postImages.displayOrder);

  const likesCount = await db.select({ count: count() })
    .from(likes).where(eq(likes.postId, postId));

  const commentsCount = await db.select({ count: count() })
    .from(comments).where(eq(comments.postId, postId));

  return {
    ...result[0],
    images,
    likesCount: likesCount[0]?.count ?? 0,
    commentsCount: commentsCount[0]?.count ?? 0,
  };
}

export async function getPostsByAssociation(associationId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: posts.id,
    associationId: posts.associationId,
    content: posts.content,
    type: posts.type,
    videoUrl: posts.videoUrl,
    createdAt: posts.createdAt,
    authorName: users.name,
    authorAvatar: users.avatar,
  })
    .from(posts)
    .innerJoin(users, eq(posts.associationId, users.id))
    .where(eq(posts.associationId, associationId))
    .orderBy(desc(posts.createdAt));

  // Get images, likes, comments count for each post
  const postIds = result.map(p => p.id);
  if (postIds.length === 0) return [];

  const allImages = await db.select().from(postImages)
    .where(inArray(postImages.postId, postIds))
    .orderBy(postImages.displayOrder);

  const allLikes = await db.select({
    postId: likes.postId,
    count: count(),
  }).from(likes)
    .where(inArray(likes.postId, postIds))
    .groupBy(likes.postId);

  const allComments = await db.select({
    postId: comments.postId,
    count: count(),
  }).from(comments)
    .where(inArray(comments.postId, postIds))
    .groupBy(comments.postId);

  const imagesMap = new Map<number, typeof allImages>();
  allImages.forEach(img => {
    const arr = imagesMap.get(img.postId) || [];
    arr.push(img);
    imagesMap.set(img.postId, arr);
  });

  const likesMap = new Map(allLikes.map(l => [l.postId, l.count]));
  const commentsMap = new Map(allComments.map(c => [c.postId, c.count]));

  return result.map(post => ({
    ...post,
    images: imagesMap.get(post.id) || [],
    likesCount: likesMap.get(post.id) ?? 0,
    commentsCount: commentsMap.get(post.id) ?? 0,
  }));
}

export async function getFeedPosts(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  // Get IDs of associations the user follows
  const followedIds = await db.select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  if (followedIds.length === 0) return [];

  const ids = followedIds.map(f => f.followingId);

  const result = await db.select({
    id: posts.id,
    associationId: posts.associationId,
    content: posts.content,
    type: posts.type,
    videoUrl: posts.videoUrl,
    createdAt: posts.createdAt,
    authorName: users.name,
    authorAvatar: users.avatar,
  })
    .from(posts)
    .innerJoin(users, eq(posts.associationId, users.id))
    .where(inArray(posts.associationId, ids))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  const postIds = result.map(p => p.id);
  if (postIds.length === 0) return [];

  const allImages = await db.select().from(postImages)
    .where(inArray(postImages.postId, postIds))
    .orderBy(postImages.displayOrder);

  const allLikes = await db.select({
    postId: likes.postId,
    count: count(),
  }).from(likes)
    .where(inArray(likes.postId, postIds))
    .groupBy(likes.postId);

  const allComments = await db.select({
    postId: comments.postId,
    count: count(),
  }).from(comments)
    .where(inArray(comments.postId, postIds))
    .groupBy(comments.postId);

  // Check which posts the current user liked
  const userLikes = await db.select({ postId: likes.postId })
    .from(likes)
    .where(and(inArray(likes.postId, postIds), eq(likes.userId, userId)));
  const likedSet = new Set(userLikes.map(l => l.postId));

  const imagesMap = new Map<number, typeof allImages>();
  allImages.forEach(img => {
    const arr = imagesMap.get(img.postId) || [];
    arr.push(img);
    imagesMap.set(img.postId, arr);
  });
  const likesMap = new Map(allLikes.map(l => [l.postId, l.count]));
  const commentsMap = new Map(allComments.map(c => [c.postId, c.count]));

  return result.map(post => ({
    ...post,
    images: imagesMap.get(post.id) || [],
    likesCount: likesMap.get(post.id) ?? 0,
    commentsCount: commentsMap.get(post.id) ?? 0,
    isLiked: likedSet.has(post.id),
  }));
}

// ── Social: Likes ──────────────────────────────────────────────

export async function toggleLike(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    return { liked: false };
  } else {
    await db.insert(likes).values({ postId, userId });
    return { liked: true };
  }
}

export async function isPostLiked(postId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);

  return result.length > 0;
}

export async function getLikesCount(postId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() })
    .from(likes).where(eq(likes.postId, postId));

  return result[0]?.count ?? 0;
}

// ── Social: Comments ──────────────────────────────────────────────

export async function createComment(postId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(comments).values({ postId, userId, content }).returning();
  return result[0];
}

export async function deleteComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(comments).where(
    and(eq(comments.id, commentId), eq(comments.userId, userId))
  );
}

export async function getCommentsByPost(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: comments.id,
    postId: comments.postId,
    userId: comments.userId,
    content: comments.content,
    createdAt: comments.createdAt,
    userName: users.name,
    userAvatar: users.avatar,
  })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
}

// ── Social: Follows ──────────────────────────────────────────────

export async function toggleFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
    return { following: false };
  } else {
    await db.insert(follows).values({ followerId, followingId });
    return { following: true };
  }
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);

  return result.length > 0;
}

export async function getFollowersCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() })
    .from(follows).where(eq(follows.followingId, userId));

  return result[0]?.count ?? 0;
}

export async function getFollowingCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() })
    .from(follows).where(eq(follows.followerId, userId));

  return result[0]?.count ?? 0;
}

export async function getFollowingIds(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ followingId: follows.followingId })
    .from(follows).where(eq(follows.followerId, userId));

  return result.map(r => r.followingId);
}

export async function searchAssociations(query?: string) {
  const db = await getDb();
  if (!db) return [];

  let q = db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    avatar: users.avatar,
    bio: users.bio,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.role, "association"));

  const result = await q;

  // Filter by search query in-memory since drizzle+neon ilike can be tricky
  if (query && query.trim()) {
    const lower = query.toLowerCase();
    return result.filter(u =>
      u.name?.toLowerCase().includes(lower) ||
      u.bio?.toLowerCase().includes(lower)
    );
  }

  return result;
}

export async function getAssociationProfile(associationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    avatar: users.avatar,
    bio: users.bio,
    phone: users.phone,
    createdAt: users.createdAt,
  }).from(users).where(
    and(eq(users.id, associationId), eq(users.role, "association"))
  ).limit(1);

  if (result.length === 0) return undefined;

  const followersCount = await getFollowersCount(associationId);
  const postsCount = await db.select({ count: count() })
    .from(posts).where(eq(posts.associationId, associationId));

  return {
    ...result[0],
    followersCount,
    postsCount: postsCount[0]?.count ?? 0,
  };
}

// ── Influencer / Sponsor Solidaire ──────────────────────────────

export async function createInfluencer(data: {
  name: string;
  type?: "influencer" | "sponsor";
  photo?: string;
  socialLinks?: string;
  solidarityMessage?: string;
  isApproved?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(influencers).values({
    name: data.name,
    type: (data.type as any) ?? "influencer",
    photo: data.photo ?? null,
    socialLinks: data.socialLinks ?? null,
    solidarityMessage: data.solidarityMessage ?? null,
    isApproved: data.isApproved ?? false,
  }).returning();
  return result[0];
}

export async function updateInfluencer(id: number, data: {
  name?: string;
  type?: "influencer" | "sponsor";
  photo?: string | null;
  socialLinks?: string | null;
  solidarityMessage?: string | null;
  isApproved?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(influencers).set({
    ...data,
    type: data.type as any,
    updatedAt: new Date(),
  }).where(eq(influencers.id, id));
}

export async function deleteInfluencer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove all case links first
  await db.delete(influencerCases).where(eq(influencerCases.influencerId, id));
  await db.delete(influencers).where(eq(influencers.id, id));
}

export async function getAllInfluencers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(influencers).orderBy(desc(influencers.createdAt));
}

export async function getInfluencerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(influencers).where(eq(influencers.id, id)).limit(1);
  return result[0];
}

export async function linkInfluencerToCase(influencerId: number, caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(influencerCases).values({ influencerId, caseId }).onConflictDoNothing();
}

export async function unlinkInfluencerFromCase(influencerId: number, caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(influencerCases).where(
    and(eq(influencerCases.influencerId, influencerId), eq(influencerCases.caseId, caseId))
  );
}

export async function getInfluencersByCase(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: influencers.id,
      name: influencers.name,
      type: influencers.type,
      photo: influencers.photo,
      socialLinks: influencers.socialLinks,
      solidarityMessage: influencers.solidarityMessage,
      isApproved: influencers.isApproved,
    })
    .from(influencerCases)
    .innerJoin(influencers, eq(influencerCases.influencerId, influencers.id))
    .where(and(eq(influencerCases.caseId, caseId), eq(influencers.isApproved, true)));
  return rows;
}

export async function getCasesByInfluencer(influencerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: cases.id,
      title: cases.title,
      category: cases.category,
      status: cases.status,
    })
    .from(influencerCases)
    .innerJoin(cases, eq(influencerCases.caseId, cases.id))
    .where(eq(influencerCases.influencerId, influencerId));
  return rows;
}

export async function getLinkedCaseIds(influencerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ caseId: influencerCases.caseId })
    .from(influencerCases)
    .where(eq(influencerCases.influencerId, influencerId));
  return rows.map(r => r.caseId);
}

// ── Membership functions ──────────────────────────────────────

function computeTier(totalDonated: number): "bronze" | "silver" | "gold" | "platinum" {
  if (totalDonated >= 50000) return "platinum";
  if (totalDonated >= 20000) return "gold";
  if (totalDonated >= 5000) return "silver";
  return "bronze";
}

export async function joinMembership(userId: number, associationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if already exists
  const existing = await getMembership(userId, associationId);
  if (existing) {
    // If rejected, allow re-request
    if (existing.status === "rejected") {
      await db.update(memberships).set({ status: "pending", updatedAt: new Date() }).where(eq(memberships.id, existing.id));
      return { success: true, status: "pending" as const };
    }
    return { success: true, status: existing.status };
  }
  await db.insert(memberships).values({ userId, associationId, status: "pending" }).onConflictDoNothing();
  return { success: true, status: "pending" as const };
}

export async function leaveMembership(userId: number, associationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(memberships).where(
    and(eq(memberships.userId, userId), eq(memberships.associationId, associationId))
  );
  return { success: true };
}

export async function approveMembership(membershipId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(memberships).set({ status: "approved", updatedAt: new Date() }).where(eq(memberships.id, membershipId));
  return { success: true };
}

export async function rejectMembership(membershipId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(memberships).set({ status: "rejected", updatedAt: new Date() }).where(eq(memberships.id, membershipId));
  return { success: true };
}

export async function getMembershipById(membershipId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(memberships).where(eq(memberships.id, membershipId));
  return rows[0] ?? null;
}

export async function getMembership(userId: number, associationId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(memberships).where(
    and(eq(memberships.userId, userId), eq(memberships.associationId, associationId))
  );
  return rows[0] ?? null;
}

export async function getMembershipsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: memberships.id,
      associationId: memberships.associationId,
      tier: memberships.tier,
      totalDonated: memberships.totalDonated,
      joinedAt: memberships.joinedAt,
      status: memberships.status,
      associationName: users.name,
      associationAvatar: users.avatar,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.associationId, users.id))
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.joinedAt));
  return rows;
}

export async function getMembersByAssociation(associationId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      tier: memberships.tier,
      totalDonated: memberships.totalDonated,
      joinedAt: memberships.joinedAt,
      status: memberships.status,
      memberName: users.name,
      memberAvatar: users.avatar,
      memberEmail: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.associationId, associationId))
    .orderBy(desc(memberships.createdAt));
  return rows;
}

export async function getPendingMembershipsByAssociation(associationId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      joinedAt: memberships.joinedAt,
      status: memberships.status,
      memberName: users.name,
      memberAvatar: users.avatar,
      memberEmail: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(and(eq(memberships.associationId, associationId), eq(memberships.status, "pending")))
    .orderBy(desc(memberships.createdAt));
  return rows;
}

export async function getMemberCount(associationId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: count() }).from(memberships).where(
    and(eq(memberships.associationId, associationId), eq(memberships.status, "approved"))
  );
  return rows[0]?.count ?? 0;
}

export async function updateMembershipDonation(userId: number, associationId: number, amount: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await getMembership(userId, associationId);
  if (!existing) return;
  const newTotal = existing.totalDonated + amount;
  const newTier = computeTier(newTotal);
  await db.update(memberships).set({
    totalDonated: newTotal,
    tier: newTier,
    updatedAt: new Date(),
  }).where(eq(memberships.id, existing.id));
}

// ── Meeting functions ──────────────────────────────────────

export async function createMeeting(data: {
  title: string;
  description?: string;
  associationId: number;
  scheduledAt: Date;
  duration?: number;
  membersOnly?: boolean;
  maxParticipants?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const roomName = `universelle-${data.associationId}-${Date.now()}`;
  const rows = await db.insert(meetings).values({
    title: data.title,
    description: data.description ?? null,
    associationId: data.associationId,
    roomName,
    scheduledAt: data.scheduledAt,
    duration: data.duration ?? 60,
    membersOnly: data.membersOnly ?? true,
    maxParticipants: data.maxParticipants ?? 50,
  }).returning();
  return rows[0];
}

export async function getMeetingsByAssociation(associationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(meetings)
    .where(eq(meetings.associationId, associationId))
    .orderBy(desc(meetings.scheduledAt));
}

export async function getUpcomingMeetingsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all meetings from associations the user is a member of
  const memberAssociations = await db
    .select({ associationId: memberships.associationId })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "approved")));

  if (memberAssociations.length === 0) return [];

  const assocIds = memberAssociations.map(m => m.associationId);
  const rows = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      description: meetings.description,
      associationId: meetings.associationId,
      roomName: meetings.roomName,
      scheduledAt: meetings.scheduledAt,
      duration: meetings.duration,
      status: meetings.status,
      membersOnly: meetings.membersOnly,
      maxParticipants: meetings.maxParticipants,
      associationName: users.name,
      associationAvatar: users.avatar,
    })
    .from(meetings)
    .innerJoin(users, eq(meetings.associationId, users.id))
    .where(and(
      inArray(meetings.associationId, assocIds),
      inArray(meetings.status, ["scheduled", "live"]),
    ))
    .orderBy(meetings.scheduledAt);
  return rows;
}

export async function getMeetingById(meetingId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(meetings).where(eq(meetings.id, meetingId));
  return rows[0] ?? null;
}

export async function updateMeetingStatus(meetingId: number, status: "scheduled" | "live" | "ended" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meetings).set({ status, updatedAt: new Date() }).where(eq(meetings.id, meetingId));
}

export async function joinMeeting(meetingId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(meetingParticipants).values({ meetingId, userId }).onConflictDoNothing();
  return { success: true };
}

export async function getMeetingParticipantCount(meetingId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: count() }).from(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId));
  return rows[0]?.count ?? 0;
}

export async function deleteMeeting(meetingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId));
  await db.delete(meetings).where(eq(meetings.id, meetingId));
  return { success: true };
}

// ── Email recipient helpers ────────────────────────────────────

/** Get emails of all approved members of an association */
export async function getApprovedMemberEmails(associationId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ email: users.email })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(and(eq(memberships.associationId, associationId), eq(memberships.status, "approved")));
  return rows.map(r => r.email).filter(Boolean) as string[];
}

/** Get emails of all followers of an association */
export async function getFollowerEmails(associationId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ email: users.email })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, associationId));
  return rows.map(r => r.email).filter(Boolean) as string[];
}

// ── Password Reset Tokens ────────────────────────────────────

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Invalidate any existing unused tokens for this user
  await db.update(passwordResetTokens)
    .set({ used: true })
    .where(and(eq(passwordResetTokens.userId, userId), eq(passwordResetTokens.used, false)));
  // Create new token
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(passwordResetTokens).where(
    and(
      eq(passwordResetTokens.token, token),
      eq(passwordResetTokens.used, false),
      gte(passwordResetTokens.expiresAt, new Date()),
    )
  );
  return rows[0] ?? null;
}

export async function markResetTokenUsed(tokenId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, tokenId));
}

// ── WebAuthn Credentials ────────────────────────────────────

export async function createWebauthnCredential(data: {
  userId: number;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string;
  deviceName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(webauthnCredentials).values({
    userId: data.userId,
    credentialId: data.credentialId,
    publicKey: data.publicKey,
    counter: data.counter,
    transports: data.transports || null,
    deviceName: data.deviceName || "Mon appareil",
  });
}

export async function getWebauthnCredentialsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));
}

export async function getWebauthnCredentialByCredentialId(credentialId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.credentialId, credentialId));
  return rows[0] ?? null;
}

export async function getAllWebauthnCredentials() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    credentialId: webauthnCredentials.credentialId,
    userId: webauthnCredentials.userId,
    transports: webauthnCredentials.transports,
  }).from(webauthnCredentials);
}

export async function updateWebauthnCredentialCounter(credentialId: string, counter: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(webauthnCredentials).set({ counter }).where(eq(webauthnCredentials.credentialId, credentialId));
}

export async function deleteWebauthnCredential(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(webauthnCredentials).where(
    and(eq(webauthnCredentials.id, id), eq(webauthnCredentials.userId, userId))
  );
}

// ── Login Streak ──────────────────────────────────────────────

export async function updateLoginStreak(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const result = await db.select({
    streakCount: users.streakCount,
    lastStreakDate: users.lastStreakDate,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (result.length === 0) return;

  const { streakCount, lastStreakDate } = result[0];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(lastStreakDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffMs = today.getTime() - lastDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day — no change
    return;
  } else if (diffDays === 1) {
    // Consecutive day — increment streak
    await db.update(users).set({
      streakCount: streakCount + 1,
      lastStreakDate: now,
    }).where(eq(users.id, userId));
  } else {
    // Gap > 1 day — reset to 1
    await db.update(users).set({
      streakCount: 1,
      lastStreakDate: now,
    }).where(eq(users.id, userId));
  }
}

// ── Face Recognition Descriptors ──────────────────────────────

export async function saveFaceDescriptor(userId: number, descriptor: number[], label?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove any existing descriptor for this user (one face per user)
  await db.delete(faceDescriptors).where(eq(faceDescriptors.userId, userId));
  await db.insert(faceDescriptors).values({
    userId,
    descriptor: JSON.stringify(descriptor),
    label: label || "Mon visage",
  });
}

export async function getFaceDescriptorByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(faceDescriptors).where(eq(faceDescriptors.userId, userId));
  return rows[0] || null;
}

export async function getAllFaceDescriptors() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({
    id: faceDescriptors.id,
    userId: faceDescriptors.userId,
    descriptor: faceDescriptors.descriptor,
  }).from(faceDescriptors);
}

export async function deleteFaceDescriptor(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(faceDescriptors).where(eq(faceDescriptors.userId, userId));
}

// ── Payment functions ──────────────────────────────────────

export async function createPayment(data: {
  caseId: number;
  donorId?: number;
  amount: number;
  status?: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  paymentMethod?: string;
  transactionId?: string;
  paymentUrl?: string;
  metadata?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values({
    caseId: data.caseId,
    donorId: data.donorId ?? null,
    amount: data.amount,
    status: (data.status as any) ?? "pending",
    paymentMethod: data.paymentMethod ?? "flousi",
    transactionId: data.transactionId ?? null,
    paymentUrl: data.paymentUrl ?? null,
    metadata: data.metadata ?? null,
  }).returning();
  return result[0];
}

export async function updatePaymentStatus(
  paymentId: number,
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = {
    status: status as any,
    updatedAt: new Date(),
  };
  if (status === "completed") {
    updateData.completedAt = new Date();
  }
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  await db.update(payments).set(updateData).where(eq(payments.id, paymentId));
}

export async function getPaymentById(paymentId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return result[0] ?? null;
}

export async function getPaymentByTransactionId(transactionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(eq(payments.transactionId, transactionId)).limit(1);
  return result[0] ?? null;
}

export async function getPaymentsByCase(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments).where(eq(payments.caseId, caseId)).orderBy(desc(payments.createdAt));
}

export async function getPaymentsByDonor(donorId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments).where(eq(payments.donorId, donorId)).orderBy(desc(payments.createdAt));
}

// ── Human Mirror AI: Impact Scenarios ──────────────────────────────

export async function saveImpactScenarios(
  caseId: number,
  scenarios: Array<{
    scenario: string;
    sentiment: "positive" | "neutral" | "negative";
    biasScore: number;
    clusterId?: number;
    metadata: any;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = scenarios.map(s => ({
    caseId,
    scenario: s.scenario,
    sentiment: s.sentiment,
    biasScore: s.biasScore,
    clusterId: s.clusterId ?? null,
    metadata: JSON.stringify(s.metadata),
  }));

  const result = await db.insert(impactScenarios).values(values).returning();
  return result;
}

export async function getImpactScenarios(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(impactScenarios)
    .where(eq(impactScenarios.caseId, caseId))
    .orderBy(desc(impactScenarios.generatedAt));

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
  }));
}

export async function deleteImpactScenarios(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(impactScenarios).where(eq(impactScenarios.caseId, caseId));
}

// ── Notifications ────────────────────────────────────────────────

export async function createNotification(data: {
  userId: number;
  type: typeof notifications.$inferInsert["type"];
  title: string;
  body: string;
  link?: string;
  actorId?: number;
  actorName?: string;
  actorAvatar?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function createNotificationsForMany(userIds: number[], data: {
  type: typeof notifications.$inferInsert["type"];
  title: string;
  body: string;
  link?: string;
  actorId?: number;
  actorName?: string;
  actorAvatar?: string;
}) {
  const db = await getDb();
  if (!db || userIds.length === 0) return;
  await db.insert(notifications).values(userIds.map(userId => ({ ...data, userId })));
}

export async function getNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function getFollowerIds(associationId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(eq(follows.followingId, associationId));
  return rows.map(r => r.followerId);
}

export async function getApprovedMemberIds(associationId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.associationId, associationId), eq(memberships.status, "approved")));
  return rows.map(r => r.userId);
}