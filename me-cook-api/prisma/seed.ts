import "dotenv/config";
import bcrypt from "bcrypt";
import { NotificationType, PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run seed.");
}
const normalizedConnectionString = databaseUrl.replace("@localhost:", "@127.0.0.1:");

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: normalizedConnectionString,
      max: 1,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
      allowExitOnIdle: false,
    }),
  ),
});

function createRng(seed = 42) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pick<T>(list: T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)]!;
}

function uniqueSlug(base: string, index: number) {
  return `${base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${index}`;
}

async function main() {
  const rand = createRng(20260308);
  const passwordHash = await bcrypt.hash("Password123!", 10);

  console.log("Cleaning existing MeCook data...");
  await prisma.pushToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contentReport.deleteMany();
  await prisma.creatorFollow.deleteMany();
  await prisma.savedRecipe.deleteMany();
  await prisma.recipeReaction.deleteMany();
  await prisma.recipeComment.deleteMany();
  await prisma.videoUploadSession.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.recipeTag.deleteMany();
  await prisma.recipeStep.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@mecook.app",
      passwordHash,
      displayName: "MeCook Admin",
      role: UserRole.ADMIN,
      countryCode: "US",
      preferredCuisines: ["Italian", "Mexican", "Japanese"],
      onboardingCompleted: true,
      bio: "Platform administrator",
    },
  });

  const creatorNames = [
    "Eva Kitchen",
    "Chef Marco",
    "Nia Bakes",
    "Tokyo Home Cook",
    "Patel Family Meals",
    "Andes Flavor Lab",
    "Nordic Skillet",
    "Sahara Spice",
    "Mediterranean Spoon",
    "Bayou Pantry",
    "Iberian Oven",
    "Tropical Table",
  ];

  const creators = [];
  for (let i = 0; i < creatorNames.length; i += 1) {
    const creator = await prisma.user.create({
      data: {
        email: `creator${i + 1}@mecook.app`,
        passwordHash,
        displayName: creatorNames[i]!,
        role: UserRole.VERIFIED_CREATOR,
        countryCode: pick(["US", "MX", "IT", "JP", "IN", "BR", "ES"], rand),
        preferredCuisines: ["Italian", "Japanese", "Indian", "Mexican"].sort(() => rand() - 0.5).slice(0, 2),
        onboardingCompleted: true,
        bio: `Verified recipe creator ${i + 1}`,
      },
    });
    creators.push(creator);
    await prisma.creatorProfile.create({
      data: {
        userId: creator.id,
        moderationStatus: "APPROVED",
        canPublish: true,
        reviewedByUserId: admin.id,
        reviewNotes: "Trusted creator",
        reviewedAt: new Date(),
      },
    });
  }

  const users = [];
  for (let i = 0; i < 80; i += 1) {
    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@mecook.app`,
        passwordHash,
        displayName: `Foodie ${i + 1}`,
        role: UserRole.USER,
        countryCode: pick(["US", "CA", "MX", "FR", "IT", "JP", "IN", "BR"], rand),
        preferredCuisines: ["Italian", "Mexican", "Thai", "Indian", "American"].sort(() => rand() - 0.5).slice(0, 2),
        onboardingCompleted: true,
      },
    });
    users.push(user);
  }

  console.log("Creating recipes...");
  const cuisines = ["Italian", "Mexican", "Japanese", "Indian", "Mediterranean", "American", "Thai", "Korean"];
  const tags = ["quick", "family", "comfort-food", "healthy", "high-protein", "budget", "weeknight", "meal-prep"];
  const guaranteedIngredients = [
    "Filet mignon",
    "Scallops",
    "Lobster tails",
    "Salmon fillet",
    "Quinoa",
    "Lentils",
    "Brown rice",
    "Asparagus",
  ];
  const minimumRecipesPerIngredient = 20;
  const guaranteedPool = guaranteedIngredients.flatMap((name) => Array.from({ length: minimumRecipesPerIngredient }, () => name));
  const totalRecipes = Math.max(220, guaranteedPool.length + 40);
  const titleBases = [
    "Lasagna Roll Ups",
    "Spicy Chicken Soup",
    "Garlic Salmon Bowl",
    "Mushroom Risotto",
    "Street Tacos",
    "Maple Glazed Veggies",
    "Coconut Curry",
    "Smoky Chili",
    "Baked Meatloaf",
    "Herb Roasted Chicken",
    "Lemon Pasta",
    "Chocolate Banana Bread",
    "Filet Mignon Skillet",
    "Garlic Butter Scallops",
    "Lobster Tail Bake",
    "Salmon Rice Bowl",
  ];
  const heroImages = [
    "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604908176997-4316c288032e?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1400&auto=format&fit=crop",
  ];
  const stepImages = [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1400&auto=format&fit=crop",
  ];
  const stepVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  ];

  const ingredientDistribution = new Map<string, number>();
  const recipeRecords = [];
  for (let i = 0; i < totalRecipes; i += 1) {
    const creator = creators[i % creators.length]!;
    const title = `${pick(titleBases, rand)} ${i + 1}`;
    const moderationApproved = i < totalRecipes - 20;
    const guaranteedIngredient = i < guaranteedPool.length ? guaranteedPool[i]! : undefined;
    const coreProtein = pick(
      [
        "Filet mignon",
        "Scallops",
        "Salmon fillet",
        "Lobster tails",
        "Chicken breast",
        "Ground beef",
      ],
      rand,
    );
    const primaryIngredient = guaranteedIngredient ?? coreProtein;
    const carbBase = pick(["Quinoa", "Brown rice", "Pasta", "Potatoes", "Lentils"], rand);
    const herb = pick(["Rosemary", "Thyme", "Parsley", "Cilantro", "Basil"], rand);

    const recipe = await prisma.recipe.create({
      data: {
        authorId: creator.id,
        title,
        slug: uniqueSlug(title, i + 1000),
        summary: `A delicious ${pick(cuisines, rand)} inspired recipe perfect for home cooks.`,
        cookTimeMinutes: 15 + Math.floor(rand() * 50),
        prepTimeMinutes: 10 + Math.floor(rand() * 20),
        servings: 2 + Math.floor(rand() * 6),
        cuisine: pick(cuisines, rand),
        difficulty: pick(["Easy", "Medium", "Hard"], rand),
        visibility: "PUBLIC",
        moderationStatus: moderationApproved ? "APPROVED" : "PENDING",
        moderationNotes: moderationApproved ? "Approved for catalog" : "Awaiting admin review",
        isPublished: moderationApproved,
        publishedAt: moderationApproved ? new Date(Date.now() - Math.floor(rand() * 1000000000)) : null,
        heroImageUrl: pick(heroImages, rand),
        locale: "en",
        tags: {
          create: [pick(tags, rand), pick(tags, rand), pick(tags, rand)].map((tag) => ({ tag })),
        },
        ingredients: {
          create: [
            { position: 0, itemName: "Olive oil", quantity: "2", unit: "tbsp" },
            { position: 1, itemName: "Garlic", quantity: "3", unit: "cloves" },
            { position: 2, itemName: "Onion", quantity: "1", unit: "medium" },
            { position: 3, itemName: primaryIngredient, quantity: "1", unit: "lb" },
            { position: 4, itemName: carbBase, quantity: "1.5", unit: "cups" },
            { position: 5, itemName: `${herb} leaves`, quantity: "2", unit: "tbsp" },
            { position: 6, itemName: "Sea salt", quantity: "1", unit: "tsp" },
          ],
        },
      },
    });

    const prepPhoto = await prisma.mediaAsset.create({
      data: {
        recipeId: recipe.id,
        uploaderId: creator.id,
        type: "IMAGE",
        originalUrl: pick(stepImages, rand),
        thumbnailUrl: pick(stepImages, rand),
        width: 1400,
        height: 933,
        uploadJobStatus: "READY",
      },
    });
    const cookingVideo = await prisma.mediaAsset.create({
      data: {
        recipeId: recipe.id,
        uploaderId: creator.id,
        type: "VIDEO",
        originalUrl: pick(stepVideos, rand),
        playbackUrl: pick(stepVideos, rand),
        thumbnailUrl: pick(stepImages, rand),
        durationSeconds: 20 + Math.floor(rand() * 70),
        width: 1280,
        height: 720,
        uploadJobStatus: "READY",
      },
    });
    const finishingPhoto = await prisma.mediaAsset.create({
      data: {
        recipeId: recipe.id,
        uploaderId: creator.id,
        type: "IMAGE",
        originalUrl: pick(stepImages, rand),
        thumbnailUrl: pick(stepImages, rand),
        width: 1400,
        height: 933,
        uploadJobStatus: "READY",
      },
    });

    await prisma.recipeStep.createMany({
      data: [
        { recipeId: recipe.id, position: 0, instruction: "Prep ingredients and preheat cookware.", timerSeconds: 300, mediaAssetId: prepPhoto.id },
        { recipeId: recipe.id, position: 1, instruction: "Saute aromatics and add main ingredients.", timerSeconds: 600, mediaAssetId: cookingVideo.id },
        { recipeId: recipe.id, position: 2, instruction: "Simmer, adjust seasoning, and finish with garnish.", timerSeconds: 900, mediaAssetId: finishingPhoto.id },
      ],
    });
    ingredientDistribution.set(primaryIngredient, (ingredientDistribution.get(primaryIngredient) ?? 0) + 1);
    recipeRecords.push(recipe);
  }

  console.log("Creating follows, reactions, saves, comments...");
  const followKeys = new Set<string>();
  for (let i = 0; i < 500; i += 1) {
    const follower = pick(users, rand);
    const creator = pick(creators, rand);
    const key = `${creator.id}:${follower.id}`;
    if (followKeys.has(key)) {
      continue;
    }
    followKeys.add(key);
    await prisma.creatorFollow.create({
      data: { creatorId: creator.id, followerId: follower.id },
    });
  }

  const approvedRecipes = recipeRecords.filter((r) => r.isPublished);

  const reactionKeys = new Set<string>();
  for (let i = 0; i < 2500; i += 1) {
    const user = pick(users, rand);
    const recipe = pick(approvedRecipes, rand);
    const key = `${recipe.id}:${user.id}`;
    if (reactionKeys.has(key)) {
      continue;
    }
    reactionKeys.add(key);
    await prisma.recipeReaction.create({
      data: { recipeId: recipe.id, userId: user.id },
    });
  }

  const saveKeys = new Set<string>();
  for (let i = 0; i < 1800; i += 1) {
    const user = pick(users, rand);
    const recipe = pick(approvedRecipes, rand);
    const key = `${recipe.id}:${user.id}`;
    if (saveKeys.has(key)) {
      continue;
    }
    saveKeys.add(key);
    await prisma.savedRecipe.create({
      data: { recipeId: recipe.id, userId: user.id },
    });
  }

  const commentBodies = [
    "This was incredible. Added a little extra garlic and loved it.",
    "Tried this tonight and my kids asked for seconds.",
    "I swapped chicken for tofu and it still tasted amazing.",
    "Perfect weeknight recipe, super easy to follow.",
    "Made this for meal prep and it reheats very well.",
  ];

  for (let i = 0; i < 1200; i += 1) {
    const user = pick(users, rand);
    const recipe = pick(approvedRecipes, rand);
    await prisma.recipeComment.create({
      data: {
        recipeId: recipe.id,
        authorId: user.id,
        body: pick(commentBodies, rand),
      },
    });
  }

  console.log("Creating sample notifications...");
  for (let i = 0; i < 300; i += 1) {
    const recipient = pick([...users, ...creators], rand);
    const actor = pick([...users, ...creators], rand);
    const recipe = pick(approvedRecipes, rand);
    const type = pick(
      [NotificationType.COMMENT, NotificationType.FOLLOW, NotificationType.MODERATION_APPROVED, NotificationType.GENERAL],
      rand,
    );
    await prisma.notification.create({
      data: {
        recipientId: recipient.id,
        actorId: actor.id,
        recipeId: type === NotificationType.FOLLOW ? null : recipe.id,
        type,
        title:
          type === NotificationType.COMMENT
            ? "New comment on your recipe"
            : type === NotificationType.FOLLOW
              ? "You have a new follower"
              : type === NotificationType.MODERATION_APPROVED
                ? "Recipe approved"
                : "MeCook update",
        body:
          type === NotificationType.COMMENT
            ? `${actor.displayName} commented on "${recipe.title}".`
            : type === NotificationType.FOLLOW
              ? `${actor.displayName} started following you.`
              : type === NotificationType.MODERATION_APPROVED
                ? `Your recipe "${recipe.title}" is now live.`
                : "New trending recipes are available now.",
        data: {
          recipeSlug: recipe.slug,
        },
        readAt: rand() > 0.55 ? new Date() : null,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Popular ingredient coverage:");
  for (const ingredient of guaranteedIngredients) {
    console.log(`- ${ingredient}: ${ingredientDistribution.get(ingredient) ?? 0} recipes`);
  }
  console.log("Test credentials:");
  console.log("Admin: admin@mecook.app / Password123!");
  console.log("Creator: creator1@mecook.app / Password123!");
  console.log("User: user1@mecook.app / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
