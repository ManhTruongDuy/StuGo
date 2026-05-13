import { XCircle, MapPin, Clock, Users, Star, CheckCircle, XCircleIcon, TrendingUp, Car, Home, Utensils, Navigation } from 'lucide-react';

interface ServiceViewModalProps {
    service: any;
    onClose: () => void;
    onEdit: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const ServiceViewModal = ({ service, onClose, onEdit }: ServiceViewModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
                            <p className="text-sm text-gray-500 mt-1 capitalize">{service.type}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XCircle className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Images */}
                    {service.images && service.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {service.images.slice(0, 3).map((img: string, idx: number) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`${service.name} ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg col-span-2">
                                <p className="text-xs text-gray-500 mb-1">Địa chỉ đầy đủ</p>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm font-medium text-gray-900">
                                        {service.address}
                                        {service.ward && `, ${service.ward}`}
                                        {service.district && `, ${service.district}`}
                                        {service.city && `, ${service.city}`}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Tọa độ</p>
                                <div className="flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-900">
                                        {service.latitude?.toFixed(6) || service.location?.coordinates?.[1]?.toFixed(6) || 0}, {service.longitude?.toFixed(6) || service.location?.coordinates?.[0]?.toFixed(6) || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Giờ hoạt động</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-900">
                                        {service.openTime} - {service.closeTime}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Khoảng giá</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {formatPrice(service.priceRange?.min || 0)} - {formatPrice(service.priceRange?.max || 0)}
                                </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Đánh giá</p>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <p className="text-sm font-medium text-gray-900">
                                        {service.rating?.toFixed(1) || '0.0'} ({service.reviewCount || 0} đánh giá)
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Độ phổ biến</p>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-900">{service.popularity || 0}</p>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Trạng thái hoạt động</p>
                                <div className="flex items-center gap-2">
                                    {service.isAvailable ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-600">Đang hoạt động</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircleIcon className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm font-medium text-gray-600">Tạm dừng</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Trạng thái duyệt</p>
                                <p className="text-sm font-medium">
                                    {service.status === 'active' && <span className="text-green-600">Đã duyệt</span>}
                                    {service.status === 'pending' && <span className="text-yellow-600">Chờ duyệt</span>}
                                    {service.status === 'rejected' && <span className="text-red-600">Bị từ chối</span>}
                                    {service.status === 'suspended' && <span className="text-gray-600">Bị tạm ngưng</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Mô tả</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{service.description}</p>
                        </div>
                    )}

                    {/* Transport specific */}
                    {service.type === 'transport' && (
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Car className="w-5 h-5 text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Thông tin phương tiện</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {service.vehicleType && (
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Loại xe</p>
                                        <p className="text-sm font-medium text-gray-900">{service.vehicleType}</p>
                                    </div>
                                )}
                                {service.seats && (
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Số chỗ ngồi</p>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-900">{service.seats} chỗ</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {service.routes && service.routes.length > 0 && (
                                <>
                                    <h4 className="font-medium text-gray-900 mb-3">Tuyến đường</h4>
                                    <div className="space-y-3">
                                        {service.routes.map((route: any, idx: number) => (
                                            <div key={idx} className="bg-white p-4 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900">{route.name || route}</p>
                                                    {route.duration && (
                                                        <p className="text-sm text-gray-500">{route.duration}</p>
                                                    )}
                                                </div>
                                                {route.price && (
                                                    <p className="text-lg font-bold text-primary-600">
                                                        {formatPrice(route.price)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {service.departureTime && service.departureTime.length > 0 && (
                                <>
                                    <h4 className="font-medium text-gray-900 mb-3 mt-4">Giờ khởi hành</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {service.departureTime.map((time: string, idx: number) => (
                                            <span key={idx} className="bg-white px-3 py-1.5 rounded-lg text-sm font-medium text-gray-900 border border-gray-200">
                                                {time}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Accommodation specific */}
                    {service.type === 'accommodation' && (
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Home className="w-5 h-5 text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Thông tin chỗ ở</h3>
                            </div>

                            {service.amenities && service.amenities.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Tiện nghi</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {service.amenities.map((amenity: string, idx: number) => (
                                            <span key={idx} className="bg-white px-3 py-1.5 rounded-lg text-sm text-gray-700 border border-gray-200">
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {service.rules && service.rules.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Nội quy</h4>
                                    <ul className="bg-white p-4 rounded-lg space-y-2">
                                        {service.rules.map((rule: string, idx: number) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-gray-400 mt-1">•</span>
                                                <span>{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {service.roomTypes && service.roomTypes.length > 0 && (
                                <>
                                    <h4 className="font-medium text-gray-900 mb-3">Loại phòng</h4>
                                    <div className="space-y-3">
                                        {service.roomTypes.map((room: any, idx: number) => (
                                            <div key={idx} className="bg-white p-4 rounded-lg">
                                                {room.images && room.images.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        {room.images.slice(0, 3).map((img: string, imgIdx: number) => (
                                                            <img
                                                                key={imgIdx}
                                                                src={img}
                                                                alt={`${room.name} ${imgIdx + 1}`}
                                                                className="w-full h-20 object-cover rounded-lg"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{room.name}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                            <Users className="w-4 h-4" />
                                                            <span>{room.capacity} người</span>
                                                            <span>•</span>
                                                            <span>{room.available} phòng trống</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-lg font-bold text-primary-600">
                                                        {formatPrice(room.price)}/đêm
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Restaurant specific */}
                    {service.type === 'restaurant' && (
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Utensils className="w-5 h-5 text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Thông tin nhà hàng</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {service.cuisine && service.cuisine.length > 0 && (
                                    <div className="bg-white p-3 rounded-lg col-span-2">
                                        <p className="text-xs text-gray-500 mb-2">Loại ẩm thực</p>
                                        <div className="flex flex-wrap gap-2">
                                            {service.cuisine.map((c: string, idx: number) => (
                                                <span key={idx} className="bg-gray-100 px-3 py-1 rounded-lg text-sm text-gray-700">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {service.hasDelivery !== undefined && (
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Giao hàng</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {service.hasDelivery ? (
                                                <span className="text-green-600">Có giao hàng</span>
                                            ) : (
                                                <span className="text-gray-600">Không giao hàng</span>
                                            )}
                                        </p>
                                    </div>
                                )}
                                {service.hasReservation !== undefined && (
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Đặt bàn</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {service.hasReservation ? (
                                                <span className="text-green-600">Có đặt bàn</span>
                                            ) : (
                                                <span className="text-gray-600">Không đặt bàn</span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {service.menuItems && service.menuItems.length > 0 && (
                                <>
                                    <h4 className="font-medium text-gray-900 mb-3">Thực đơn</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {service.menuItems.map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg">
                                                {item.image && (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-24 object-cover rounded-lg mb-2"
                                                    />
                                                )}
                                                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                                {item.category && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                                                )}
                                                {item.description && (
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                                )}
                                                <p className="text-sm font-bold text-primary-600 mt-2">
                                                    {formatPrice(item.price)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex-shrink-0">
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn bg-gray-500 flex-1">
                            Đóng
                        </button>
                        <button onClick={onEdit} className="btn btn-primary flex-1">
                            Chỉnh sửa 
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceViewModal;
