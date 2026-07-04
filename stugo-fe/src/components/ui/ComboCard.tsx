import { Link } from 'react-router-dom';
import { Package, Star, ArrowRight } from 'lucide-react';
import type { Combo } from '../../services/combo.service';

interface ComboCardProps {
  combo: Combo;
}

const ComboCard = ({ combo }: ComboCardProps) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600';
  const coverImage = combo.images && combo.images.length > 0 ? combo.images[0] : fallbackImage;
  const lowestPrice = Math.min(
    combo.pricing?.servedPrice || Infinity,
    combo.pricing?.unservedPrice || Infinity,
    combo.pricing?.privateRentalPrice || Infinity
  );

  return (
    <Link to={`/combos/${combo._id || combo.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full transform hover:-translate-y-1">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={coverImage}
            alt={combo.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Package className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-900">Combo Trọn Gói</span>
          </div>
          {combo.rating && combo.rating > 0 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-bold text-gray-900">{combo.rating}</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {combo.name}
          </h3>

          <div className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
            {combo.description}
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Giá chỉ từ</p>
              <p className="text-lg font-bold text-primary-600">
                {lowestPrice !== Infinity ? lowestPrice.toLocaleString('vi-VN') : 0}đ
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-500 transition-colors">
              <ArrowRight className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ComboCard;
