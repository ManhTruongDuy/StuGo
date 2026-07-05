import { Link } from 'react-router-dom';
import { Star, MapPin, Car, BedDouble, BadgePercent } from 'lucide-react';
import type { Combo } from '../../services/combo.service';

interface ComboCardProps {
  combo: Combo;
}

const ComboCard = ({ combo }: ComboCardProps) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600';
  const coverImage = combo.thumbnail || (combo.images && combo.images.length > 0 ? combo.images[0] : fallbackImage);
  const lowestPrice = Math.min(
    combo.pricing?.servedPrice || Infinity,
    combo.pricing?.unservedPrice || Infinity,
    combo.pricing?.privateRentalPrice || Infinity
  );

  return (
    <Link to={`/combos/${combo._id || combo.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full transform hover:-translate-y-1">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={coverImage}
            alt={combo.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Hot Deal Badge */}
          <div className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <BadgePercent className="w-4 h-4 text-rose-500" />
            <span className="text-[13px] font-bold text-rose-500">Hot Deal</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-[15px] leading-snug font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {combo.name}
          </h3>

          {/* Stars */}
          <div className="flex items-center gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (combo.rating || 5)
                    ? 'text-[#ffc107] fill-[#ffc107]'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Features */}
          <div className="space-y-2 mb-4 flex-grow">
            <div className="grid grid-cols-2 gap-2 text-[13px] text-gray-600">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <span className="truncate">{combo.destination}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Car className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <span className="truncate">{combo.transportType || 'Xe'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-600 truncate">
              <BedDouble className="w-4 h-4 flex-shrink-0 text-gray-500" />
              <span className="truncate">{combo.accommodationName || 'Khách sạn'}</span>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Giá từ:</p>
              <p className="text-lg font-bold text-[#0056b3]">
                {lowestPrice !== Infinity ? lowestPrice.toLocaleString('vi-VN') : 0}đ
              </p>
            </div>
            <div className="bg-[#ffc107] hover:bg-yellow-500 text-gray-900 text-[13px] font-medium px-4 py-1.5 rounded-full transition-colors">
              Xem chi tiết
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ComboCard;
