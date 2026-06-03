import React, { useState } from 'react';
import { Filter, X, ChevronDown, LayoutGrid, List, Search, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Green T-Shirt', brand: 'Clovet', category: 'Tops', price: 150000, originalPrice: 300000, image: '/src/assets/tops1.PNG', gender: 'Unisex', color: 'Green' },
  { id: '2', name: 'Colorblock Polo Shirt', brand: 'Clovet', category: 'Tops', price: 185000, image: '/src/assets/tops2.PNG', gender: 'Men', color: 'White' },
  { id: '3', name: 'Black Cropped Tee', brand: 'Clovet', category: 'Tops', price: 125000, image: '/src/assets/tops3.PNG', gender: 'Women', color: 'Black' },
  { id: '4', name: 'Black Cargo Pants', brand: 'Clovet', category: 'Bottoms', price: 350000, image: '/src/assets/bottoms1.PNG', gender: 'Men', color: 'Black' },
  { id: '5', name: 'Light Blue Jeans', brand: 'Clovet', category: 'Bottoms', price: 295000, image: '/src/assets/bottoms2.PNG', gender: 'Women', color: 'Blue' },
  { id: '6', name: 'Broken White Pants', brand: 'Clovet', category: 'Bottoms', price: 275000, image: '/src/assets/bottoms3.PNG', gender: 'Men', color: 'White' },
  { id: '7', name: 'Sleeveless Black Dress', brand: 'Clovet', category: 'Dresses & Suits', price: 450000, image: '/src/assets/dresses1.PNG', gender: 'Women', color: 'Black' },
  { id: '8', name: 'Graphic Red T-Shirt', brand: 'Clovet', category: 'Tops', price: 195000, originalPrice: 390000, image: '/src/assets/Graphic Red T-shirts.PNG', gender: 'Unisex', color: 'Red' },
  { id: '9', name: 'Black Overall Dress', brand: 'Clovet', category: 'Dresses & Suits', price: 385000, image: '/src/assets/dresses3.PNG', gender: 'Women', color: 'Black' },
  { id: '10', name: 'Beige Fleece Jacket', brand: 'Clovet', category: 'Knitwears & Fleeces', price: 520000, image: '/src/assets/fleeces1.PNG', gender: 'Unisex', color: 'Brown' },
  { id: '11', name: 'Navy Fleece Jacket', brand: 'Clovet', category: 'Knitwears & Fleeces', price: 520000, image: '/src/assets/fleeces2.PNG', gender: 'Men', color: 'Blue' },
  { id: '12', name: 'Gray Fleece Jacket', brand: 'Clovet', category: 'Knitwears & Fleeces', price: 520000, image: '/src/assets/fleeces3.PNG', gender: 'Women', color: 'Gray' },
  { id: '13', name: 'Maroon Graphic Sweatshirt', brand: 'Clovet', category: 'Knitwears & Fleeces', price: 325000, image: '/src/assets/knitwears1.PNG', gender: 'Unisex', color: 'Red' },
  { id: '14', name: 'Light Blue Sweatshirt', brand: 'Clovet', category: 'Knitwears & Fleeces', price: 310000, image: '/src/assets/knitwears2.PNG', gender: 'Women', color: 'Blue' },
  { id: '15', name: 'Striped Knit Cardigan', brand: 'Clovet', category: 'Knitwears & Fleeces', price: 425000, image: '/src/assets/knitwears3.PNG', gender: 'Women', color: 'White' },
  { id: '16', name: 'Black Varsity Jacket', brand: 'Clovet', category: 'Outerwears', price: 750000, image: '/src/assets/Outwears1.PNG', gender: 'Men', color: 'Black' },
  { id: '17', name: 'Olive Coach Jacket', brand: 'Clovet', category: 'Outerwears', price: 485000, image: '/src/assets/Outwears2.PNG', gender: 'Men', color: 'Green' },
  { id: '18', name: 'Navy Colorblock Windbreaker', brand: 'Clovet', category: 'Outerwears', price: 510000, image: '/src/assets/Outwears3.PNG', gender: 'Unisex', color: 'Blue' },
  { id: '19', name: 'Black Blazer Set', brand: 'Clovet', category: 'Dresses & Suits', price: 950000, image: '/src/assets/Suits1.PNG', gender: 'Men', color: 'Black' },
  { id: '20', name: 'Classic Black Suit', brand: 'Clovet', category: 'Dresses & Suits', price: 1250000, image: '/src/assets/Suits2.PNG', gender: 'Men', color: 'Black' },
  { id: '21', name: 'Beige Blazer Set', brand: 'Clovet', category: 'Dresses & Suits', price: 920000, image: '/src/assets/Suits3.PNG', gender: 'Men', color: 'Brown' },
];

const FILTER_CATEGORIES = ['Tops', 'Outerwears', 'Bottoms', 'Knitwears & Fleeces', 'Dresses & Suits'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const GENDERS = ['Men', 'Women', 'Unisex'];
const CONDITIONS = ['New', 'Pre-owned'];
const COLORS = [
  { name: 'Green', class: 'bg-[#4a5d23]' },
  { name: 'Blue', class: 'bg-blue-600' },
  { name: 'White', class: 'bg-white border border-slate-200' },
  { name: 'Red', class: 'bg-red-600' },
  { name: 'Purple', class: 'bg-purple-600' },
  { name: 'Yellow', class: 'bg-yellow-400' },
  { name: 'Brown', class: 'bg-amber-800' },
  { name: 'Black', class: 'bg-black' },
  { name: 'Gray', class: 'bg-gray-400' },
  { name: 'Maroon', class: 'bg-red-900' },
];

export default function ProductListing() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setIsLoading(false);
      });
  }, []);

  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const sortParam = searchParams.get('sort');
  const filterParam = searchParams.get('filter');
  const [showFilters, setShowFilters] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Featured Items');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [activeFilters, setActiveFilters] = useState<string[]>(() => {
    const filters: string[] = [];
    if (categoryParam) {
      const slugMap: Record<string, string> = {
        'knitwears': 'Knitwears & Fleeces',
        'knitwears-fleeces': 'Knitwears & Fleeces',
        'dresses': 'Dresses & Suits',
        'dresses-suits': 'Dresses & Suits',
        'outerwears': 'Outerwears',
        'outwears': 'Outerwears'
      };
      
      const mappedParam = slugMap[categoryParam.toLowerCase()] || categoryParam;
      const match = FILTER_CATEGORIES.find(c => c.toLowerCase() === mappedParam.toLowerCase());
      if (match) filters.push(match);
      else filters.push(mappedParam);
    }
    if (sortParam === 'trending') filters.push('Trending');
    if (filterParam === 'promotion') filters.push('Promotion');
    return filters;
  });

  React.useEffect(() => {
    const newFilters: string[] = [];
    if (categoryParam) {
      const slugMap: Record<string, string> = {
        'knitwears': 'Knitwears & Fleeces',
        'knitwears-fleeces': 'Knitwears & Fleeces',
        'dresses': 'Dresses & Suits',
        'dresses-suits': 'Dresses & Suits',
        'outerwears': 'Outerwears'
      };
      
      const mappedParam = slugMap[categoryParam.toLowerCase()] || categoryParam;
      const match = FILTER_CATEGORIES.find(c => c.toLowerCase() === mappedParam.toLowerCase());
      if (match) newFilters.push(match);
      else newFilters.push(mappedParam);
    }
    if (sortParam === 'trending') newFilters.push('Trending');
    if (filterParam === 'promotion') newFilters.push('Promotion');
    setActiveFilters(newFilters);
    setVisibleCount(12);
  }, [categoryParam, sortParam, filterParam]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter];
      setVisibleCount(12);
      return newFilters;
    });
  };

  const sortOptions = ['Featured Items', 'Price: Low to High', 'Price: High to Low', 'Release Date'];

  const filteredProducts = products.filter(product => {
    // 0. Search Query Filter
    const searchQuery = (searchParams.get('q') || searchParams.get('search') || '').toLowerCase().trim();
    if (searchQuery) {
      const matchName = product.name?.toLowerCase().includes(searchQuery);
      const matchBrand = product.brand?.toLowerCase().includes(searchQuery);
      const matchCategory = product.category?.toLowerCase().includes(searchQuery);
      const matchColor = product.color?.toLowerCase().includes(searchQuery);
      const matchDesc = product.desc?.toLowerCase().includes(searchQuery);
      if (!matchName && !matchBrand && !matchCategory && !matchColor && !matchDesc) return false;
    }

    // 1. Category Filter
    const activeCategories = activeFilters.filter(f => FILTER_CATEGORIES.includes(f));
    if (activeCategories.length > 0 && !activeCategories.includes(product.category)) return false;

    // 2. Gender Filter
    const activeGenders = activeFilters.filter(f => GENDERS.includes(f));
    if (activeGenders.length > 0 && !activeGenders.includes(product.gender)) return false;

    // 3. Color Filter
    const colorNames = COLORS.map(c => c.name);
    const activeColors = activeFilters.filter(f => colorNames.includes(f));
    if (activeColors.length > 0 && !activeColors.includes(product.color)) return false;

    // 4. Condition Filter
    const activeConditions = activeFilters.filter(f => CONDITIONS.includes(f));
    if (activeConditions.length > 0 && !activeConditions.includes(product.condition)) return false;

    // 5. Size Filter
    const activeSizes = activeFilters
      .filter(f => f.startsWith('Size: '))
      .map(f => f.replace('Size: ', ''));
    
    if (activeSizes.length > 0) {
      if (!product.sizes) return false;
      const pSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
      const hasAnySelectedSize = activeSizes.some(s => (Number(pSizes[s]) || 0) > 0);
      if (!hasAnySelectedSize) return false;
    }

    // 5. Promotion Filter
    if (activeFilters.includes('Promotion')) {
       if (!product.originalPrice || Number(product.originalPrice) <= Number(product.price)) return false;
    }

    // Price Filter
    if (minPrice && product.price < parseInt(minPrice)) return false;
    if (maxPrice && product.price > parseInt(maxPrice)) return false;

    return true;
  });

  const availableFilterSizes = SIZES.filter(size => {
    return products.some(product => {
       if (!product.sizes) return false;
       const pSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
       return (Number(pSizes[size]) || 0) > 0;
    });
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Price: Low to High') {
      return Number(a.price) - Number(b.price);
    }
    if (sortBy === 'Price: High to Low') {
      return Number(b.price) - Number(a.price);
    }
    if (sortBy === 'Release Date') {
      const aVal = a.created_at ? new Date(a.created_at).getTime() : (parseInt(a.id) || 0);
      const bVal = b.created_at ? new Date(b.created_at).getTime() : (parseInt(b.id) || 0);
      return bVal - aVal;
    }
    return 0;
  });

  const displayedProducts = sortedProducts.slice(0, visibleCount);

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center space-x-4 flex-1 overflow-hidden">
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className="flex items-center space-x-3 px-6 py-2.5 bg-white border border-gray-200 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors shrink-0"
             >
               <Filter size={16} />
               <span>Filters</span>
               {activeFilters.length > 0 && <span className="bg-black text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-sm ml-2">{activeFilters.length}</span>}
             </button>
             
             <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar scroll-smooth">
               <AnimatePresence>
                 {activeFilters.map(filter => (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     key={filter} 
                     className="flex items-center space-x-2 px-3 py-2 bg-zinc-100 text-black rounded-lg text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap group border border-zinc-200"
                   >
                     <span>{filter}</span>
                     <motion.button 
                       whileHover={{ scale: 1.2, rotate: 90 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={() => toggleFilter(filter)}
                       className="p-1 hover:bg-black/5 rounded-md transition-colors"
                     >
                       <X size={12} />
                     </motion.button>
                   </motion.div>
                 ))}
               </AnimatePresence>
               {activeFilters.length > 0 && (
                 <button 
                   onClick={() => setActiveFilters([])}
                   className="text-[10px] font-black uppercase tracking-widest text-[#556B2F] hover:opacity-70 transition-colors px-2 whitespace-nowrap"
                 >
                   Reset
                 </button>
               )}
             </div>
          </div>

          <div className="relative shrink-0">
             <button 
               onClick={() => setIsSortOpen(!isSortOpen)}
               className="flex items-center space-x-4 px-6 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-black hover:bg-gray-100 transition-all w-full md:w-56 justify-between"
             >
               <div className="flex flex-col items-start translate-y-0.5">
                  <span className="text-[8px] text-gray-400 uppercase tracking-widest leading-none">Sort By</span>
                  <span className="uppercase tracking-tighter">{sortBy}</span>
               </div>
               <ChevronDown size={14} className={cn("transition-transform duration-300", isSortOpen && "rotate-180")} />
             </button>

             <AnimatePresence>
                {isSortOpen && (
                   <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-full md:w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                       <div className="p-2">
                          {sortOptions.map(option => (
                             <button
                                key={option}
                                onClick={() => {
                                  setSortBy(option);
                                  setIsSortOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                                  sortBy === option ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50 hover:text-black"
                                )}
                             >
                                {option}
                             </button>
                          ))}
                       </div>
                    </motion.div>
                   </>
                )}
             </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-12">
          {/* Sidebar Filters */}
          <AnimatePresence mode="wait">
            {showFilters && (
              <motion.aside 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="hidden lg:block overflow-hidden shrink-0"
              >
                <div className="space-y-10">
                  {/* Category */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Category</h3>
                    <div className="flex flex-col gap-2">
                       {FILTER_CATEGORIES.map(cat => (
                         <button 
                           key={cat}
                           onClick={() => toggleFilter(cat)}
                           className={cn(
                             "flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all text-left",
                             activeFilters.includes(cat) ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50 hover:text-black"
                           )}
                         >
                           <span>{cat}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Size */}
                   <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">US Size</h3>
                    <div className="grid grid-cols-4 gap-2">
                       {availableFilterSizes.map(size => (
                         <button 
                           key={size} 
                           onClick={() => toggleFilter(`Size: ${size}`)}
                           className={cn(
                             "h-10 flex items-center justify-center border rounded-lg text-[10px] font-bold transition-all",
                             activeFilters.includes(`Size: ${size}`) 
                               ? "border-black bg-black text-white" 
                               : "border-gray-100 hover:border-black"
                           )}
                         >
                           {size}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Price Range</h3>
                    <div className="space-y-3">
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">IDR</span>
                          <input 
                            type="number" 
                            placeholder="Min" 
                            value={minPrice}
                            onBlur={() => {
                              if (minPrice && maxPrice && parseInt(minPrice) > parseInt(maxPrice)) {
                                setMinPrice('');
                                setMaxPrice('');
                              }
                            }}
                            onChange={(e) => {
                              setMinPrice(e.target.value);
                              setVisibleCount(12);
                            }}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-black transition-all font-bold"
                          />
                       </div>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">IDR</span>
                          <input 
                            type="number" 
                            placeholder="Max" 
                            value={maxPrice}
                            onBlur={() => {
                              if (minPrice && maxPrice && parseInt(minPrice) > parseInt(maxPrice)) {
                                setMinPrice('');
                                setMaxPrice('');
                              }
                            }}
                            onChange={(e) => {
                              setMaxPrice(e.target.value);
                              setVisibleCount(12);
                            }}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-black transition-all font-bold"
                          />
                       </div>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Gender</h3>
                    <div className="grid grid-cols-3 gap-2">
                       {GENDERS.map(gender => (
                         <button 
                           key={gender} 
                           onClick={() => toggleFilter(gender)}
                           className={cn(
                             "h-10 flex items-center justify-center border rounded-lg text-[10px] font-bold transition-all",
                             activeFilters.includes(gender) 
                               ? "border-black bg-black text-white" 
                               : "border-gray-100 hover:border-black"
                           )}
                         >
                           {gender}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Condition</h3>
                    <div className="grid grid-cols-2 gap-2">
                       {CONDITIONS.map(condition => (
                         <button 
                           key={condition} 
                           onClick={() => toggleFilter(condition)}
                           className={cn(
                             "h-10 flex items-center justify-center border rounded-lg text-[10px] font-bold transition-all",
                             activeFilters.includes(condition) 
                               ? "border-black bg-black text-white" 
                               : "border-gray-100 hover:border-black"
                           )}
                         >
                           {condition}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Color</h3>
                    <div className="flex flex-wrap gap-2.5">
                       {COLORS.map(color => (
                         <button 
                           key={color.name}
                           onClick={() => toggleFilter(color.name)}
                           title={color.name}
                           className={cn(
                             "w-7 h-7 rounded-full transition-all ring-offset-2",
                             color.class,
                             activeFilters.includes(color.name) ? "ring-2 ring-black scale-110" : "border border-gray-100 hover:scale-110"
                           )}
                         />
                       ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className="flex-1">
             <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayedProducts.map(product => (
                   <Link to={`/product/${product.id}`} key={product.id} className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-6 relative">
                       <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       
                       <div className={cn(
                         "absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded shadow-sm",
                         product.condition === 'New' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                       )}>
                         {product.condition}
                       </div>
                       {product.status === 'SOLD' && (
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] border-2 border-white px-4 py-2 rounded-full">Sold Out</span>
                         </div>
                       )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Clovet</p>
                        <h3 className="font-bold text-sm text-black leading-tight line-clamp-1 uppercase">{product.name}</h3>
                      </div>
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                         <p className="font-black text-[#556B2F]">IDR {Number(product.price).toLocaleString()}</p>
                         {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                           <p className="text-[10px] font-bold text-gray-300 line-through decoration-gray-300">
                             IDR {Number(product.originalPrice).toLocaleString()}
                           </p>
                         )}
                      </div>
                    </div>
                   </Link>
                ))}
             </div>

             {isLoading && (
               <div className="mt-20 text-center py-20">
                  <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-300">Synchronizing Vault...</p>
               </div>
             )}

             {!isLoading && visibleCount < sortedProducts.length && (
               <div className="mt-20 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-10 py-4 border-2 border-slate-900 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all shadow-lg hover:shadow-xl"
                  >
                    Load More Items
                  </button>
               </div>
             )}

             {!isLoading && sortedProducts.length === 0 && (
               <div className="mt-20 text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No products available in the vault.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
