import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ScanSearch,
  Eye,
  ArrowLeft,
  AlertTriangle,
  BrainCircuit,
  Zap,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type QueueItem = {
  id: string;
  product: string;
  seller: string;
  date: string;
  image: string;
  sku: string;
  cat: string;
  condition: string;
  tracking_number: string;
  status: 'WAITING' | 'AUTHENTIC' | 'COUNTERFEIT';
  dbStatus: string;
  verification_notes?: string;
};

const CHECKLIST_ITEMS = [
  { key: 'material',  label: 'Material DNA',     desc: 'Grain and fibre density check' },
  { key: 'label',     label: 'Tag Integrity',     desc: 'Typography and hologram sync' },
  { key: 'stitching', label: 'Mechanical Lock',   desc: 'Stitch count and thread tension' },
  { key: 'packaging', label: 'Ancillary Shield',  desc: 'Original containers and accessories' },
] as const;

type ChecklistKey = typeof CHECKLIST_ITEMS[number]['key'];

// ─── Main component (single page) ────────────────────────────────────────────

export default function VerifierDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue]       = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<QueueItem | null>(null); // null = show queue, non-null = show inspection

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  React.useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const orders: any[] = data.orders || [];
        const filtered = orders.filter((o: any) =>
          ['IN_VERIFICATION', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'REJECTED', 'REFUNDED'].includes(o.status)
        );
        setQueue(filtered.map((o: any): QueueItem => ({
          id: String(o.id),
          product: o.product_name || 'Unknown Product',
          seller: 'Community Seller',
          date: new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          image: o.product_image || '',
          sku: `CLVT-${String(o.product_internal_id || o.product_id || o.id).padStart(3, '0')}`,
          cat: o.category || 'Apparel',
          condition: o.condition || 'New',
          tracking_number: o.tracking_number || '',
          status:
            o.status === 'IN_VERIFICATION' ? 'WAITING' :
            ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(o.status) ? 'AUTHENTIC' :
            ['REJECTED', 'REFUNDED'].includes(o.status) ? 'COUNTERFEIT' : 'WAITING',
          dbStatus: o.status,
          verification_notes: o.verification_notes || '',
        })));
      }
    } catch (e) {
      console.error('Failed to fetch queue:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerdict = async (id: string, verdict: 'AUTHENTIC' | 'COUNTERFEIT', notes: string, evidenceImage?: string) => {
    const res = await fetch(`/api/orders/${id}/verify`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: verdict, notes, evidence_image: evidenceImage || '' }),
    });
    if (res.ok) {
      setQueue(prev => prev.map(item =>
        item.id === id
          ? { ...item, status: verdict, dbStatus: verdict === 'AUTHENTIC' ? 'SHIPPED' : 'REJECTED', verification_notes: notes }
          : item
      ));
      setSelected(prev => prev?.id === id ? { ...prev, status: verdict } : prev);
    }
  };

  return (
    <div className="bg-bg-main min-h-screen">
      {/* ── Main content ── */}
      <div className="w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="inspection"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              <InspectionPanel
                task={selected}
                onBack={() => setSelected(null)}
                onVerdict={handleVerdict}
              />
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
            >
              <QueuePanel
                queue={queue}
                isLoading={isLoading}
                onSelect={setSelected}
                onLogout={() => { logout(); navigate('/login'); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Queue Panel ──────────────────────────────────────────────────────────────

function QueuePanel({
  queue,
  isLoading,
  onSelect,
  onLogout,
}: {
  queue: QueueItem[];
  isLoading: boolean;
  onSelect: (item: QueueItem) => void;
  onLogout: () => void;
}) {
  const [filter, setFilter] = useState<'ALL' | 'WAITING' | 'AUTHENTIC' | 'COUNTERFEIT'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 7;

  const filtered = useMemo(() =>
    queue.filter(item => {
      const matchFilter = filter === 'ALL' || item.status === filter;
      const matchSearch = item.product.toLowerCase().includes(search.toLowerCase()) ||
                          item.sku.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    }),
  [queue, filter, search]);

  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const currentItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-12 space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="p-4 bg-black text-white rounded-[1.5rem] shadow-xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-display font-black tracking-tighter uppercase">Verification Queue</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Expert Verifier Portal — Clovet Authenticity Center</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-100"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-8">
        {[
          { label: 'Active Tasks',  value: queue.filter(i => i.status === 'WAITING').length,     icon: <Zap size={20} />,          bg: 'bg-zinc-50',   text: 'text-black'        },
          { label: 'Authenticated', value: queue.filter(i => i.status === 'AUTHENTIC').length,   icon: <ShieldCheck size={20} />,   bg: 'bg-green-50',  text: 'text-emerald-600'  },
          { label: 'Counterfeit',   value: queue.filter(i => i.status === 'COUNTERFEIT').length, icon: <AlertTriangle size={20} />, bg: 'bg-red-50',    text: 'text-red-600'      },
        ].map(s => (
          <div key={s.label} className="sleek-card p-10 border-none bg-white space-y-6">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
              <div className={cn('p-3 rounded-xl', s.bg, s.text)}>{s.icon}</div>
            </div>
            <p className={cn('text-4xl font-display font-black tracking-tighter', s.text)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="sleek-card border-none overflow-hidden bg-white shadow-2xl">
        {/* Toolbar */}
        <div className="p-10 border-b border-gray-100 flex flex-col lg:flex-row gap-6 justify-between items-center bg-zinc-50/50">
          <div className="relative max-w-md w-full">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none shadow-lg focus:ring-2 focus:ring-black placeholder:text-gray-200"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center space-x-2">
            {(['ALL', 'WAITING', 'AUTHENTIC', 'COUNTERFEIT'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={cn(
                  'px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap',
                  filter === f ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'
                )}
              >
                {f === 'ALL' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-50">
                {['Product', 'Category', 'Condition', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-300 uppercase tracking-widest font-black text-[10px] animate-pulse">
                    Loading queue...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-300 uppercase tracking-widest font-black text-[10px]">
                    No items in this tier
                  </td>
                </tr>
              ) : currentItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-all group cursor-pointer" onClick={() => onSelect(item)}>
                  {/* Product */}
                  <td className="px-8 py-7">
                    <div className="flex items-center space-x-5">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
                        <img src={item.image} alt={item.product} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div>
                        <p className="font-display font-black text-sm tracking-tight uppercase">{item.product}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-8 py-7">
                    <p className="text-xs font-black uppercase tracking-tight text-gray-400">{item.cat}</p>
                  </td>
                  {/* Condition */}
                  <td className="px-8 py-7">
                    <span className={cn(
                      'px-4 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest border',
                      item.condition === 'New'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    )}>
                      {item.condition}
                    </span>
                  </td>
                  {/* Date */}
                  <td className="px-8 py-7 text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">{item.date}</td>
                  {/* Status badge */}
                  <td className="px-8 py-7">
                    <div className={cn(
                      'inline-flex px-5 py-2 text-[10px] font-black rounded-full uppercase tracking-widest',
                      item.status === 'WAITING'     && 'bg-zinc-900 text-white',
                      item.status === 'AUTHENTIC'   && 'bg-emerald-50 text-emerald-600',
                      item.status === 'COUNTERFEIT' && 'bg-red-50 text-red-600',
                    )}>
                      {item.status}
                    </div>
                  </td>
                  {/* Action */}
                  <td className="px-8 py-7">
                    <button
                      onClick={e => { e.stopPropagation(); onSelect(item); }}
                      className="flex items-center space-x-2 px-5 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black hover:text-white transition-all group-hover:translate-x-1"
                    >
                      <span>{item.status === 'WAITING' ? 'Inspect' : 'Review'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-8 bg-zinc-50/50 border-t border-gray-100 flex justify-center items-center space-x-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-black hover:text-white transition-all shadow-sm">
              <ChevronRight size={16} className="rotate-180" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={cn('w-9 h-9 rounded-xl text-[10px] font-black transition-all',
                  page === i + 1 ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-400 hover:text-black border border-gray-100'
                )}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-black hover:text-white transition-all shadow-sm">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inspection Panel (inline, replaces queue) ────────────────────────────────

function InspectionPanel({
  task,
  onBack,
  onVerdict,
}: {
  task: QueueItem;
  onBack: () => void;
  onVerdict: (id: string, verdict: 'AUTHENTIC' | 'COUNTERFEIT', notes: string, evidenceImage?: string) => Promise<void>;
}) {
  const isReviewMode = task.status !== 'WAITING';

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    material:  isReviewMode,
    label:     isReviewMode,
    stitching: isReviewMode,
    packaging: isReviewMode,
  });
  const [rejectReason,     setRejectReason]     = useState('');
  const [showEvidenceField, setShowEvidenceField] = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [proofFiles,        setProofFiles]        = useState<File[]>([]);

  // Sync when task prop changes (e.g. after verdict applied)
  React.useEffect(() => {
    const done = task.status !== 'WAITING';
    setChecklist({ material: done, label: done, stitching: done, packaging: done });
  }, [task.status]);

  const allChecked = Object.values(checklist).every(Boolean);
  const checkedCount = Object.values(checklist).filter(Boolean).length;

  const toggleCheck = (key: ChecklistKey) => {
    if (isReviewMode) return;
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const submit = async (verdict: 'AUTHENTIC' | 'COUNTERFEIT') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    // Convert proof images to base64 for the API (evidence_image field)
    let evidenceImage = '';
    if (verdict === 'COUNTERFEIT' && proofFiles.length > 0) {
      evidenceImage = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(proofFiles[0]);
      });
    }
    await onVerdict(task.id, verdict, rejectReason, evidenceImage);
    setIsSubmitting(false);
    onBack();
  };

  return (
    <div className="p-12 space-y-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-3 text-[10px] font-black text-black hover:opacity-60 transition-opacity uppercase tracking-[0.3em]"
      >
        <ArrowLeft size={16} />
        <span>Back to Queue</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ── Main inspection panel ── */}
        <div className="lg:col-span-8 sleek-card border-none bg-white p-14 shadow-2xl space-y-14">
          <div className="flex flex-col md:flex-row gap-14">
            {/* Product image */}
            <div className="w-full md:w-5/12 space-y-6">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Analysis Frame</p>
              <div className="aspect-[3/4] rounded-[3rem] overflow-hidden bg-gray-50 border-8 border-gray-50 shadow-inner group relative">
                <img src={task.image} alt={task.product} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <ScanSearch size={56} className="text-white" />
                </div>
              </div>
              {/* Thumbnail strip */}
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-50 overflow-hidden cursor-pointer border border-transparent hover:border-black transition-all">
                    <img src={task.image} className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100" alt="" />
                  </div>
                ))}
              </div>
            </div>

            {/* Info + checklist */}
            <div className="w-full md:w-7/12 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 italic">
                  <BrainCircuit size={18} className="text-zinc-400" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {isReviewMode ? 'Inspection completed' : 'Analysis active'}
                  </p>
                </div>
                <h1 className="text-4xl font-display font-black tracking-tighter uppercase leading-tight">{task.product}</h1>
                <div className="flex flex-wrap gap-6 border-l-8 border-black/5 pl-6 mt-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">SKU</p>
                    <p className="text-lg font-display font-black tracking-tight">{task.sku}</p>
                  </div>
                  {task.tracking_number && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Resi</p>
                      <p className="text-sm font-mono font-black tracking-tight bg-gray-50 px-4 py-2 rounded-xl text-black border border-gray-100">
                        {task.tracking_number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Checklist (REQ-F4-2) ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Verification Protocol</h3>
                  {!isReviewMode && (
                    <span className={cn('text-[10px] font-black uppercase tracking-widest', allChecked ? 'text-emerald-500' : 'text-amber-500')}>
                      {checkedCount}/{CHECKLIST_ITEMS.length} checked
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {CHECKLIST_ITEMS.map(item => {
                    const checked = checklist[item.key];
                    return (
                      <button
                        key={item.key}
                        onClick={() => toggleCheck(item.key)}
                        disabled={isReviewMode}
                        className={cn(
                          'w-full flex items-center justify-between p-7 rounded-[1.5rem] border-2 transition-all text-left',
                          isReviewMode
                            ? checked ? 'border-black bg-black text-white cursor-default' : 'border-gray-100 opacity-40 cursor-not-allowed'
                            : checked ? 'border-black bg-black text-white shadow-xl scale-[1.02] cursor-pointer' : 'border-gray-100 hover:border-black/20 hover:bg-gray-50 cursor-pointer'
                        )}
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-black uppercase tracking-tight">{item.label}</p>
                          <p className={cn('text-[10px] font-bold uppercase tracking-widest', checked ? 'text-white/50' : 'text-gray-300')}>
                            {item.desc}
                          </p>
                        </div>
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all', checked ? 'bg-white text-black' : 'bg-gray-100 text-gray-300')}>
                          <CheckCircle2 size={18} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Previous rejection notes in review mode */}
              {isReviewMode && task.status === 'COUNTERFEIT' && task.verification_notes && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Rejection Notes</p>
                  <p className="text-xs font-bold text-red-800 leading-relaxed whitespace-pre-wrap">{task.verification_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar actions ── */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sleek-card border-none bg-white p-10 shadow-2xl space-y-10">
            {/* State display */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Final Determination</h3>
              <div className="p-7 bg-zinc-50 rounded-[2rem] flex items-center space-x-5">
                <div className="p-4 bg-black text-white rounded-2xl shadow-xl">
                  <ShieldCheck size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">State</p>
                  <p className={cn(
                    'text-lg font-display font-black uppercase tracking-tighter',
                    task.status === 'AUTHENTIC'   ? 'text-emerald-600' :
                    task.status === 'COUNTERFEIT' ? 'text-red-600'     : 'text-black'
                  )}>
                    {task.status === 'WAITING' ? 'Awaiting Analysis' : task.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions — only when WAITING */}
            {!isReviewMode && (
              <div className="space-y-4">
                {/* Accept — needs all checkboxes */}
                <button
                  onClick={() => submit('AUTHENTIC')}
                  disabled={!allChecked || isSubmitting}
                  className={cn(
                    'w-full py-7 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl flex items-center justify-center space-x-3',
                    allChecked && !isSubmitting
                      ? 'bg-black text-white hover:scale-105 active:scale-95'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                  )}
                >
                  <CheckCircle2 size={22} />
                  <span>{isSubmitting ? 'Processing...' : 'Mark as Authentic'}</span>
                </button>

                {!allChecked && (
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center">
                    Tick all {CHECKLIST_ITEMS.length} items to accept
                  </p>
                )}

                {/* Reject */}
                <button
                  onClick={() => !showEvidenceField ? setShowEvidenceField(true) : submit('COUNTERFEIT')}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full border-4 py-7 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center space-x-3 group disabled:opacity-50 disabled:cursor-not-allowed',
                    showEvidenceField
                      ? 'bg-red-500 border-red-500 text-white shadow-xl'
                      : 'border-gray-100 text-gray-300 hover:border-red-500 hover:text-red-500'
                  )}
                >
                  <XCircle size={22} className="group-hover:scale-110 transition-transform" />
                  <span>{showEvidenceField ? 'Confirm Reject' : 'Reject Product'}</span>
                </button>

                {/* Evidence textarea */}
                <AnimatePresence>
                  {showEvidenceField && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Evidence Documentation</p>
                      <textarea
                        placeholder="Document evidence (stitch mismatch, missing hologram, etc.)..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="w-full h-28 bg-red-50 border border-red-100 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-red-500 font-bold text-xs tracking-tight placeholder:text-red-200 resize-none leading-relaxed"
                      />
                      <div className="space-y-2">
                        <label
                          htmlFor="proof-upload"
                          className="flex flex-col items-center justify-center gap-2 aspect-video border-2 border-dashed border-red-200 rounded-2xl cursor-pointer hover:bg-red-50 transition-all text-red-300 hover:text-red-400"
                        >
                          <Eye size={22} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {proofFiles.length > 0 ? `${proofFiles.length} photo(s) selected` : 'Upload Proof Photos'}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">JPG / PNG · Max 5MB each</span>
                        </label>
                        <input
                          id="proof-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          multiple
                          className="hidden"
                          onChange={e => {
                            const files = Array.from(e.target.files || []).filter(f => f.size <= 5 * 1024 * 1024);
                            setProofFiles(files);
                          }}
                        />
                        {proofFiles.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {proofFiles.map((f, i) => (
                              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-red-100 bg-red-50">
                                <img
                                  src={URL.createObjectURL(f)}
                                  alt={`proof-${i}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => setProofFiles(prev => prev.filter((_, idx) => idx !== i))}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black hover:bg-red-600"
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Result badge in review mode */}
            {isReviewMode && (
              <div className={cn(
                'p-8 rounded-[2rem] text-center space-y-3',
                task.status === 'AUTHENTIC' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              )}>
                {task.status === 'AUTHENTIC' ? <CheckCircle2 size={32} className="mx-auto" /> : <XCircle size={32} className="mx-auto" />}
                <p className="font-black uppercase tracking-widest text-sm">
                  {task.status === 'AUTHENTIC' ? 'Product Verified Authentic' : 'Product Flagged Counterfeit'}
                </p>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                  {task.status === 'AUTHENTIC' ? 'Dispatched to customer' : 'Refund initiated · Seller suspended'}
                </p>
              </div>
            )}
          </div>

          {/* Protocol reminder */}
          <div className="p-10 bg-zinc-900 rounded-[3rem] text-white space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px]" />
            <div className="flex items-center space-x-3 text-orange-400">
              <AlertTriangle size={22} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Protocols</h4>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-bold uppercase tracking-tight">
              Complete all checklist items before accepting. Any deviation from original product data is a critical security failure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
