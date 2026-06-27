import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, Eye, Users, Home as HomeIcon, Route as RouteIcon, Crown } from 'lucide-react';
import type { Service, Transport, Accommodation } from '../../types';

interface ServiceCardProps {
    service: Service;
    onFavorite?: (id: string) => void;
    isFavorite?: boolean;
}

const ServiceCard = ({ service, onFavorite, isFavorite = false }: ServiceCardProps) => {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'transport':
                return 'Nhà xe';
            case 'accommodation':
                return 'Nhà trọ';
            case 'restaurant':
                return 'Quán ăn';
            case 'carpool':
                return 'Xe ghép';
            default:
                return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'transport':
                return 'bg-blue-100 text-blue-700';
            case 'accommodation':
                return 'bg-purple-100 text-purple-700';
            case 'restaurant':
                return 'bg-orange-100 text-orange-700';
            case 'carpool':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Get available slots info
    const getAvailableSlots = () => {
        if (service.type === 'transport') {
            const transport = service as Transport;
            return {
                icon: Users,
                text: `${transport.seats} chỗ`,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50'
            };
        } else if (service.type === 'accommodation') {
            const accommodation = service as Accommodation;
            const totalAvailable = accommodation.roomTypes?.reduce((sum, room) => sum + room.available, 0) || 0;
            return {
                icon: HomeIcon,
                text: `${totalAvailable} phòng trống`,
                color: 'text-purple-600',
                bgColor: 'bg-purple-50'
            };
        }
        return null;
    };

    // Get fallback image per service type
    const getFallbackImage = (type: string) => {
        switch (type) {
            case 'transport':
                return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop';
            case 'accommodation':
                return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop';
            case 'restaurant':
                return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop';
            case 'carpool':
                return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop';
            default:
                return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&auto=format&fit=crop';
        }
    };

    const renderPrice = () => {
        const { min, max } = service.priceRange;
        if (service.type === 'transport') {
            if (min === max) {
                return (
                    <div className="flex flex-col justify-center min-w-0">
                        <p className="text-[15px] sm:text-base font-bold text-primary-600 truncate">
                            {formatPrice(min)}
                        </p>
                    </div>
                );
            }
            return (
                <div className="flex flex-col justify-center min-w-0">
                    <p className="text-[15px] sm:text-base font-bold text-primary-600">
                        {formatPrice(min)} - {formatPrice(max)}
                    </p>
                </div>
            );
        }
        
        return (
            <div>
                <span className="text-sm text-gray-500">Từ</span>
                <p className="text-lg font-bold text-primary-600">
                    {formatPrice(min)}
                </p>
            </div>
        );
    };

    const availableSlots = getAvailableSlots();

    const renderRoutes = () => {
        if (service.type !== 'transport') return null;
        const transport = service as Transport;
        const routes = transport.routes || [];
        if (routes.length === 0) return null;

        const maxDisplay = 2;
        const displayRoutes = routes.slice(0, maxDisplay);
        const remaining = routes.length - maxDisplay;

        return (
            <div className="flex flex-col gap-1.5 mb-3">
                {displayRoutes.map((route, idx) => {
                    const name = typeof route === 'string' ? route : route.name;
                    return (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 text-gray-700 rounded-md text-[13px] border border-gray-100">
                            <RouteIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{name}</span>
                        </div>
                    );
                })}
                {remaining > 0 && (
                    <div className="flex items-center px-2.5 py-1 bg-gray-50 text-gray-500 rounded-md text-xs border border-gray-100 w-fit">
                        +{remaining} tuyến khác
                    </div>
                )}
            </div>
        );
    };

    const renderCarpoolRoutes = () => {
        if (service.type !== 'carpool') return null;
        const carpoolOpts = (service as any).carpoolOptions;
        const routes = carpoolOpts?.routes || [];
        if (routes.length === 0) return null;

        const maxDisplay = 2;
        const displayRoutes = routes.slice(0, maxDisplay);
        const remaining = routes.length - maxDisplay;

        return (
            <div className="flex flex-col gap-1.5 mb-3">
                {displayRoutes.map((route: any, idx: number) => {
                    return (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 text-gray-700 rounded-md text-[13px] border border-gray-100">
                            <RouteIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{route.name}</span>
                        </div>
                    );
                })}
                {remaining > 0 && (
                    <div className="flex items-center px-2.5 py-1 bg-gray-50 text-gray-500 rounded-md text-xs border border-gray-100 w-fit">
                        +{remaining} tuyến khác
                    </div>
                )}
            </div>
        );
    };

    return (
        <Link to={`/service/${service.id}`} className="card group overflow-hidden flex flex-col h-full block">
            {/* Image */}
            <div className="relative h-48 overflow-hidden shrink-0">
                <img
                    src={service.images?.[0] || getFallbackImage(service.type)}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackImage(service.type);
                    }}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Type Badge & Premium Badge */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className={`badge ${getTypeColor(service.type)}`}>
                        {getTypeLabel(service.type)}
                    </span>
                    {service.isPremiumPartner && (
                        <span className="badge bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-none shadow-lg shadow-yellow-500/30 flex items-center gap-1.5 px-2.5 py-1 font-semibold z-10 animate-pulse-slow">
                            <Crown className="w-3.5 h-3.5 text-yellow-100" />
                            Đối tác nổi bật
                        </span>
                    )}
                </div>

                {/* Favorite Button */}
                {onFavorite && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFavorite(service.id);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${isFavorite
                            ? 'bg-red-500 text-white'
                            : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                )}

                {/* Availability */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span
                        className={`badge ${service.isAvailable ? 'badge-success' : 'badge-danger'
                            }`}
                    >
                        {service.isAvailable ? 'Còn chỗ' : 'Hết chỗ'}
                    </span>
                    <span className="badge bg-white/90 text-gray-700">
                        <Eye className="w-3 h-3 mr-1" />
                        {service.bookingCount || 0} lượt đặt
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                {/* Title & Rating */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {service.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium text-gray-700">{service.rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-sm">({service.reviewCount})</span>
                    </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{service.address}</span>
                </div>

                {/* Open Hours */}
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{service.openTime} - {service.closeTime}</span>
                </div>

                {renderRoutes()}
                {renderCarpoolRoutes()}

                {/* Available Slots - Only for transport and accommodation */}
                {availableSlots && (
                    <div className={`flex items-center gap-2 text-sm mb-4 px-3 py-2 rounded-lg ${availableSlots.bgColor}`}>
                        <availableSlots.icon className={`w-4 h-4 flex-shrink-0 ${availableSlots.color}`} />
                        <span className={`font-medium ${availableSlots.color}`}>
                            {availableSlots.text}
                        </span>
                    </div>
                )}

                {/* Price & Action */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
                    {renderPrice()}
                    <span
                        className="btn-primary py-2 px-4 text-sm flex-shrink-0 text-center cursor-pointer"
                    >
                        Xem chi tiết
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ServiceCard;
