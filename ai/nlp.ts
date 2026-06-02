export interface CategoryResult {
  category: string;
  confidence: number; // 0–100
}

export const analyzeProductCategory = async (
  name: string,
  description: string
): Promise<string[]> => {
  const text = (name + " " + description).toLowerCase();

  const mappings: Record<string, string[]> = {
    Tops: [
      "shirt", "t-shirt", "tee", "top", "blouse", "tank", "jersey", "polo",
      "crop top", "tube top", "halter", "camisole",
    ],
    Outerwears: [
      "jacket", "coat", "blazer", "outer", "parka", "windbreaker",
      "denim jacket", "bomber", "anorak", "trench",
    ],
    Bottoms: [
      "pants", "trousers", "jeans", "shorts", "skirt", "leggings",
      "cargo", "denim pants", "chinos", "slacks", "culottes",
    ],
    "Knitwears & Fleeces": [
      "sweater", "hoodie", "knit", "fleece", "pullover", "cardigan",
      "sweatshirt", "knitwear", "crewneck", "turtleneck",
    ],
    "Dresses & Suits": [
      "dress", "suit", "gown", "tuxedo", "formal", "maxi", "mini dress",
      "jumpsuit", "romper", "overall", "ensemble",
    ],
  };

  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(mappings)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(text)) matchCount++;
    }
    if (matchCount > 0) {
      scores[category] = matchCount;
    }
  }

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  return sorted;
};

export const analyzeProductCategoryWithConfidence = async (
  name: string,
  description: string
): Promise<CategoryResult[]> => {
  const text = (name + " " + description).toLowerCase();

  const mappings: Record<string, string[]> = {
    Tops: ["shirt", "t-shirt", "tee", "top", "blouse", "tank", "jersey", "polo", "crop top", "halter"],
    Outerwears: ["jacket", "coat", "blazer", "outer", "parka", "windbreaker", "bomber", "anorak", "trench"],
    Bottoms: ["pants", "trousers", "jeans", "shorts", "skirt", "leggings", "cargo", "chinos", "slacks"],
    "Knitwears & Fleeces": ["sweater", "hoodie", "knit", "fleece", "pullover", "cardigan", "sweatshirt", "crewneck"],
    "Dresses & Suits": ["dress", "suit", "gown", "tuxedo", "formal", "maxi", "jumpsuit", "romper", "overall"],
  };

  const results: CategoryResult[] = [];

  for (const [category, keywords] of Object.entries(mappings)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(text)) matchCount++;
    }
    if (matchCount > 0) {
      const confidence = Math.min(100, Math.round((matchCount / keywords.length) * 100 * 3));
      results.push({ category, confidence });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
};
