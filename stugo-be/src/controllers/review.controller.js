import Review from '../models/review.model.js';
import Service from '../models/service.model.js';
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';

// Get reviews for a service
export const getServiceReviews = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const reviews = await Review.find({
            serviceId,
            status: 'active'
        })
            .populate('userId', 'name avatar')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await Review.countDocuments({ serviceId, status: 'active' });

        // Format response
        const formattedReviews = reviews.map(review => ({
            id: review._id,
            userId: review.userId._id,
            userName: review.userId.name,
            userAvatar: review.userId.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId.name)}&background=0ea5e9&color=fff`,
            serviceId: review.serviceId,
            rating: review.rating,
            comment: review.comment,
            images: review.images || [],
            isVerified: review.isVerified,
            reply: review.reply,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt
        }));

        res.json({
            success: true,
            data: formattedReviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get service reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải đánh giá'
        });
    }
};

// Create a review
export const createReview = async (req, res) => {
    try {
        const { serviceId, bookingId, rating, comment, images } = req.body;
        const userId = req.user._id || req.user.id;

        console.log('Create review request:', { serviceId, rating, comment, userId });

        // Validate required fields
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: 'serviceId là bắt buộc'
            });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá là bắt buộc'
            });
        }

        if (comment.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá phải có tối thiểu 10 ký tự'
            });
        }

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá phải từ 1 đến 5 sao'
            });
        }

        // Check if service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ'
            });
        }

        // Check if user already reviewed this service
        const existingReview = await Review.findOne({
            userId,
            serviceId,
            status: { $ne: 'deleted' }
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá dịch vụ này rồi'
            });
        }

        // Check if booking exists and belongs to user (if bookingId provided)
        let isVerified = false;
        if (bookingId) {
            const booking = await Booking.findOne({
                _id: bookingId,
                userId,
                serviceId,
                status: 'completed'
            });

            if (!booking) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn chỉ có thể đánh giá sau khi hoàn thành đặt chỗ'
                });
            }

            isVerified = true;
        }

        // Create review
        const review = await Review.create({
            userId,
            serviceId,
            bookingId: bookingId || undefined,
            rating,
            comment,
            images: images || [],
            isVerified,
            status: 'active'
        });

        // Update service rating
        await updateServiceRating(serviceId);

        // Populate user info
        await review.populate('userId', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Đánh giá thành công',
            data: {
                id: review._id,
                userId: review.userId._id,
                userName: review.userId.name,
                userAvatar: review.userId.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId.name)}&background=0ea5e9&color=fff`,
                serviceId: review.serviceId,
                rating: review.rating,
                comment: review.comment,
                images: review.images,
                isVerified: review.isVerified,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt
            }
        });
    } catch (error) {
        console.error('Create review error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update service rating
const updateServiceRating = async (serviceId) => {
    try {
        const reviews = await Review.find({ serviceId, status: 'active' });

        if (reviews.length === 0) {
            await Service.findByIdAndUpdate(serviceId, {
                rating: 0,
                reviewCount: 0
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / reviews.length;

        await Service.findByIdAndUpdate(serviceId, {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length
        });
    } catch (error) {
        console.error('Update service rating error:', error);
    }
};

// Update a review
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, images } = req.body;
        const userId = req.user._id || req.user.id;

        const review = await Review.findOne({ _id: id, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        // Update fields
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (images !== undefined) review.images = images;

        await review.save();

        // Update service rating
        await updateServiceRating(review.serviceId);

        await review.populate('userId', 'name avatar');

        res.json({
            success: true,
            message: 'Cập nhật đánh giá thành công',
            data: review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật đánh giá'
        });
    }
};

// Delete a review
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;

        const review = await Review.findOne({ _id: id, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        review.status = 'deleted';
        await review.save();

        // Update service rating
        await updateServiceRating(review.serviceId);

        res.json({
            success: true,
            message: 'Xóa đánh giá thành công'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa đánh giá'
        });
    }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find({ userId, status: 'active' })
            .populate('serviceId', 'name type images')
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await Review.countDocuments({ userId, status: 'active' });

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải đánh giá'
        });
    }
};
