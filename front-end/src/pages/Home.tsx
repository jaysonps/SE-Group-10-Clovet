import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Green T-Shirt', brand: 'Clovet', price: 150000, originalPrice: 300000, image: '/src/assets/tops1.PNG' },
  { id: '2', name: 'Colorblock Polo Shirt', brand: 'Clovet', price: 185000, originalPrice: 350000, image: '/src/assets/tops2.PNG' },
  { id: '16', name: 'Black Varsity Jacket', brand: 'Clovet', price: 750000, image: '/src/assets/Outwears1.PNG' },
  { id: '8', name: 'Graphic Red T-Shirt', brand: 'Clovet', price: 195000, image: '/src/assets/Graphic Red T-shirts.PNG' },
  { id: '4', name: 'Black Cargo Pants', brand: 'Clovet', price: 350000, image: '/src/assets/bottoms1.PNG' },
];

const CATEGORIES = [
  { name: 'TRENDING', icon: <Flame size={24} className="text-orange-500" />, image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80' },
  { name: 'OUTERWEARS', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80' },
  { name: 'BOTTOMS', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80' },
  { name: 'TOPS', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80' },
  { name: 'KNITWEARS & FLEECES', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80' },
  { name: 'DRESSES & SUITS', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80' },
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    fetch('/api/products?status=VERIFIED')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-bg-main min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[700px] overflow-hidden pt-20">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white flex items-center justify-center p-8 lg:p-24"
        >
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            <div className="space-y-12 max-w-lg z-10">
              <div className="space-y-6">
                <div className="sleek-label">Exclusive Service</div>
                <h1 className="text-8xl font-display font-black leading-[0.85] tracking-tighter uppercase">
                  EASY<br/>RETURN
                </h1>
                <p className="text-lg text-gray-500 font-medium max-w-sm">Contact our Customer Service & check FAQ now for your shopping convenience.</p>
              </div>
              <Link to="/listing" className="sleek-button-primary inline-flex items-center space-x-3 w-fit">
                <span>Shop Collection</span>
                <ChevronRight size={18} />
              </Link>
            </div>
            <div className="relative h-full flex items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl"
              >
                <img 
                  src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=90" 
                  alt="Hero Product"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
              <div className="absolute -bottom-10 -left-10 bg-black text-white p-10 rounded-[2rem] shadow-2xl hidden lg:block">
                <p className="text-4xl font-display font-black italic tracking-tighter">CLOVET</p>
                <p className="text-xs uppercase tracking-[0.3em] font-bold mt-2 opacity-50">Est. 2024</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trending Horizontal Scroll */}
      <section className="py-32 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="flex items-end justify-between mb-16 px-2">
            <div className="space-y-2">
              <div className="sleek-label">Curated Selection</div>
              <div className="flex items-center space-x-4">
                <h2 className="text-4xl font-display font-black uppercase tracking-tight">Trending Now</h2>
                <Flame className="text-orange-500" size={32} />
              </div>
            </div>
            <Link to="/listing" className="group flex items-center space-x-3 text-sm font-bold uppercase tracking-widest hover:text-gray-500 transition-all">
              <span>View Collection</span>
              <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          
          <div className="flex space-x-8 overflow-x-auto no-scrollbar pb-12 px-2">
            {isLoading ? (
              <div className="w-full text-center py-20">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 animate-pulse">Scanning Inventory...</p>
              </div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id} className="min-w-[280px] group">
                  <div className="sleek-card aspect-[3/4] overflow-hidden mb-6 relative border-none bg-gray-100">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    {product.status === 'SOLD' && (
                      <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        Sold Out
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 px-1">
                    <h3 className="font-bold text-lg tracking-tight group-hover:text-gray-600 transition-colors uppercase">{product.name}</h3>
                    <div className="flex items-center space-x-3">
                      <p className="font-black text-xl">IDR {Number(product.price).toLocaleString()}</p>
                      {product.originalPrice && (
                        <p className="text-sm text-gray-400 line-through font-medium">IDR {Number(product.originalPrice).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full text-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-gray-200">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mb-4">No verified inventory found</p>
                 <Link to="/listing" className="text-[10px] font-black uppercase tracking-widest text-[#556B2F] border-b-2 border-[#556B2F]">Browse All Products</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid Categories */}
      <section className="py-32 px-4 lg:px-8 bg-white">
        <div className="container mx-auto">
          <div className="mb-20 text-center space-y-4">
            <div className="sleek-label">Browse by Type</div>
            <h2 className="text-5xl font-display font-black uppercase tracking-tighter">Shop Categories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES.map((cat, idx) => {
              const slugMap: Record<string, string> = {
                'KNITWEARS & FLEECES': 'knitwears-fleeces',
                'DRESSES & SUITS': 'dresses-suits',
                'OUTERWEARS': 'outerwears',
                'BOTTOMS': 'bottoms',
                'TOPS': 'tops'
              };
              const categorySlug = slugMap[cat.name] || cat.name.toLowerCase();
              const path = cat.name === 'TRENDING' ? '/listing?sort=trending' : `/listing?category=${categorySlug}`;
              
              return (
                <motion.div 
                  whileHover={{ y: -10 }}
                  key={cat.name} 
                  className={cn(
                    "relative rounded-[2.5rem] overflow-hidden h-[450px] cursor-pointer group shadow-sm hover:shadow-2xl transition-all duration-500",
                    idx === 0 && "lg:col-span-1",
                  )}
                >
                  <Link to={path} className="absolute inset-0">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          {cat.icon}
                          <h3 className="text-white text-3xl font-display font-black tracking-tighter uppercase">{cat.name}</h3>
                        </div>
                        <div className="flex items-center space-x-2 text-white/50 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                          <span>Explore</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BIG SALE BANNER */}
      <section className="py-20 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="relative rounded-[3rem] overflow-hidden bg-black h-[500px] flex items-center shadow-2xl">
             <div className="absolute inset-0 opacity-50 hover:opacity-40 transition-opacity duration-700">
                <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&q=90" className="w-full h-full object-cover scale-110" />
             </div>
             <div className="relative z-10 w-full text-center space-y-6 px-8">
                <h2 className="text-white text-3xl font-display font-black italic tracking-tighter uppercase opacity-30">CLOVET</h2>
                <h3 className="text-white text-[10rem] font-display font-black tracking-tighter leading-none select-none">SALE</h3>
                <div className="flex items-center justify-center space-x-6">
                  <span className="text-white/20 text-[10rem] font-display font-black leading-none">50</span>
                  <div className="flex flex-col items-start translate-y-10">
                    <span className="text-white text-6xl font-black">%</span>
                    <span className="text-white text-4xl font-black leading-none tracking-tighter">OFF</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Featured Items Grid */}
      <section className="py-32 px-4 lg:px-8">
         <div className="container mx-auto">
            <div className="flex items-end justify-between mb-20 px-2">
              <div className="space-y-4">
                <div className="sleek-label">Special Offer</div>
                <h2 className="text-4xl font-display font-black uppercase tracking-tight">Clovet Promotions</h2>
              </div>
              <Link to="/listing?filter=promotion" className="group flex items-center space-x-3 text-sm font-bold uppercase tracking-widest hover:text-gray-500 transition-all">
                <span>View All</span>
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
               {products.length > 0 ? (
                 products
                   .filter(p => p.originalPrice && Number(p.originalPrice) > Number(p.price))
                   .slice(0, 5)
                   .map(product => (
                    <Link to={`/product/${product.id}`} key={product.id} className="group">
                      <div className="sleek-card aspect-[4/5] overflow-hidden mb-6 border-none bg-white">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <div className="space-y-2">
                        <div className="sleek-label opacity-60">Authentic</div>
                        <h3 className="font-bold text-base tracking-tight uppercase group-hover:text-gray-500 transition-colors">{product.name}</h3>
                        <div className="flex items-center space-x-2">
                          <p className="font-black text-lg">IDR {Number(product.price).toLocaleString()}</p>
                          <p className="text-xs text-gray-400 line-through font-medium">IDR {Number(product.originalPrice).toLocaleString()}</p>
                        </div>
                      </div>
                    </Link>
                   ))
               ) : (
                 <div className="col-span-full py-20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">New arrivals coming soon</p>
                 </div>
               )}
            </div>
         </div>
      </section>
    </div>
  );
}
