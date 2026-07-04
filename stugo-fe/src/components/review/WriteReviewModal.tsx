import { useState } from 'react';
import { X, Star, Upload } from 'lucide-react';
import { createReview } from '../../services/review.service';
import type { CreateReviewData } from '../../services/review.service';
import toast from 'react-hot-toast';

interface WriteReviewModalProps {
    serviceId: string;
    serviceName: string;
    bookingId?: string;
    isCombo?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const WriteReviewModal = ({
    serviceId,
    serviceName,
    bookingId,
    isCombo,
    onClose,
    onSuccess,
}: WriteReviewModalProps) => {
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!comment.trim()) {
            toast.error('Vui lòng nhập nội dung đánh giá');
            return;
        }

        if (comment.trim().length < 10) {
            toast.error('Nội dung đánh giá phải có tối thiểu 10 ký tự');
            return;
        }

        if (comment.length > 1000) {
            toast.error('Nội dung đánh giá không được quá 1000 ký tự');
            return;
        }

        try {
            setLoading(true);

            const data: CreateReviewData = {
                targetId: serviceId,
                targetType: isCombo ? 'Combo' : 'Service',
                rating,
                comment: comment.trim(),
                images: images.length > 0 ? images : undefined,
            };

            if (bookingId) {
                data.bookingId = bookingId;
            }

            const response = await createReview(data);

            console.log('Review response:', response);

            toast.success('Đánh giá thành công!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Create review error:', error);
            console.error('Error response:', error.response?.data);

            let errorMessage = 'Không thể gửi đánh giá';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error?.includes('duplicate key')) {
                errorMessage = 'Bạn đã đánh giá dịch vụ này rồi';
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (images.length + files.length > 5) {
            toast.error('Chỉ được tải lên tối đa 5 ảnh');
            return;
        }

        setUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`File ${file.name} quá lớn (tối đa 5MB)`);
                    return null;
                }

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    toast.error(`File ${file.name} không phải là ảnh`);
                    return null;
                }

                // Convert to base64 for preview (in production, upload to cloud storage)
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const validImages = uploadedImages.filter((img): img is string => img !== null);

            setImages((prev) => [...prev, ...validImages]);
            toast.success(`Đã tải lên ${validImages.length} ảnh`);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Không thể tải ảnh lên');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const ratingLabels = [
        'Rất tệ',
        'Tệ',
        'Bình thường',
        'Tốt',
        'Rất tốt',
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Viết đánh giá</h2>
                            <p className="text-sm text-gray-500 mt-1">{serviceName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Đánh giá của bạn
                            </label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 ${star <= (hoveredRating || rating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                {ratingLabels[rating - 1]}
                            </p>
                        </div>

                        {/* Comment */}
                        <div>
                            <label
                                htmlFor="comment"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Nhận xét của bạn <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..."
                                rows={6}
                                maxLength={1000}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${comment.length > 0 && comment.length < 10
                                    ? 'border-red-300'
                                    : 'border-gray-300'
                                    }`}
                                required
                            />
                            <div className="flex justify-between items-center mt-2">
                                {comment.length > 0 && comment.length < 10 ? (
                                    <p className="text-xs text-red-500">
                                        Cần tối thiểu 10 ký tự (còn {10 - comment.length} ký tự)
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500">Tối thiểu 10 ký tự</p>
                                )}
                                <p className="text-xs text-gray-500">{comment.length}/1000</p>
                            </div>
                        </div>

                        {/* Images Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hình ảnh (tùy chọn)
                            </label>
                            <div className="space-y-3">
                                <label
                                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading
                                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                        : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        disabled={uploading || images.length >= 5}
                                        className="hidden"
                                    />
                                    {uploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm text-gray-600">Đang tải...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                Tải ảnh lên (tối đa 5 ảnh, mỗi ảnh 5MB)
                                            </span>
                                        </>
                                    )}
                                </label>

                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={img}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {images.length > 0 && (
                                    <p className="text-xs text-gray-500">{images.length}/5 ảnh</p>
                                )}
                            </div>
                        </div>

                        {bookingId && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-700">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-sm font-medium">
                                        Đánh giá đã xác thực
                                    </span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                    Bạn đã sử dụng dịch vụ này
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 flex-shrink-0">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary flex-1"
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary flex-1"
                                disabled={loading || uploading || !comment.trim() || comment.length < 10}
                            >
                                {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WriteReviewModal;
