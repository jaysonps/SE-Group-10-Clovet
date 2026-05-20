import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ChevronRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, updateItem } = useCart();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const serviceFee = cart.length > 0 ? 10000 : 0;
  const total = subtotal + serviceFee;

  if (cart.length === 0) {
    return (
      <div className="bg-bg-main min-h-screen py-32">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
             <ShoppingBag size={40} className="text-gray-300" />
          </div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tighter">Your Bag is Empty</h1>
          <p className="text-gray-500 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Explore our collection to find something special.</p>
          <Link to="/listing" className="sleek-button-primary inline-block px-12 py-5 uppercase font-bold text-sm tracking-widest bg-black text-white hover:bg-zinc-800 transition-colors">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-main min-h-screen pb-32 pt-16">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="flex items-center space-x-4 mb-12">
           <Link to="/listing" className="p-3 bg-white border border-gray-100 rounded-2xl hover:scale-110 transition-transform shadow-sm">
             <ArrowLeft size={20} />
           </Link>
           <h1 className="text-5xl font-display font-black uppercase tracking-tighter">Shopping Bag <span className="opacity-20 ml-2">({cart.length})</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <div key={item.cartId} className="sleek-card p-8 bg-white border border-gray-100 space-y-8 group relative">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Image */}
                  <div className="w-full md:w-48 aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{item.brand}</p>
                          <Link to={`/product/${item.id}`} className="text-3xl font-display font-black uppercase tracking-tight hover:opacity-70 transition-opacity leading-none block">
                            {item.name}
                          </Link>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-display font-black tracking-tighter">IDR {item.price.toLocaleString()}</p>
                          {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                            <p className="text-[10px] font-bold text-gray-300 line-through decoration-gray-300">
                              IDR {Number(item.originalPrice).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Size Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Size</label>
                          <div className="flex flex-wrap gap-2">
                            {SIZES.map(s => (
                              <button
                                key={s}
                                onClick={() => updateItem(item.cartId, { size: s })}
                                className={cn(
                                  "w-10 h-10 rounded-xl text-xs font-black transition-all border-2",
                                  item.size === s ? "bg-black text-white border-black" : "bg-white text-gray-400 border-gray-100 hover:border-black"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Condition Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Condition</label>
                          <div className="flex bg-gray-50 p-1 rounded-xl w-fit">
                            <button
                              onClick={() => updateItem(item.cartId, { condition: 'brand-new' })}
                              className={cn(
                                "px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                                item.condition === 'brand-new' ? "bg-white text-black shadow-sm" : "text-gray-400"
                              )}
                            >
                              New
                            </button>
                            <button
                              onClick={() => updateItem(item.cartId, { condition: 'used' })}
                              className={cn(
                                "px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                                item.condition === 'used' ? "bg-white text-black shadow-sm" : "text-gray-400"
                              )}
                            >
                              Used
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-gray-50 mt-8">
                       <div className="flex items-center space-x-6">
                         <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100 p-1">
                           <button onClick={() => updateQuantity(item.cartId, -1)} className="p-2 hover:bg-white rounded-xl transition-all"><Minus size={14} /></button>
                           <span className="w-12 text-center text-sm font-black">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.cartId, 1)} className="p-2 hover:bg-white rounded-xl transition-all"><Plus size={14} /></button>
                         </div>
                       </div>
                       <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6 sticky top-24">
             <div className="sleek-card p-10 bg-zinc-900 text-white border-none space-y-10">
                <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Order Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                    <span className="font-medium">IDR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-xs font-bold uppercase tracking-widest">Service Fee</span>
                    <span className="font-medium">IDR {serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                    <span className="text-4xl font-display font-black tracking-tight">IDR {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4">
                   <Link 
                    to="/checkout" 
                    className="w-full sleek-button-primary bg-white text-black hover:bg-emerald-400 hover:text-white py-6 scale-105 shadow-2xl flex items-center justify-center space-x-3 transition-all duration-500 group"
                   >
                     <span className="uppercase font-black text-sm tracking-[0.2em]">Secure Checkout</span>
                     <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                   </Link>
                </div>

                <p className="text-[10px] text-center opacity-30 uppercase font-bold tracking-widest">Prices include all applicable taxes</p>
             </div>

             <div className="sleek-card p-8 bg-white border border-gray-100 flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                   <ShoppingBag size={20} />
                </div>
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 leading-none">Free Shipping Eligible</p>
                   <p className="text-xs text-gray-400 font-medium">Add IDR 400K more for free worldwide shipping</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
