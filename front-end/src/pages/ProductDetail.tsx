import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Star, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown,
  Info,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PRODUCTS: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Green T-Shirt',
    brand: 'Clovet',
    sku: 'CLVT-001',
    price: 150000,
    originalPrice: 300000,
    category: 'Tops',
    color: 'Olive Green',
    material: 'Premium Cotton',
    releaseDate: '15 March 2026',
    retailPrice: 300000,
    description: "Classic olive green tee with a premium feel.",
    images: ['/src/assets/tops1.PNG', '/src/assets/top1 back.png'],
    historyData: [{ date: 'Jan', price: 120000 }, { date: 'May', price: 150000 }]
  },
  '2': {
    id: '2',
    name: 'Colorblock Polo Shirt',
    brand: 'Clovet',
    sku: 'CLVT-002',
    price: 185000,
    category: 'Tops',
    color: 'Multi',
    material: 'Premium Pique',
    releaseDate: '20 March 2026',
    retailPrice: 350000,
    description: "Distinctive colorblock design for a modern preppy look.",
    images: ['/src/assets/tops2.PNG'],
    historyData: [{ date: 'Jan', price: 150000 }, { date: 'May', price: 185000 }]
  },
  '3': {
    id: '3',
    name: 'Black Cropped Tee',
    brand: 'Clovet',
    sku: 'CLVT-003',
    price: 125000,
    category: 'Tops',
    color: 'Black',
    material: 'Lightweight Cotton',
    releaseDate: '25 March 2026',
    retailPrice: 250000,
    description: "Versatile black cropped tee for everyday styling.",
    images: ['/src/assets/tops3.PNG'],
    historyData: [{ date: 'Jan', price: 100000 }, { date: 'May', price: 125000 }]
  },
  '4': {
    id: '4',
    name: 'Black Cargo Pants',
    brand: 'Clovet',
    sku: 'CLVT-004',
    price: 350000,
    originalPrice: 600000,
    category: 'Bottoms',
    color: 'Black',
    material: 'Durable Twill',
    releaseDate: '05 April 2026',
    retailPrice: 600000,
    description: "Functional and stylish cargo pants in tactical black.",
    images: ['/src/assets/bottoms1.PNG'],
    historyData: [{ date: 'Jan', price: 300000 }, { date: 'May', price: 350000 }]
  },
  '5': {
    id: '5',
    name: 'Light Blue Jeans',
    brand: 'Clovet',
    sku: 'CLVT-005',
    price: 295000,
    category: 'Bottoms',
    color: 'Light Blue',
    material: 'Premium Denim',
    releaseDate: '12 April 2026',
    retailPrice: 500000,
    description: "Classic light blue denim with a relaxed fit.",
    images: ['/src/assets/bottoms2.PNG'],
    historyData: [{ date: 'Jan', price: 250000 }, { date: 'May', price: 295000 }]
  },
  '6': {
    id: '6',
    name: 'Broken White Pants',
    brand: 'Clovet',
    sku: 'CLVT-006',
    price: 275000,
    category: 'Bottoms',
    color: 'Broken White',
    material: 'Cotton Canvas',
    releaseDate: '15 April 2026',
    retailPrice: 450000,
    description: "Clean and minimalist pants in a sophisticated broken white shade.",
    images: ['/src/assets/bottoms3.PNG'],
    historyData: [{ date: 'Jan', price: 240000 }, { date: 'May', price: 275000 }]
  },
  '7': {
    id: '7',
    name: 'Sleeveless Black Dress',
    brand: 'Clovet',
    sku: 'CLVT-007',
    price: 450000,
    category: 'Dresses & Suits',
    color: 'Black',
    material: 'Silk Blend',
    releaseDate: '18 April 2026',
    retailPrice: 850000,
    description: "Elegant black dress for formal occasions.",
    images: ['/src/assets/dresses1.PNG'],
    historyData: [{ date: 'Jan', price: 400000 }, { date: 'May', price: 450000 }]
  },
  '8': {
    id: '8',
    name: 'Graphic Red T-Shirt',
    brand: 'Clovet',
    sku: 'CLVT-008',
    price: 195000,
    originalPrice: 350000,
    category: 'Tops',
    color: 'Red',
    material: 'Graphic Cotton',
    releaseDate: '20 April 2026',
    retailPrice: 350000,
    description: "Bold red tee with signature Clovet graphics.",
    images: ['/src/assets/Graphic Red T-shirts.PNG'],
    historyData: [{ date: 'Jan', price: 170000 }, { date: 'May', price: 195000 }]
  },
  '9': {
    id: '9',
    name: 'Black Overall Dress',
    brand: 'Clovet',
    sku: 'CLVT-009',
    price: 385000,
    category: 'Dresses & Suits',
    color: 'Black',
    material: 'Denim/Twill',
    releaseDate: '22 April 2026',
    retailPrice: 650000,
    description: "Casual overall dress in versatile black.",
    images: ['/src/assets/dresses3.PNG'],
    historyData: [{ date: 'Jan', price: 350000 }, { date: 'May', price: 385000 }]
  },
  '10': {
    id: '10',
    name: 'Beige Fleece Jacket',
    brand: 'Clovet',
    sku: 'CLVT-010',
    price: 520000,
    originalPrice: 1040000,
    category: 'Knitwears & Fleeces',
    color: 'Beige',
    material: 'Soft Fleece',
    releaseDate: '25 April 2026',
    retailPrice: 950000,
    description: "Warm and cozy fleece jacket in seasonal beige.",
    images: ['/src/assets/fleeces1.PNG'],
    historyData: [{ date: 'Jan', price: 480000 }, { date: 'May', price: 520000 }]
  },
  '11': {
    id: '11',
    name: 'Navy Fleece Jacket',
    brand: 'Clovet',
    sku: 'CLVT-011',
    price: 520000,
    category: 'Knitwears & Fleeces',
    color: 'Navy',
    material: 'Soft Fleece',
    releaseDate: '26 April 2026',
    retailPrice: 950000,
    description: "Deep navy fleece jacket for classic styling.",
    images: ['/src/assets/fleeces2.PNG'],
    historyData: [{ date: 'Jan', price: 480000 }, { date: 'May', price: 520000 }]
  },
  '12': {
    id: '12',
    name: 'Gray Fleece Jacket',
    brand: 'Clovet',
    sku: 'CLVT-012',
    price: 520000,
    category: 'Knitwears & Fleeces',
    color: 'Gray',
    material: 'Soft Fleece',
    releaseDate: '27 April 2026',
    retailPrice: 950000,
    description: "Essential gray fleece jacket for all-day comfort.",
    images: ['/src/assets/fleeces3.PNG'],
    historyData: [{ date: 'Jan', price: 480000 }, { date: 'May', price: 520000 }]
  },
  '13': {
    id: '13',
    name: 'Maroon Graphic Sweatshirt',
    brand: 'Clovet',
    sku: 'CLVT-013',
    price: 325000,
    category: 'Knitwears & Fleeces',
    color: 'Maroon',
    material: 'Heavy Cotton',
    releaseDate: '02 May 2026',
    retailPrice: 550000,
    description: "Graphic maroon sweatshirt with heritage branding.",
    images: ['/src/assets/knitwears1.PNG'],
    historyData: [{ date: 'Jan', price: 295000 }, { date: 'May', price: 325000 }]
  },
  '14': {
    id: '14',
    name: 'Light Blue Sweatshirt',
    brand: 'Clovet',
    sku: 'CLVT-014',
    price: 310000,
    category: 'Knitwears & Fleeces',
    color: 'Light Blue',
    material: 'Cotton Blend',
    releaseDate: '05 May 2026',
    retailPrice: 520000,
    description: "Soft light blue sweatshirt for a relaxed look.",
    images: ['/src/assets/knitwears2.PNG'],
    historyData: [{ date: 'Jan', price: 280000 }, { date: 'May', price: 310000 }]
  },
  '15': {
    id: '15',
    name: 'Striped Knit Cardigan',
    brand: 'Clovet',
    sku: 'CLVT-015',
    price: 425000,
    category: 'Knitwears & Fleeces',
    color: 'Striped',
    material: 'Knit Wool',
    releaseDate: '08 May 2026',
    retailPrice: 750000,
    description: "Chic striped cardigan with a cozy knit texture.",
    images: ['/src/assets/knitwears3.PNG'],
    historyData: [{ date: 'Jan', price: 380000 }, { date: 'May', price: 425000 }]
  },
  '16': {
    id: '16',
    name: 'Black Varsity Jacket',
    brand: 'Clovet',
    sku: 'CLVT-016',
    price: 750000,
    originalPrice: 1500000,
    category: 'Outerwears',
    color: 'Black/White',
    material: 'Wool Blend',
    releaseDate: '10 May 2026',
    retailPrice: 1200000,
    description: "Classic varsity jacket with monochrome accents.",
    images: ['/src/assets/Outwears1.PNG'],
    historyData: [{ date: 'Jan', price: 650000 }, { date: 'May', price: 750000 }]
  },
  '17': {
    id: '17',
    name: 'Olive Coach Jacket',
    brand: 'Clovet',
    sku: 'CLVT-017',
    price: 485000,
    category: 'Outerwears',
    color: 'Olive',
    material: 'Nylon/Cotton',
    releaseDate: '12 May 2026',
    retailPrice: 850000,
    description: "Lightweight olive coach jacket for transseasonal wear.",
    images: ['/src/assets/Outwears2.PNG'],
    historyData: [{ date: 'Jan', price: 420000 }, { date: 'May', price: 485000 }]
  },
  '18': {
    id: '18',
    name: 'Navy Colorblock Windbreaker',
    brand: 'Clovet',
    sku: 'CLVT-018',
    price: 510000,
    category: 'Outerwears',
    color: 'Navy/White',
    material: 'Waterproof Tech',
    releaseDate: '14 May 2026',
    retailPrice: 890000,
    description: "Technical windbreaker with a sharp colorblock finish.",
    images: ['/src/assets/Outwears3.PNG'],
    historyData: [{ date: 'Jan', price: 450000 }, { date: 'May', price: 510000 }]
  },
  '19': {
    id: '19',
    name: 'Black Blazer Set',
    brand: 'Clovet',
    sku: 'CLVT-019',
    price: 950000,
    category: 'Dresses & Suits',
    color: 'Black',
    material: 'Tailored Wool',
    releaseDate: '15 May 2026',
    retailPrice: 1500000,
    description: "Complete black blazer and trouser set for a sharp silhouette.",
    images: ['/src/assets/Suits1.PNG'],
    historyData: [{ date: 'Jan', price: 850000 }, { date: 'May', price: 950000 }]
  },
  '20': {
    id: '20',
    name: 'Classic Black Suit',
    brand: 'Clovet',
    sku: 'CLVT-020',
    price: 1250000,
    originalPrice: 2500000,
    category: 'Dresses & Suits',
    color: 'Midnight Black',
    material: 'Italian Wool',
    releaseDate: '15 May 2026',
    retailPrice: 2000000,
    description: "Premium black suit set tailored for excellence.",
    images: ['/src/assets/Suits2.PNG'],
    historyData: [{ date: 'Jan', price: 1100000 }, { date: 'May', price: 1250000 }]
  },
  '21': {
    id: '21',
    name: 'Beige Blazer Set',
    brand: 'Clovet',
    sku: 'CLVT-021',
    price: 920000,
    category: 'Dresses & Suits',
    color: 'Beige',
    material: 'Tailored Linen/Wool',
    releaseDate: '16 May 2026',
    retailPrice: 1450000,
    description: "Sophisticated beige blazer set for semi-formal flair.",
    images: ['/src/assets/Suits3.PNG'],
    historyData: [{ date: 'Jan', price: 820000 }, { date: 'May', price: 920000 }]
  },
};

const STATS = [
  { label: 'Average Sale', value: 'IDR 350.000', change: '+2.5%' },
  { label: 'Price Premium', value: '-20%', change: '-5%', negative: true },
  { label: 'Lowest Sale', value: 'IDR 150.000', change: '+1.2%' },
  { label: 'Highest Sale', value: 'IDR 350.000', change: '+12.5%' },
];

export default function ProductDetail() {
  const { id } = useParams();
  const [dbProduct, setDbProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbPriceHistory, setDbPriceHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const productsList = Array.isArray(data) ? data : (data.products || []);
        const found = productsList.find((p: any) => p.id.toString() === id);
        if (found) setDbProduct(found);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    fetch(`/api/products/${id}/price-history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDbPriceHistory(data);
        }
      })
      .catch(console.error);
  }, [id]);

  const mockProduct = PRODUCTS[id || '1'] || PRODUCTS['1'];
  
  // Use DB product if found, else mock
  const product = dbProduct ? {
    ...mockProduct,
    ...dbProduct,
    images: dbProduct.image ? [dbProduct.image] : mockProduct.images,
    price: Number(dbProduct.price)
  } : mockProduct;

  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<'brand-new' | 'used'>('brand-new');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [priceRange, setPriceRange] = useState('6M');
  const [addedToCart, setAddedToCart] = useState(false);

  // Scroll to top and reset state when product ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImg(0);
    setSelectedSize(null);
    setAddedToCart(false);
  }, [id]);

  // Parse sizes correctly
  const productSizes = (() => {
    if (!product.sizes) return {};
    if (typeof product.sizes === 'string') {
      try {
        return JSON.parse(product.sizes);
      } catch (e) { return {}; }
    }
    return product.sizes;
  })();

  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  // Only show sizes that have stock > 0
  const availableSizes = SIZES.filter(size => (Number(productSizes[size]) || 0) > 0);

  const handleInstantBuy = () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    // Redirecting directly as requested
    navigate(`/checkout?productId=${product.id}&size=${selectedSize}`);
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      size: selectedSize,
      condition: activeTab,
      brand: product.brand
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const getChartData = () => {
    const history = dbPriceHistory.length > 0 ? dbPriceHistory : product.historyData;
    // Mock data manipulation based on range
    if (priceRange === '1M') return history.slice(-1);
    if (priceRange === '3M') return history.slice(-3);
    return history;
  };

  return (
    <div className="bg-bg-main min-h-screen pb-32">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-3 mb-16">
          <Link to="/" className="sleek-label hover:text-black">Clovet</Link>
          <ChevronRight size={10} className="text-gray-300" />
          <Link to={`/listing?category=${product.category.toLowerCase()}`} className="sleek-label hover:text-black uppercase">{product.category}</Link>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="sleek-label text-black font-black uppercase">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
          {/* Left: Images */}
          <div className="space-y-8">
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white border border-gray-100 shadow-sm group">
              <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setActiveImg(prev => (prev === 0 ? product.images.length - 1 : prev - 1))}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white rounded-full shadow-2xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => setActiveImg(prev => (prev === product.images.length - 1 ? 0 : prev + 1))}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white rounded-full shadow-2xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
                {product.images.map((_: any, i: number) => (
                  <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", activeImg === i ? "bg-black w-10" : "bg-black/10 w-4")} />
                ))}
              </div>
            </div>
            <div className="flex space-x-6">
               {product.images.map((img: string, i: number) => (
                 <button 
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "w-28 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300",
                    activeImg === i ? "border-black scale-105 shadow-lg" : "border-transparent opacity-40 hover:opacity-100"
                  )}
                 >
                   <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                 </button>
               ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="sleek-label bg-black text-white px-4 py-1.5 rounded-full">Ready to Ship</span>
              </div>
              <div className="space-y-2">
                <p className="sleek-label opacity-50">{product.brand}</p>
                <h1 className="text-6xl font-display font-black tracking-tighter uppercase leading-[0.9]">{product.name}</h1>
              </div>
              <div className="space-y-3 pt-4">
                <p className="sleek-label">Market Value Starts From</p>
                <div className="flex items-end space-x-6">
                  <p className="text-5xl font-display font-black text-[#556B2F] leading-none">IDR {product.price.toLocaleString()}</p>
                  {product.originalPrice && (
                    <p className="text-xl font-display font-black text-gray-400 line-through opacity-50">IDR {Number(product.originalPrice).toLocaleString()}</p>
                  )}
                  <button 
                    onClick={() => setIsSizeChartOpen(true)}
                    className="text-[10px] font-bold text-gray-400 underline uppercase tracking-widest hover:text-black transition-colors"
                  >
                    Size Guide
                  </button>
                </div>
              </div>
            </div>

            {/* Current Product Condition */}
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Listing Condition</span>
                <span className={cn(
                  "px-4 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest border",
                  product.condition === 'New' 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-amber-50 text-amber-600 border-amber-100"
                )}>
                  {product.condition}
                </span>
            </div>

            <div className="space-y-8">
               <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">
                    {selectedSize ? `Selected Size: ${selectedSize}` : "Confirm your size before checkout."}
                  </span>
                  <div className="p-2 bg-gray-50 rounded-xl text-black"><Info size={20} /></div>
               </div>

               {/* Size Selection Bar */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Select Size</span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {availableSizes.map(size => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "h-16 flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300",
                          selectedSize === size 
                            ? "border-black bg-black text-white shadow-xl scale-105" 
                            : "border-gray-100 bg-white text-gray-400 hover:border-black hover:text-black"
                        )}
                      >
                        <span className="text-sm font-black">{size}</span>
                        <div className="flex items-center space-x-1 mt-0.5">
                           <span className={cn("text-[8px] font-bold", selectedSize === size ? "text-white/50" : "text-gray-300")}>IDR 150K</span>
                           <span className="text-[7px] opacity-40 font-black">•</span>
                           <span className={cn("text-[8px] font-black", selectedSize === size ? "text-emerald-400" : "text-emerald-600")}>{productSizes[size]} PCS</span>
                        </div>
                      </button>
                    ))}
                    {availableSizes.length === 0 && (
                      <div className="col-span-5 p-8 text-center bg-red-50 text-red-600 rounded-3xl font-black uppercase text-xs tracking-widest border border-red-100">
                        Out of Stock
                      </div>
                    )}
                  </div>
               </div>
               
               <div className="sleek-card p-8 space-y-4 border-none bg-[#556B2F] text-white">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="text-white" size={24} />
                    <h3 className="font-display font-black text-lg uppercase tracking-tighter">AUTHENTIC PRODUCT</h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    Our team of expert verifiers manually inspect each item to guarantee legitimacy. 
                    Your protection is our priority, with a secure escrow system for every transaction.
                  </p>
               </div>

               <div className="flex gap-6 items-center">
                  <button 
                    onClick={handleInstantBuy}
                    className="sleek-button-authentic flex-1 py-6 text-xs"
                  >
                    Buy Now — IDR {product.price.toLocaleString()}
                  </button>
                  <button 
                    onClick={handleAddToCart}
                    className={cn(
                      "sleek-button-secondary flex-1 py-6 text-sm border-2 transition-all",
                      addedToCart ? "bg-emerald-500 border-emerald-500 text-white" : ""
                    )}
                  >
                    {addedToCart ? "Added!" : "Add to Cart"}
                  </button>
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-6 border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                  >
                    <Share2 size={20} />
                  </button>
               </div>
            </div>

            {/* Reviews Preview */}
            <div className="pt-12 border-t border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-6">
                    <div className="flex space-x-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-black text-black" />)}
                    </div>
                    <span className="sleek-label text-black">Member Reviews (5)</span>
                  </div>
                  <Link 
                    to={`/product/${id}/reviews`}
                    className="text-[10px] font-black text-black uppercase tracking-widest hover:underline"
                  >
                    View All
                  </Link>
               </div>
               <div className="sleek-card p-8 space-y-4 border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="sleek-label text-black">Mark Jones</span>
                    <span className="sleek-label opacity-40">15 Nov 2026</span>
                  </div>
                  <p className="text-sm text-gray-600 italic leading-relaxed font-medium">"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco."</p>
               </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Tabs */}
        <div className="mt-48 space-y-32">
           {/* Product Specs */}
           <div className="space-y-16">
              <div className="text-center space-y-4">
                <div className="sleek-label">Specifications</div>
                <h2 className="text-5xl font-display font-black uppercase tracking-tighter">Product Details</h2>
              </div>
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-xl text-gray-500 leading-relaxed font-medium">{product.description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                 {[
                   { label: 'SKU', val: product.sku },
                   { label: 'Colorway', val: product.color },
                   { label: 'Material', val: product.material },
                   { label: 'Release', val: product.releaseDate },
                   { label: 'Retail', val: `IDR ${product.retailPrice.toLocaleString()}` }
                 ].map(item => (
                   <div key={item.label} className="sleek-card p-10 text-center border-gray-50 bg-white/50 backdrop-blur-sm">
                      <p className="sleek-label mb-3">{item.label}</p>
                      <p className="font-black text-sm uppercase tracking-tight">{item.val}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Market Data */}
           <div className="space-y-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
                <div className="space-y-3 text-left">
                  <div className="sleek-label">Live Data</div>
                  <h2 className="text-5xl font-display font-black uppercase tracking-tighter">Price Analytics</h2>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
                  {['1M', '3M', '6M', '1Y', 'ALL'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setPriceRange(t)}
                      className={cn(
                        "px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all", 
                        priceRange === t ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-black"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                 {/* Stats Column */}
                 <div className="grid grid-cols-1 gap-4">
                    {STATS.map(stat => (
                      <div key={stat.label} className="sleek-card p-8 flex items-center justify-between border-gray-50">
                         <div className="space-y-1">
                            <p className="sleek-label">{stat.label}</p>
                            <p className="font-black text-lg tracking-tight">{stat.value}</p>
                         </div>
                         <div className={cn("flex items-center space-x-1 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full", stat.negative ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600")}>
                            {stat.negative ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            <span>{stat.change}</span>
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* Chart Column */}
                 <div className="lg:col-span-3 h-[500px] sleek-card border-none bg-white p-12 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#000000" stopOpacity={0.05}/>
                            <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} dy={10} />
                        <YAxis hide />
                        <Tooltip 
                           contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontSize: '10px', fontWeight: '900', padding: '16px' }} 
                        />
                        <Area type="monotone" dataKey="price" stroke="#000000" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Similar Products */}
           <div className="space-y-20">
              <div className="text-center space-y-4">
                <div className="sleek-label">Recommendations</div>
                <h2 className="text-5xl font-display font-black uppercase tracking-tighter">You Might Like</h2>
              </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-12 px-2">
                {[
                  { id: '1', name: 'Green T-Shirt', img: '/src/assets/tops1.PNG', price: 150000 },
                  { id: '2', name: 'Colorblock Polo', img: '/src/assets/tops2.PNG', price: 170000 },
                  { id: '3', name: 'Black Cropped Tee', img: '/src/assets/tops3.PNG', price: 120000 },
                  { id: '8', name: 'Graphic Red T-Shirt', img: '/src/assets/Graphic Red T-shirts.PNG', price: 195000 },
                  { id: '4', name: 'Black Cargo Pants', img: '/src/assets/bottoms1.PNG', price: 350000 },
                  { id: '5', name: 'Light Blue Jeans', img: '/src/assets/bottoms2.PNG', price: 280000 }
                ].filter(item => item.id !== id).slice(0, 4).map((item) => (
                  <Link key={item.id} to={`/product/${item.id}`} className="group">
                    <div className="sleek-card aspect-[4/5] overflow-hidden mb-6 border-none bg-gray-100">
                      <img src={item.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    <div className="space-y-2 px-1">
                       <p className="sleek-label opacity-40">Clovet Collection</p>
                       <h3 className="font-black text-lg tracking-tight uppercase group-hover:text-gray-500 transition-colors">{item.name}</h3>
                       <p className="font-black text-xl">IDR {item.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center pt-8">
                <Link 
                  to={`/listing?category=${product.category.toLowerCase()}`}
                  className="sleek-button-secondary bg-black text-white hover:bg-zinc-800 px-16 group inline-flex items-center space-x-4"
                >
                  <span>Explore More</span>
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
           </div>
        </div>

        {/* Share Modal */}
        <AnimatePresence>
          {isShareModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsShareModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl p-10 text-center"
              >
                <div className="mb-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Share2 size={24} className="text-black" />
                  </div>
                  <h3 className="text-2xl font-display font-black uppercase tracking-tighter mb-2">Share Product</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Spread the Clovet Vibe</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }}
                    className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-black mb-1">Copy Link</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase">To Clipboard</p>
                  </button>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out this ${product.name} from Clovet! ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-black mb-1">WhatsApp</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase">Send to Chat</p>
                  </a>
                </div>

                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Size Chart Modal */}
        <AnimatePresence>
          {isSizeChartOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSizeChartOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[3.5rem] p-16 shadow-2xl overflow-hidden"
              >
                <div className="space-y-12">
                  <div className="text-center space-y-3">
                    <div className="sleek-label">Size Assistance</div>
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Clovet Size Chart</h2>
                  </div>

                  <div className="space-y-8">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">US Size</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">UK Size</th>
                          <th className="py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Chest (CM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[
                          { us: 'S', uk: '36', chest: '88-96' },
                          { us: 'M', uk: '38', chest: '96-104' },
                          { us: 'L', uk: '40', chest: '104-112' },
                          { us: 'XL', uk: '42', chest: '112-124' },
                        ].map(row => (
                          <tr key={row.us} className="group hover:bg-gray-50 transition-colors">
                            <td className="py-6 font-black text-sm">{row.us}</td>
                            <td className="py-6 text-sm text-gray-500 font-medium">{row.uk}</td>
                            <td className="py-6 text-sm text-gray-500 font-medium">{row.chest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] space-y-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Measurement Tip</p>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">Wrap the tape measure under your armpits, around the fullest part of your chest. The tape should be level and flat against your body.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsSizeChartOpen(false)}
                    className="w-full sleek-button-primary py-6"
                  >
                    Close Assistant
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
