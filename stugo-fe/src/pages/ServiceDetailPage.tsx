import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Star,
    MapPin,
    Clock,
    Phone,
    Share2,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Calendar,
    Users,
    Check,
    Navigation,
    Route as RouteIcon,
} from 'lucide-react';
import type { Service, Transport } from '../types';
import { getServiceById } from '../services';
import type { Review } from '../services/review.service';
import { getServiceReviews } from '../services/review.service';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import BookingModal from '../components/booking/BookingModal';
import WriteReviewModal from '../components/review/WriteReviewModal';
import OpenStreetMap from '../components/ui/OpenStreetMap';
import ContactModal from '../components/ui/ContactModal';
import toast from 'react-hot-toast';

const ServiceDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useAuthStore();
    const [service, setService] = useState<Service | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [reviewPage, setReviewPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(true);

    // Calculate star distribution from reviews
    const starDistribution = reviews.reduce(
        (acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
    );

    const totalReviews = reviews.length || 1; // Avoid division by zero

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const serviceData = await getServiceById(id);

                if (serviceData) {
                    setService(serviceData);
                    setCurrentImageIndex(0);
                    await fetchReviews(id, 1);
                } else {
                    setService(null);
                    setError('Không tìm thấy dịch vụ');
                }
            } catch (err) {
                console.error('Error fetching service detail:', err);
                setError('Không thể tải thông tin dịch vụ');
                setService(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const fetchReviews = async (serviceId: string, page: number) => {
        try {
            setReviewsLoading(true);
            const result = await getServiceReviews(serviceId, page, 10);

            if (result.success && result.data) {
                if (page === 1) {
                    setReviews(result.data);
                } else {
                    setReviews((prev) => [...prev, ...result.data]);
                }

                setHasMoreReviews(result.pagination.page < result.pagination.pages);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleLoadMoreReviews = () => {
        if (id && !reviewsLoading && hasMoreReviews) {
            const nextPage = reviewPage + 1;
            setReviewPage(nextPage);
            fetchReviews(id, nextPage);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
                toast.success('Đã copy đường dẫn vào clipboard!');
            } else {
                // Fallback for older browsers or non-HTTPS
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    toast.success('Đã copy đường dẫn vào clipboard!');
                } catch (err) {
                    toast.error('Không thể copy đường dẫn');
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            toast.error('Không thể copy đường dẫn');
        }
    };

    const handleWriteReview = () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để viết đánh giá');
            return;
        }
        setShowWriteReviewModal(true);
    };

    const handleReviewSuccess = () => {
        if (id) {
            setReviewPage(1);
            fetchReviews(id, 1);

            getServiceById(id).then((data) => {
                if (data) setService(data);
            });
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const nextImage = () => {
        if (service) {
            setCurrentImageIndex((prev) =>
                prev === service.images.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevImage = () => {
        if (service) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? service.images.length - 1 : prev - 1
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <LoadingSpinner size="lg" text="Đang tải thông tin..." />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {error || 'Không tìm thấy dịch vụ'}
                    </h2>
                    <Link to="/services" className="btn-primary">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-16 bg-gray-50">
            {/* Image Gallery */}
            <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
                <img
                    src={service.images[currentImageIndex]}
                    alt={service.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

                {service.images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    </>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {service.images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentImageIndex
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/80'
                                }`}
                        />
                    ))}
                </div>

                <div className="absolute top-6 right-6 flex items-center gap-3">
                    <button
                        onClick={handleShare}
                        className="p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
                        title="Chia sẻ"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute top-6 left-6">
                    <Link
                        to="/services"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Quay lại
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-8">
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                                        {service.type === 'transport' && 'Nhà xe'}
                                        {service.type === 'accommodation' && 'Chỗ ở'}
                                        {service.type === 'restaurant' && 'Nhà hàng'}
                                    </span>
                                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 mb-2">
                                        {service.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                            <span className="font-semibold">{service.rating}</span>
                                            <span className="text-gray-400">
                                                ({service.reviewCount} đánh giá)
                                            </span>
                                        </div>
                                        <span className="text-gray-300">|</span>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-5 h-5 text-gray-400" />
                                            <span>{service.bookingCount || 0} lượt đặt</span>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className={`badge ${service.isAvailable ? 'badge-success' : 'badge-danger'
                                        }`}
                                >
                                    {service.isAvailable ? 'Còn chỗ' : 'Hết chỗ'}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Địa chỉ</p>
                                        <p className="font-medium text-gray-900">{service.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-secondary-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Giờ hoạt động</p>
                                        <p className="font-medium text-gray-900">
                                            {service.openTime} - {service.closeTime}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">Mô tả</h2>
                                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {service.description}
                                </div>
                            </div>

                            {service.type === 'transport' && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <RouteIcon className="w-5 h-5 text-primary-600" />
                                        Tuyến đường
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {(service as Transport).routes?.map((route, idx) => {
                                            const name = typeof route === 'string' ? route : route.name;
                                            const price = typeof route === 'string' ? service.priceRange?.min || 0 : route.price;
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <span className="font-medium text-gray-900 line-clamp-1 flex-1 mr-2">{name}</span>
                                                    <span className="text-primary-600 font-semibold shrink-0">{formatPrice(price)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="card p-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vị trí</h2>
                            <div className="h-96 bg-gray-200 rounded-xl overflow-hidden">
                                <OpenStreetMap
                                    latitude={service.latitude}
                                    longitude={service.longitude}
                                    title={service.name}
                                    address={service.address}
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-primary-600" />
                                    <div>
                                        <p className="text-sm text-gray-500">Địa chỉ chi tiết</p>
                                        <p className="font-medium text-gray-900">{service.address}</p>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                >
                                    <Navigation className="w-4 h-4" />
                                    Chỉ đường
                                </a>
                            </div>
                        </div>

                        <div className="card p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Đánh giá ({service.reviewCount || reviews.length})
                                </h2>
                                <button
                                    onClick={handleWriteReview}
                                    className="btn-outline py-2 px-4 text-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Viết đánh giá
                                </button>
                            </div>

                            <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl mb-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-gray-900">{service.rating}</p>
                                    <div className="flex items-center justify-center gap-0.5 my-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= Math.floor(service.rating)
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500">{service.reviewCount} đánh giá</p>
                                </div>
                                {reviews.length > 0 && (
                                    <div className="flex-1 space-y-2">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = starDistribution[star] || 0;
                                            const percentage = (count / totalReviews) * 100;
                                            return (
                                                <div key={star} className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600 w-4">{star}</span>
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-8 text-right">
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">Chưa có đánh giá nào</p>
                                        <button onClick={handleWriteReview} className="btn-primary mt-4">
                                            Viết đánh giá đầu tiên
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {reviews.map((review) => (
                                            <div
                                                key={review.id}
                                                className="pb-6 border-b border-gray-100 last:border-0 last:pb-0"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <img
                                                        src={review.userAvatar}
                                                        alt={review.userName}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold text-gray-900">
                                                                        {review.userName}
                                                                    </p>
                                                                    {review.isVerified && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                                            <Check className="w-3 h-3" />
                                                                            Đã xác thực
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500">
                                                                    {formatDate(review.createdAt)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star
                                                                        key={star}
                                                                        className={`w-4 h-4 ${star <= review.rating
                                                                            ? 'text-yellow-400 fill-current'
                                                                            : 'text-gray-300'
                                                                            }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-600">{review.comment}</p>

                                                        {review.images && review.images.length > 0 && (
                                                            <div className="flex gap-2 mt-3">
                                                                {review.images.map((img, idx) => (
                                                                    <img
                                                                        key={idx}
                                                                        src={img}
                                                                        alt={`Review ${idx + 1}`}
                                                                        className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {review.reply && (
                                                            <div className="mt-3 bg-gray-50 rounded-lg p-4">
                                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                                    Phản hồi từ chủ dịch vụ
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {review.reply.content}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-2">
                                                                    {formatDate(review.reply.repliedAt)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {reviews.length > 0 && hasMoreReviews && (
                                <button
                                    onClick={handleLoadMoreReviews}
                                    disabled={reviewsLoading}
                                    className="w-full btn-ghost mt-6"
                                >
                                    {reviewsLoading ? 'Đang tải...' : 'Xem thêm đánh giá'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="card p-6">
                                <div className="mb-6">
                                    {service.type === 'transport' ? (
                                        <>
                                            <p className="text-gray-500 text-sm mb-1">
                                                Giá vé
                                            </p>
                                            <p className="text-2xl lg:text-3xl font-bold text-primary-600">
                                                {service.priceRange.min === service.priceRange.max 
                                                    ? formatPrice(service.priceRange.min) 
                                                    : `${formatPrice(service.priceRange.min)} - ${formatPrice(service.priceRange.max)}`}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-500 text-sm mb-1">Giá từ</p>
                                            <p className="text-3xl font-bold text-primary-600">
                                                {formatPrice(service.priceRange.min)}
                                            </p>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="w-full btn-primary text-lg py-4 mb-4"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Đặt chỗ ngay
                                </button>

                                <button
                                    onClick={() => setShowContactModal(true)}
                                    className="w-full btn-outline py-3 mb-6"
                                >
                                    <Phone className="w-5 h-5" />
                                    Liên hệ
                                </button>

                                <div className="space-y-3 pt-6 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-4">Tiện ích</h3>
                                    {['Wifi miễn phí', 'Điều hòa', 'Nước uống miễn phí', 'Bảo hiểm hành khách', 'Đón tận nơi'].map(
                                        (feature, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-green-500" />
                                                <span className="text-gray-600">{feature}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBookingModal && (
                <BookingModal service={service} onClose={() => setShowBookingModal(false)} />
            )}

            {showWriteReviewModal && service && (
                <WriteReviewModal
                    serviceId={service.id}
                    serviceName={service.name}
                    onClose={() => setShowWriteReviewModal(false)}
                    onSuccess={handleReviewSuccess}
                />
            )}

            {showContactModal && service && (
                <ContactModal
                    isOpen={showContactModal}
                    onClose={() => setShowContactModal(false)}
                    serviceName={service.name}
                    serviceType={service.type}
                    phone={service.owner?.phone}
                    email={service.owner?.email}
                />
            )}

            <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} size="xl">
                <div className="relative">
                    <img
                        src={service.images[currentImageIndex]}
                        alt={service.name}
                        className="w-full h-auto rounded-lg"
                    />
                    <div className="flex justify-center gap-2 mt-4">
                        {service.images.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                    ? 'border-primary-500'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img
                                    src={img}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ServiceDetailPage;
