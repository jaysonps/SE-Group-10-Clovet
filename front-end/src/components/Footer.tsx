import React from 'react';
import { Instagram, Twitter, Facebook, Youtube, ShieldCheck, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white pt-16 pb-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 border-b border-white/10 pb-12">
          {/* Brand Info */}
          <div className="space-y-8">
            <Link to="/" className="text-3xl font-bold italic tracking-tighter font-display text-white block mb-2">CLOVET</Link>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white/70">
                <ShieldCheck size={20} className="text-brand-soft" />
                <span className="text-sm">200% Money Back Guarantee</span>
              </div>
              <div className="flex items-center space-x-3 text-white/70">
                <Award size={20} className="text-brand-soft" />
                <span className="text-sm">Authentic. Guaranteed.</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">FAQ</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link to="/faq" className="hover:text-white transition-colors">Terms and Conditions</Link></li>
              <li><Link to="/buying-guide" className="hover:text-white transition-colors">Buying & Selling Guide</Link></li>
            </ul>
          </div>

          {/* Social Social */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Connect with us!</h4>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand transition-colors">
                <Youtube size={20} />
              </a>
            </div>
            <div className="mt-8">
              <p className="text-sm text-white/60 mb-4 font-medium uppercase tracking-widest">Explore us more on Instagram!</p>
              <Link to="/" className="inline-flex items-center space-x-2 text-brand-soft hover:underline">
                <Instagram size={18} />
                <span>Clovet</span>
              </Link>
            </div>
          </div>

          {/* Download App */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Download Our App</h4>
            <div className="space-y-4">
              <a href="#" className="block w-40">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="w-full" />
              </a>
              <a href="#" className="block w-40">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="w-full" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/40 uppercase tracking-widest gap-4 text-center">
          <p>REGISTERED UNDER GROUP 10</p>
          <p>&copy; 2026 CLOVET MARKETPLACE. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}
