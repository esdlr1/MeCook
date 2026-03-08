export type RecipePreview = {
  id: string;
  title: string;
  image: string;
  minutes: number;
  servings: number;
  creator: string;
  featured?: boolean;
};

export const popularIngredients = [
  { id: "ing-1", name: "Filet Mignon", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=1200&auto=format&fit=crop" },
  { id: "ing-2", name: "Scallops", image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?q=80&w=1200&auto=format&fit=crop" },
  { id: "ing-3", name: "Lobster Tails", image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?q=80&w=1200&auto=format&fit=crop" },
  { id: "ing-4", name: "Salmon", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1200&auto=format&fit=crop" },
  { id: "ing-5", name: "Quinoa", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop" },
  { id: "ing-6", name: "Lentils", image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e6?q=80&w=1200&auto=format&fit=crop" },
  { id: "ing-7", name: "Brown Rice", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?q=80&w=1200&auto=format&fit=crop" },
  { id: "ing-8", name: "Asparagus", image: "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?q=80&w=1200&auto=format&fit=crop" },
];

export const popularDishes = [
  { id: "dish-1", name: "Chicken Soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200&auto=format&fit=crop" },
  { id: "dish-2", name: "Meatloaf", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=1200&auto=format&fit=crop" },
  { id: "dish-3", name: "Lasagna", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1200&auto=format&fit=crop" },
  { id: "dish-4", name: "Chili", image: "https://images.unsplash.com/photo-1604908176997-4316c288032e?q=80&w=1200&auto=format&fit=crop" },
  { id: "dish-5", name: "Banana Bread", image: "https://images.unsplash.com/photo-1606101207207-e2f6f70de4ea?q=80&w=1200&auto=format&fit=crop" },
  { id: "dish-6", name: "Chocolate Chip Cookies", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1200&auto=format&fit=crop" },
  { id: "dish-7", name: "Cheesecake", image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=1200&auto=format&fit=crop" },
  { id: "dish-8", name: "Pancakes", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=1200&auto=format&fit=crop" },
];

export const trendingKeywords = [
  { id: "trend-1", name: "pancakes", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1200&auto=format&fit=crop" },
  { id: "trend-2", name: "filet mignon", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=1200&auto=format&fit=crop" },
  { id: "trend-3", name: "scallops", image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?q=80&w=1200&auto=format&fit=crop" },
  { id: "trend-4", name: "breakfast", image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1200&auto=format&fit=crop" },
  { id: "trend-5", name: "cheesecake", image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=1200&auto=format&fit=crop" },
  { id: "trend-6", name: "quick & easy", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=1200&auto=format&fit=crop" },
  { id: "trend-7", name: "chinese", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop" },
  { id: "trend-8", name: "chicken breast", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop" },
];

export const premiumHighlights = [
  {
    id: "premium-1",
    title: "Top Cooksnapped Recipes",
    subtitle: "Recipes that have more than 5 Cooksnaps",
    image: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "premium-2",
    title: "Top Viewed Recipes",
    subtitle: "The most viewed recipes, updated every day",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
  },
];

export const recipes: RecipePreview[] = [
  { id: "lasagna-roll-ups", title: "Spinach Lasagna Roll Ups", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1200&auto=format&fit=crop", minutes: 25, servings: 8, creator: "My Rad Kitchen | Eva", featured: true },
  { id: "chili", title: "Classic Beef Chili", image: "https://images.unsplash.com/photo-1604908176997-4316c288032e?q=80&w=1200&auto=format&fit=crop", minutes: 40, servings: 6, creator: "Kitchen Atlas" },
  { id: "chicken-soup", title: "Cozy Chicken Soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200&auto=format&fit=crop", minutes: 35, servings: 4, creator: "Home Cooks" },
];

export const recipeSteps = [
  "Preheat oven to 400F and lightly grease a 9x13 pan.",
  "Cook lasagna noodles and mix ricotta, spinach, egg white, mozzarella, and seasonings.",
  "Spread filling over noodles, roll, place seam-side down, top with sauce and cheese.",
  "Bake covered 25 minutes, then uncovered 5 minutes.",
];
