import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ScanSearch,
  Eye,
  ArrowLeft,
  AlertTriangle,
  BrainCircuit,
  Zap,
  Activity,
  Box,
  ShoppingBag,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, Routes, Route, useLocation, Link } from 'react-router-dom';

const INITIAL_QUEUE = [
  { id: 'VR-1092', product: 'Green Essentials T-Shirt', seller: 'SellerA', date: 'May 12, 2026', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=90', sku: 'CLVT-001', cat: 'Tops', status: 'WAITING', logisticsStrategy: undefined as string | undefined },
  { id: 'VR-2041', product: 'Black Cropped Tee', seller: 'SellerB', date: 'May 11, 2026', image: 'https://images.unsplash.com/photo-1581655353564-ee0c2909d518?w=400&q=90', sku: 'CLVT-002', cat: 'Tops', status: 'WAITING', logisticsStrategy: undefined as string | undefined },
  { id: 'VR-3088', product: 'Vintage Varsity Jacket', seller: 'SellerC', date: 'May 11, 2026', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=90', sku: 'CLVT-003', cat: 'Outerwears', status: 'AUTHENTIC', logisticsStrategy: 'Auto-dispatch to customer' },
  { id: 'VR-4011', product: 'Light Blue Relaxed Jeans', seller: 'SellerD', date: 'May 10, 2026', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=90', sku: 'CLVT-004', cat: 'Bottoms', status: 'COUNTERFEIT', logisticsStrategy: 'Quarantine / Evidence hold' },
];

export default function VerifierDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const productsList = Array.isArray(data) ? data : (data.products || []);
        const mappedData = productsList.map((item: any) => ({
          id: item.id.toString(),
          product: item.name,
          seller: 'Community Seller',
          date: new Date(item.created_at).toLocaleDateString(),
          image: item.image,
          sku: `CLVT-${item.id}`,
          cat: item.category,
          condition: item.condition,
          status: item.status === 'VERIFIED' ? 'AUTHENTIC' : item.status === 'REJECTED' ? 'COUNTERFEIT' : 'WAITING',
          dbStatus: item.status
        }));
        setQueue(mappedData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const location = useLocation();
  const path = location.pathname;

  const updateStatus = async (id: string, status: string, logisticsStrategy?: string) => {
    try {
      const dbStatus = status === 'AUTHENTIC' ? 'VERIFIED' : 'REJECTED';
      const response = await fetch(`/api/products/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus })
      });
      if (response.ok) {
        setQueue(prev => prev.map(item => item.id === id ? { ...item, status, logisticsStrategy } : item));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-bg-main min-h-screen">
      <main className="w-full overflow-y-auto">
        <Routes>
           <Route path="/" element={<VerifierMain queue={queue} />} />
           <Route path="/products" element={<VerificationQueue queue={queue} />} />
           <Route path="/inspect/:id" element={<InspectionDetail queue={queue} onUpdateStatus={updateStatus} />} />
           <Route path="/orders" element={<OrdersPlaceholder />} />
           <Route path="/finance" element={<FinancePlaceholder />} />
        </Routes>
      </main>
    </div>
  );
}

function OrdersPlaceholder() {
  return <div className="p-16"><h2 className="text-3xl font-black uppercase tracking-tighter">Orders Management</h2><p className="text-gray-400 mt-4">Module coming soon for Verifiers.</p></div>;
}

function FinancePlaceholder() {
  return <div className="p-16"><h2 className="text-3xl font-black uppercase tracking-tighter">Finance & Settlement</h2><p className="text-gray-400 mt-4">Module coming soon for Verifiers.</p></div>;
}

function VerifierMain({ queue }: { queue: any[] }) {
  const navigate = useNavigate();
 
  return (
    <div className="bg-bg-main min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-20 max-w-[95%] space-y-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-12 rounded-[3.5rem] shadow-2xl border-none gap-8">
           <div className="space-y-3">
              <div className="flex items-center space-x-4 mb-4 text-black">
                 <div className="p-4 bg-black text-white rounded-[1.5rem] shadow-xl">
                    <ShieldCheck size={32} />
                 </div>
                 <h1 className="text-4xl font-display font-black tracking-tighter uppercase">Verification Dashboard</h1>
              </div>
           </div>
        </div>
 
        <VerificationQueue queue={queue} />
      </div>
    </div>
  );
}
 
function VerificationQueue({ queue }: { queue: any[] }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL STATUS');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      const matchesFilter = filter === 'ALL STATUS' || item.status === filter;
      const matchesSearch = item.product.toLowerCase().includes(search.toLowerCase()) || 
                           item.sku.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [queue, filter, search]);

  const totalPages = Math.ceil(filteredQueue.length / itemsPerPage);
  const currentItems = filteredQueue.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    active: queue.filter(i => i.status === 'WAITING').length,
    authentic: queue.filter(i => i.status === 'AUTHENTIC').length,
    counterfeit: queue.filter(i => i.status === 'COUNTERFEIT').length,
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
         <div className="sleek-card p-10 border-none space-y-6 bg-white">
            <div className="flex justify-between items-center text-gray-400">
               <span className="text-[10px] font-black uppercase tracking-widest">Active Tasks</span>
               <div className="p-3 bg-zinc-50 text-black rounded-xl">
                 <Zap size={20} />
               </div>
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-display font-black tracking-tighter text-black">{stats.active}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-black">Awaiting Analysis</p>
            </div>
         </div>
         <div className="sleek-card p-10 border-none space-y-6 bg-white">
            <div className="flex justify-between items-center text-gray-400">
               <span className="text-[10px] font-black uppercase tracking-widest">Authenticated</span>
               <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                 <ShieldCheck size={20} />
               </div>
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-display font-black tracking-tighter text-black">{stats.authentic}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Verified Products</p>
            </div>
         </div>
         <div className="sleek-card p-10 border-none space-y-6 bg-white">
            <div className="flex justify-between items-center text-gray-400">
               <span className="text-[10px] font-black uppercase tracking-widest">Counterfeit</span>
               <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                 <AlertTriangle size={20} />
               </div>
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-display font-black tracking-tighter text-black">{stats.counterfeit}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Total Flags</p>
            </div>
         </div>
      </div>

      <div className="sleek-card border-none overflow-hidden bg-white shadow-2xl">
         <div className="p-10 border-b border-gray-100 flex flex-col lg:flex-row gap-8 justify-between items-center bg-zinc-50/50">
            <div className="relative max-w-xl w-full">
               <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
               <input 
                type="text" 
                placeholder="Scan SKU or Global Tag..." 
                className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-widest outline-none shadow-xl focus:ring-2 focus:ring-black placeholder:text-gray-200" 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
               />
            </div>
            <div className="flex items-center space-x-3 overflow-x-auto pb-4 lg:pb-0 w-full lg:w-auto">
               {['ALL STATUS', 'WAITING', 'AUTHENTIC', 'COUNTERFEIT'].map(c => (
                 <button 
                  key={c} 
                  onClick={() => {
                    setFilter(c);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap", 
                    filter === c ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black hover:bg-white"
                  )}
                 >
                   {c}
                 </button>
               ))}
            </div>
         </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-white">
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Analysis</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Provenance</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Condition</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Arrival</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Validation State</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operation</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {currentItems.map(item => (
                   <tr key={item.id} className="hover:bg-gray-50/50 transition-all cursor-pointer group">
                      <td className="px-10 py-8">
                         <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 shadow-inner group-hover:scale-110 transition-transform">
                               <img src={item.image} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                            </div>
                            <div className="space-y-1">
                               <span className="font-display font-black text-lg tracking-tight uppercase block">{item.product}</span>
                               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{item.sku}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <p className="text-xs font-black uppercase tracking-tight text-gray-400">{item.cat}</p>
                         <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ENT: {item.seller}</p>
                      </td>
                      <td className="px-10 py-8">
                         <span className={cn(
                           "px-4 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest border",
                           item.condition === 'New' 
                             ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                             : "bg-amber-50 text-amber-600 border-amber-100"
                         )}>
                           {item.condition}
                         </span>
                      </td>
                      <td className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-300">{item.date}</td>
                      <td className="px-10 py-8">
                         <div className={cn(
                           "inline-flex px-6 py-2 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm",
                           item.status === 'WAITING' && "bg-zinc-900 text-white",
                           item.status === 'AUTHENTIC' && "bg-emerald-50 text-emerald-600",
                           item.status === 'COUNTERFEIT' && "bg-red-50 text-red-600"
                         )}>
                           {item.status}
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate(`/verifier/inspect/${item.id}`);
                           }} 
                           className="flex items-center space-x-3 px-6 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black hover:text-white transition-all group-hover:translate-x-2"
                         >
                            <span>{item.status === 'WAITING' ? 'Execute Inspection' : 'Review Results'}</span>
                            <ChevronRight size={16} />
                         </button>
                      </td>
                   </tr>
                 ))}
                 {currentItems.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-10 py-20 text-center text-gray-400 uppercase tracking-[0.2em] font-black text-[10px]">
                       No items found in this tier
                     </td>
                   </tr>
                 )}
              </tbody>
           </table>
         </div>

         {/* Pagination UI */}
         {totalPages > 1 && (
           <div className="p-8 bg-zinc-50/50 border-t border-gray-100 flex justify-center items-center space-x-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-4 bg-white border border-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all shadow-sm"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              <div className="flex items-center space-x-2">
                 {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                        currentPage === i + 1 ? "bg-black text-white shadow-lg" : "bg-white text-gray-400 hover:text-black border border-gray-100"
                      )}
                    >
                      {i + 1}
                    </button>
                 ))}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-4 bg-white border border-gray-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
           </div>
         )}
      </div>
    </div>
  );
}

export function InspectionDetail({ queue, onUpdateStatus }: { queue: typeof INITIAL_QUEUE, onUpdateStatus: (id: string, status: string, logisticsStrategy?: string) => void }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const task = useMemo(() => queue.find(t => t.id === id) || queue[0], [queue, id]);
  const isReviewMode = task.status !== 'WAITING';

  const [checklist, setChecklist] = useState({
    material: isReviewMode,
    label: isReviewMode,
    stitching: isReviewMode,
    packaging: isReviewMode
  });
  const [rejectReason, setRejectReason] = useState('');
  const [showEvidenceField, setShowEvidenceField] = useState(false);

  const toggleCheck = (key: keyof typeof checklist) => {
    if (isReviewMode) return;
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isComplete = Object.values(checklist).every(v => v === true);

  const handleValidation = (status: 'AUTHENTIC' | 'COUNTERFEIT') => {
    if (id && !isReviewMode) {
      onUpdateStatus(id, status);
      navigate('/verifier');
    }
  };

  return (
    <div className="bg-bg-main min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-20 max-w-7xl space-y-16">
        <button onClick={() => navigate('/verifier')} className="flex items-center space-x-4 text-[10px] font-black text-black hover:opacity-60 transition-opacity uppercase tracking-[0.3em]">
          <ArrowLeft size={18} />
          <span>Exit Inspection</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Main Inspection View */}
           <div className="lg:col-span-8 sleek-card border-none bg-white p-16 shadow-2xl space-y-16">
              <div className="flex flex-col md:flex-row gap-16">
                 <div className="w-full md:w-1/2 space-y-8">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Analysis Frame</p>
                    <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden bg-gray-50 border-8 border-gray-50 shadow-inner group relative">
                       <img src={task.image} alt="Product" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                          <ScanSearch size={64} className="text-white" />
                       </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                       {[1, 2, 3, 4].map(i => (
                          <div key={i} className="aspect-square rounded-2xl bg-gray-50 overflow-hidden cursor-pointer border border-transparent hover:border-black transition-all">
                             <img src={task.image} className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100" />
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="w-full md:w-1/2 space-y-12">
                    <div className="space-y-4">
                       <div className="flex items-center space-x-4 italic">
                          <BrainCircuit size={20} className="text-zinc-400" />
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Analysis active</p>
                       </div>
                       <h1 className="text-5xl font-display font-black tracking-tighter uppercase leading-tight">{task.product}</h1>
                       <div className="flex items-center space-x-4 border-l-8 border-black/5 pl-8 mt-8">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Global SKU</p>
                             <p className="text-xl font-display font-black tracking-tight">{task.sku}</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] pb-4 border-b border-gray-100">Verification protocol</h3>
                       <div className="space-y-3">
                          {[
                            { key: 'material', label: 'Material DNA', desc: 'Grain and fibre density check' },
                            { key: 'label', label: 'Tag Integrity', desc: 'Typography and hologram sync' },
                            { key: 'stitching', label: 'Mechanical Lock', desc: 'Stitch count and thread tension' },
                            { key: 'packaging', label: 'Ancillary Shield', desc: 'Original containers and accessories' }
                          ].map(item => (
                            <button 
                              key={item.key}
                              onClick={() => toggleCheck(item.key as any)}
                              className={cn(
                                "w-full flex flex-col p-8 rounded-[2rem] border-2 transition-all group text-left",
                                checklist[item.key as keyof typeof checklist] ? "border-black bg-black text-white shadow-2xl scale-105" : "border-gray-50 hover:border-black/10 hover:bg-gray-50"
                              )}
                            >
                               <div className="flex items-center justify-between w-full">
                                  <div className="space-y-1">
                                     <p className="text-sm font-black uppercase tracking-tight">{item.label}</p>
                                     <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40", checklist[item.key as keyof typeof checklist] && "text-white/60")}>{item.desc}</p>
                                  </div>
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    checklist[item.key as keyof typeof checklist] ? "bg-white text-black" : "bg-gray-100 text-gray-300"
                                  )}>
                                     <CheckCircle2 size={18} />
                                  </div>
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Sidebar Actions */}
           <div className="lg:col-span-4 space-y-10">
              <div className="sleek-card border-none bg-white p-12 shadow-2xl space-y-12">
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Final Determination</h3>
                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] flex items-center space-x-6">
                       <div className="p-5 bg-black text-white rounded-3xl shadow-xl">
                          <ShieldCheck size={32} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">State</p>
                          <p className="text-xl font-display font-black uppercase tracking-tighter text-black">
                            {task.status === 'WAITING' ? 'Awaiting Analysis' : task.status}
                          </p>
                       </div>
                    </div>
                 </div>

                 {task.status === 'WAITING' && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <button 
                            onClick={() => handleValidation('AUTHENTIC')}
                            disabled={!isComplete || task.status !== 'WAITING'}
                            className={cn(
                              "w-full py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl flex items-center justify-center space-x-4",
                              isComplete && task.status === 'WAITING' ? "bg-black text-white hover:scale-105 active:scale-95" : "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
                            )}
                          >
                             <CheckCircle2 size={24} />
                             <span>Accept Product</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (!showEvidenceField) {
                                setShowEvidenceField(true);
                              } else {
                                handleValidation('COUNTERFEIT');
                              }
                            }}
                            disabled={task.status !== 'WAITING'}
                            className={cn(
                              "w-full border-4 py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center space-x-4 group disabled:opacity-50 disabled:cursor-not-allowed",
                              showEvidenceField ? "bg-red-500 border-red-500 text-white shadow-xl" : "border-gray-100 text-gray-300 hover:border-red-500 hover:text-red-500"
                            )}
                          >
                             <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                             <span>{showEvidenceField ? 'Confirm Reject' : 'Reject Product'}</span>
                          </button>
                       </div>

                       <AnimatePresence>
                         {showEvidenceField && (
                           <motion.div 
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="space-y-4 overflow-hidden pt-4"
                           >
                              <div className="space-y-4">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Evidence Documentation</p>
                                <textarea 
                                  placeholder="Document evidence (e.g., stitch mismatch, label hologram missing)..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="w-full h-32 bg-red-50 border border-red-100 rounded-2xl p-6 outline-none focus:ring-2 focus:ring-red-500 font-bold text-xs tracking-tight placeholder:text-red-200 resize-none leading-relaxed"
                                />
                                <div className="aspect-video border-2 border-dashed border-red-100 rounded-2xl flex flex-col items-center justify-center text-red-200">
                                   <div className="flex flex-col items-center gap-2">
                                      <Eye size={24} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Upload Proof Photos</span>
                                   </div>
                                </div>
                              </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  )}
              </div>

              <div className="p-10 bg-zinc-900 rounded-[3.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px]" />
                 <div className="flex items-center space-x-4 text-orange-400">
                    <AlertTriangle size={24} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Protocols</h4>
                 </div>
                 <p className="text-xs text-white/50 leading-relaxed font-bold uppercase tracking-tight">
                   Ensure tactile feedback matches the original product data. Any deviation is a critical security failure.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
