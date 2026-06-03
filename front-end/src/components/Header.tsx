import React, { useState } from 'react';
import { Search, ShoppingBag, User } from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('q') || searchParams.get('search') || '';
  const [searchVal, setSearchVal] = useState(initialSearch);

  React.useEffect(() => {
    setSearchVal(initialSearch);
  }, [initialSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/listing?q=${encodeURIComponent(searchVal)}`);
    }
  };

  const userRole = user?.role ?? 'customer';
  const isDashboard =
    location.pathname.startsWith('/seller') ||
    location.pathname.startsWith('/verifier') ||
    (userRole !== 'customer' && !!user);

  const categories = [
    { name: 'Trending',          path: '/listing?sort=trending' },
    { name: 'Tops',              path: '/listing?category=tops' },
    { name: 'Outerwears',        path: '/listing?category=outerwears' },
    { name: 'Knitwears & Fleeces', path: '/listing?category=knitwears-fleeces' },
    { name: 'Bottoms',           path: '/listing?category=bottoms' },
    { name: 'Dresses & Suits',   path: '/listing?category=dresses-suits' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Top Row: Logo, Search, Auth */}
        <div className="flex h-16 items-center justify-between gap-8 py-10">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-3xl font-black italic tracking-tighter text-black select-none">CLOVET</span>
          </Link>

          {/* Search Bar — disembunyikan di halaman dashboard */}
          {!isDashboard && (
            <div className="flex-1 max-w-4xl relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Type any products here"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-[#F5F5F5] border-none rounded-lg py-3.5 pl-14 pr-4 text-sm focus:ring-1 focus:ring-black transition-all outline-none placeholder:text-gray-400 placeholder:font-medium"
              />
            </div>
          )}

          {/* Auth & Cart */}
          <div className="flex items-center space-x-6 text-sm font-semibold">
            {user ? (
              <Link
                to="/profile"
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg hover:scale-105 transition-transform bg-gray-100 flex items-center justify-center"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-gray-400" />
                )}
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-black hover:opacity-70 transition-opacity">Login</Link>
                <Link to="/register" className="text-black hover:opacity-70 transition-opacity">Register</Link>
              </>
            )}

            {!isDashboard && (
              <>
                <div className="h-5 w-[1px] bg-gray-200 mx-1" />
                <Link to="/cart" className="relative p-1.5 text-black hover:bg-gray-50 rounded-full transition-all">
                  <ShoppingBag size={20} />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white translate-x-1 -translate-y-1">
                      {cart.length}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom Row: Categories */}
        {!isDashboard && (
          <div className="flex justify-center items-center pb-4">
            <nav className="flex space-x-8">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.path}
                  className="text-gray-500 hover:text-black text-[13px] font-medium transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
