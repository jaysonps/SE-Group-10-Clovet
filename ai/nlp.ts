export const analyzeProductCategory = async (name: string, description: string): Promise<string[]> => {
  const text = (name + " " + description).toLowerCase();
  const found: string[] = [];
  
  const mappings: Record<string, string[]> = {
    "Tops": ["shirt", "t-shirt", "tee", "top", "blouse", "tank", "jersey", "polo"],
    "Outerwears": ["jacket", "coat", "blazer", "outer", "parka", "windbreaker", "denim jacket", "cardigan"],
    "Bottoms": ["pants", "trousers", "jeans", "shorts", "skirt", "leggings", "cargo", "denim pants"],
    "Knitwears & Fleeces": ["sweater", "hoodie", "knit", "fleece", "pullover", "cardigan", "sweatshirt"],
    "Dresses & Suits": ["dress", "suit", "gown", "tuxedo", "formal", "maxi", "mini dress"]
  };

  for (const [category, keywords] of Object.entries(mappings)) {
    for (const keyword of keywords) {
      const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      if (regex.test(text)) {
        if (!found.includes(category)) {
          found.push(category);
        }
        break;
      }
    }
  }

  if (found.length === 0) {
    if (text.includes("wear")) {
      found.push("Tops");
    } else {
      found.push("Tops");
    }
  }

  return found.slice(0, 3);
};
