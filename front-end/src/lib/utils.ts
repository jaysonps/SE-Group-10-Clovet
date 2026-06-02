import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FallbackReview {
  id: string;
  user: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  likes: number;
  isFallback: true;
}

export function getFallbackReviews(
  productId: string | undefined,
  productName?: string,
  category?: string
): FallbackReview[] {
  const hash = productId
    ? productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : 0;
  const name = productName || "Product";
  const cat = category || "Tops";

  const reviewers = [
    "Alexander Vance", "Brian Sterling", "Claire Fontaine", "David Thorne", "Elizabeth Cole",
    "Frank Weston", "Gabriel Mercer", "Heather Brooks", "Ian Gallagher", "Julia Vance",
    "Katherine Croft", "Liam Vance", "Marcus Mercer", "Natalia Croft", "Oliver Thorne",
    "Penelope Cole", "Quentin Weston", "Rachel Brooks", "Samuel Gallagher", "Thomas Shelby",
    "Sarah Jenkins", "Michael Chen", "Emma Watson", "Damian Rice", "Mary Jane",
  ];

  let templates: { rating: number; comment: string }[] = [];
  if (cat.toLowerCase().includes("bottoms") || name.toLowerCase().includes("pants") || name.toLowerCase().includes("jeans")) {
    templates = [
      { rating: 5, comment: `The fabric of ${name} is thick and stitching at the seams is extremely robust.` },
      { rating: 4, comment: `Highly fashionable and precise stitching. Fits my waist perfectly, recommended!` },
      { rating: 5, comment: `Super comfortable for all-day wear. Absolutely worth the value.` },
      { rating: 3, comment: `Great pants structure, though slightly tight around the lower thighs.` },
      { rating: 5, comment: `No regrets on these pants. The premium material and sleek slim fit are top tier.` },
    ];
  } else if (cat.toLowerCase().includes("dresses") || cat.toLowerCase().includes("suits")) {
    templates = [
      { rating: 5, comment: `Exceedingly elegant for formal gatherings! Clean tailoring with a luxury feel.` },
      { rating: 5, comment: `Premium-tier formal textile. Fits excellently, received numerous compliments!` },
      { rating: 4, comment: `Remarkably sophisticated! Secure packaging with wonderful seller interaction.` },
      { rating: 4, comment: `Superb item! Fits straight out of the box with zero modifications needed.` },
      { rating: 5, comment: `Outstanding textile quality. High prestige appearance that won't wrinkle.` },
    ];
  } else if (
    cat.toLowerCase().includes("knitwears") ||
    cat.toLowerCase().includes("fleeces") ||
    cat.toLowerCase().includes("outerwears")
  ) {
    templates = [
      { rating: 5, comment: `Perfect warmth with incredibly soft fabric! Ideal for rainy weather.` },
      { rating: 5, comment: `The design of this ${name} is top notch. Modern aesthetics with structured fabric.` },
      { rating: 4, comment: `Thick fabric that is exceptionally smooth to touch. Great relaxed style.` },
      { rating: 4, comment: `Brilliant outerwear! Buttons and zippers feel robust and premium.` },
      { rating: 5, comment: `Highly impressive knit structure. The stitch lines are perfect.` },
    ];
  } else {
    templates = [
      { rating: 5, comment: `The fabric of this ${name} is ultra breathable. Cotton feels distinctly premium.` },
      { rating: 4, comment: `Color and size accuracy match the images precisely. Neatly stitched.` },
      { rating: 5, comment: `Ordered from Clovet multiple times and this ${name} is yet another flawless item.` },
      { rating: 3, comment: `Very decent quality, slightly lightweight. Excellent comfort for daily wear.` },
      { rating: 5, comment: `Deeply in love with the cut and shape! Color blends well and fabric is extremely soft.` },
    ];
  }

  const result: FallbackReview[] = [];
  const numReviews = (hash % 3) + 3;
  for (let i = 0; i < numReviews; i++) {
    const rIdx = (hash + i) % reviewers.length;
    const tIdx = (hash + i) % templates.length;
    const daysAgo = ((hash + i * 7) % 25) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    result.push({
      id: `mock-${productId || "1"}-${i}`,
      user: reviewers[rIdx],
      rating: templates[tIdx].rating,
      date: dateStr,
      comment: templates[tIdx].comment,
      verified: false, 
      likes: ((hash * (i + 1)) % 40) + 1,
      isFallback: true,
    });
  }
  return result;
}
