import sys
import json
import re

def classify_product(name, description):
    # Standard Categories as per SRS
    categories_list = [
        "Tops",
        "Outerwears",
        "Bottoms",
        "Knitwears & Fleeces",
        "Dresses & Suits"
    ]
    
    text = (name + " " + description).lower()
    found = []
    
    # Simple NLP Keyword Mapping
    mappings = {
        "Tops": ["shirt", "t-shirt", "tee", "top", "blouse", "tank", "jersey", "polo"],
        "Outerwears": ["jacket", "coat", "blazer", "outer", "parka", "windbreaker", "denim jacket", "cardigan"],
        "Bottoms": ["pants", "trousers", "jeans", "shorts", "skirt", "leggings", "cargo", "denim pants"],
        "Knitwears & Fleeces": ["sweater", "hoodie", "knit", "fleece", "pullover", "cardigan", "sweatshirt"],
        "Dresses & Suits": ["dress", "suit", "gown", "tuxedo", "formal", "maxi", "mini dress"]
    }
    
    for category, keywords in mappings.items():
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text):
                if category not in found:
                    found.append(category)
                break
    
    # Priority handling: if it matches many, take top 3
    # If none found, use some heuristics or default to Tops if it sounds like it
    if not found:
        if "wear" in text:
            found.append("Tops")
        else:
            # Fallback
            found.append("Tops")
            
    return found[:3]

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
        
    name = sys.argv[1]
    description = sys.argv[2]
    
    result = classify_product(name, description)
    print(json.dumps(result))
