import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const MOCK_REVIEWS = [
  { id: 1, user: 'Damian Rice', rating: 5, date: '12 May 2026', comment: 'The material is top notch. Definitely worth the price. The fit is true to size and colors are as vibrant as shown in photos.', verified: true, likes: 24 },
  { id: 2, user: 'Sarah Jenkins', rating: 4, date: '10 May 2026', comment: 'Great quality, but the shipping took a bit longer than expected. Overall happy with the product.', verified: true, likes: 12 },
  { id: 3, user: 'Michael Chen', rating: 5, date: '05 May 2026', comment: 'Always a fan of Clovet products. This tee is my 5th purchase and it never disappoints.', verified: true, likes: 45 },
  { id: 4, user: 'Emma Watson', rating: 5, date: '02 May 2026', comment: 'Incredible quality, feels like high-end luxury brand. The olive green shade is perfect.', verified: true, likes: 8 },
  { id: 5, user: 'John Doe', rating: 3, date: '28 April 2026', comment: 'Decent quality but I expected it to be a bit thicker. Still good for summer weather.', verified: false, likes: 2 },
];

export default function ProductReviews() {
  const { id } = useParams();

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <Link to={`/product/${id}`} className="inline-flex items-center space-x-2 text-gray-400 hover:text-black transition-colors mb-12">
          <ChevronLeft size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Product</span>
        </Link>

        <div className="max-w-4xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 pb-12">
            <div className="space-y-4">
              <div className="sleek-label">Member Community</div>
              <h1 className="text-6xl font-display font-black leading-none tracking-tighter uppercase">Product Reviews</h1>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-5xl font-display font-black">4.8</p>
                <div className="flex space-x-1 mt-2">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-black text-black" />)}
                </div>
              </div>
              <div className="h-16 w-px bg-gray-100" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Reviews</p>
                <p className="text-xl font-black">1.2k Ratings</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {MOCK_REVIEWS.map((review, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={review.id} 
                className="sleek-card border-gray-100 p-10 space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                        <span className="font-black text-lg uppercase tracking-tight">{review.user}</span>
                        {review.verified && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">Verified Purchase</span>
                        )}
                    </div>
                    <div className="flex space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={cn(i < review.rating ? "fill-black text-black" : "fill-gray-100 text-gray-100")} 
                        />
                      ))}
                    </div>
                  </div>
                  <span className="sleek-label text-gray-300">{review.date}</span>
                </div>

                <p className="text-lg text-gray-600 leading-relaxed font-medium italic">"{review.comment}"</p>

                <div className="flex items-center space-x-6 pt-4 border-t border-gray-50">
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-black transition-colors group">
                    <ThumbsUp size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-xs font-bold">{review.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-black transition-colors">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold">Reply</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <button className="sleek-button-secondary px-12 text-xs font-black uppercase tracking-widest">Load More Reviews</button>
          </div>
        </div>
      </div>
    </div>
  );
}
