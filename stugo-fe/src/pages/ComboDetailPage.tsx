import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Star,
    Share2,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Calendar,
    Check,
    Package,
    MapPin,
    Clock,
    Car,
    BedDouble,
    XCircle,
    FileText
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import ComboBookingModal from '../components/booking/ComboBookingModal';
import WriteReviewModal from '../components/review/WriteReviewModal';
import toast from 'react-hot-toast';
import { getComboById, type Combo } from '../services/combo.service';
import type { Review } from '../services/review.service';
import { getTargetReviews } from '../services/review.service';

const ComboDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useAuthStore();
    const [combo, setCombo] = useState<Combo | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
    const [reviewPage, setReviewPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(true);

    const starDistribution = reviews.reduce(
        (acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
    );
    const totalReviews = reviews.length || 1;

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const comboData = await getComboById(id);

                if (comboData && comboData.data) {
                    setCombo(comboData.data);
                    setCurrentImageIndex(0);
                    await fetchReviews(id, 1);
                } else {
                    setCombo(null);
                    setError('Không tìm thấy Combo');
                }
            } catch (err) {
                console.error('Error fetching combo detail:', err);
                setError('Không thể tải thông tin Combo');
                setCombo(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const fetchReviews = async (comboId: string, page: number) => {
        try {
            setReviewsLoading(true);
            const result = await getTargetReviews(comboId, 'Combo', page, 10);

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
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    toast.success('Đã copy đường dẫn vào clipboard!');
                } catch {
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
            getComboById(id).then((data) => {
                if (data && data.data) setCombo(data.data);
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const nextImage = () => {
        if (combo && combo.images) {
            setCurrentImageIndex((prev) =>
                prev === combo.images.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevImage = () => {
        if (combo && combo.images) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? combo.images.length - 1 : prev - 1
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <LoadingSpinner size="lg" text="Đang tải thông tin Combo..." />
            </div>
        );
    }

    if (!combo) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {error || 'Không tìm thấy Combo'}
                    </h2>
                    <Link to="/combos" className="btn-primary">
                        Quay lại danh sách Combo
                    </Link>
                </div>
            </div>
        );
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200';
    const allImages = [combo.thumbnail, ...(combo.images || [])].filter(Boolean);
    const images = allImages.length > 0 ? allImages : [fallbackImage];

    return (
        <div className="min-h-screen pt-20 pb-16 bg-gray-50">
            {/* Image Gallery */}
            <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
                <img
                    src={images[currentImageIndex]}
                    alt={combo.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

                {images.length > 1 && (
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
                        to="/combos"
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
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-3">
                                        <Package className="w-4 h-4" />
                                        Combo Trọn Gói
                                    </span>
                                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 mb-2">
                                        {combo.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                            <span className="font-semibold">{combo.rating || 0}</span>
                                            <span className="text-gray-400">
                                                ({combo.reviewCount || 0} đánh giá)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Điểm đến</p>
                                        <p className="font-medium text-gray-900">{combo.destination}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Thời gian</p>
                                        <p className="font-medium text-gray-900">{combo.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Car className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Phương tiện</p>
                                        <p className="font-medium text-gray-900">{combo.transportType || 'Xe'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <BedDouble className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Khách sạn</p>
                                        <p className="font-medium text-gray-900">{combo.accommodationName || 'Không có'}</p>
                                    </div>
                                </div>
                            </div>

                            {combo.includes && combo.includes.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Combo bao gồm</h2>
                                    <ul className="space-y-3">
                                        {combo.includes.map((item, index) => (
                                            <li key={index} className="flex items-start gap-3 text-gray-700">
                                                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {combo.excludes && combo.excludes.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Combo không bao gồm</h2>
                                    <ul className="space-y-3">
                                        {combo.excludes.map((item, index) => (
                                            <li key={index} className="flex items-start gap-3 text-gray-700">
                                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {combo.linkedServices && combo.linkedServices.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Các dịch vụ liên kết</h2>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {combo.linkedServices.map((ls, index) => {
                                            const sData = typeof ls.serviceId === 'object' ? ls.serviceId : null;
                                            return (
                                                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-primary-600" />
                                                        {sData ? sData.name : 'Dịch vụ liên kết'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {combo.termsAndConditions && combo.termsAndConditions.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-gray-500" />
                                        Điều khoản và Quy định
                                    </h2>
                                    <div className="bg-orange-50 rounded-xl p-5 text-orange-900 space-y-2">
                                        <ul className="list-disc pl-5 space-y-1">
                                            {combo.termsAndConditions.map((term, index) => (
                                                <li key={index} className="text-sm leading-relaxed">{term}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="card p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Đánh giá ({combo.reviewCount || reviews.length})
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
                                    <p className="text-4xl font-bold text-gray-900">{combo.rating || 0}</p>
                                    <div className="flex items-center justify-center gap-0.5 my-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= Math.floor(combo.rating || 0)
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500">{combo.reviewCount || 0} đánh giá</p>
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
                                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Bảng giá</h3>
                                <div className="space-y-4 mb-6">
                                    {combo.pricing.servedPrice > 0 && (
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                            <span className="text-gray-700">Có phục vụ</span>
                                            <span className="font-bold text-primary-600">{combo.pricing.servedPrice.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    {combo.pricing.unservedPrice > 0 && (
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                            <span className="text-gray-700">Không phục vụ</span>
                                            <span className="font-bold text-primary-600">{combo.pricing.unservedPrice.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    {combo.pricing.privateRentalPrice > 0 && (
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                            <span className="text-gray-700">Thuê nguyên chuyến</span>
                                            <span className="font-bold text-primary-600">{combo.pricing.privateRentalPrice.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="w-full btn-primary text-lg py-4 mb-4"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Đặt Combo ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBookingModal && combo && (
                <ComboBookingModal combo={combo} onClose={() => setShowBookingModal(false)} />
            )}

            {showWriteReviewModal && combo && (
                <WriteReviewModal
                    serviceId={combo.id || combo._id || ''}
                    serviceName={combo.name}
                    isCombo={true}
                    onClose={() => setShowWriteReviewModal(false)}
                    onSuccess={handleReviewSuccess}
                />
            )}

            <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} size="xl">
                <div className="relative">
                    <img
                        src={images[currentImageIndex]}
                        alt={combo.name}
                        className="w-full h-auto rounded-lg"
                    />
                    <div className="flex justify-center gap-2 mt-4 overflow-x-auto">
                        {images.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
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

export default ComboDetailPage;
