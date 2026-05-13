import { complaintRepository, serviceRepository } from '../repositories/index.js';

/**
 * Get complaints
 * GET /api/complaints
 */
export const getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority } = req.query;
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      populate: 'userId serviceId bookingId'
    };

    let result;

    if (req.userRole === 'admin') {
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      result = await complaintRepository.find(filter, {
        ...options,
        sort: { priority: -1, createdAt: -1 }
      });
    } else {
      result = await complaintRepository.findByUser(req.userId, options);
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get complaint by ID
 * GET /api/complaints/:id
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await complaintRepository.findById(
      req.params.id,
      'userId serviceId bookingId response.respondedBy resolvedBy'
    );
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khiếu nại'
      });
    }

    // Check access
    if (complaint.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem khiếu nại này'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create complaint
 * POST /api/complaints
 */
export const createComplaint = async (req, res, next) => {
  try {
    const { serviceId, bookingId, subject, message, category, images } = req.body;

    // Verify service exists if provided
    if (serviceId) {
      const service = await serviceRepository.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ'
        });
      }
    }

    const complaint = await complaintRepository.create({
      userId: req.userId,
      serviceId,
      bookingId,
      subject,
      message,
      category: category || 'other',
      images,
      status: 'pending',
      priority: 'medium'
    });

    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Gửi khiếu nại thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to complaint (Admin only)
 * POST /api/complaints/:id/respond
 */
export const respondToComplaint = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung phản hồi'
      });
    }

    const complaint = await complaintRepository.respond(
      req.params.id,
      content,
      req.userId
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khiếu nại'
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Phản hồi khiếu nại thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve complaint (Admin only)
 * POST /api/complaints/:id/resolve
 */
export const resolveComplaint = async (req, res, next) => {
  try {
    const { resolution, resolutionNote } = req.body;

    const complaint = await complaintRepository.resolve(
      req.params.id,
      resolution,
      resolutionNote,
      req.userId
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khiếu nại'
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Xử lý khiếu nại thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update complaint status (Admin only)
 * PATCH /api/complaints/:id/status
 */
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, priority } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const complaint = await complaintRepository.updateById(req.params.id, updateData);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khiếu nại'
      });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Cập nhật trạng thái thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get complaint statistics (Admin only)
 * GET /api/complaints/stats
 */
export const getComplaintStats = async (req, res, next) => {
  try {
    const [statusStats, categoryStats] = await Promise.all([
      complaintRepository.getStats(),
      complaintRepository.getCategoryStats()
    ]);

    res.json({
      success: true,
      data: {
        ...statusStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getComplaints,
  getComplaintById,
  createComplaint,
  respondToComplaint,
  resolveComplaint,
  updateComplaintStatus,
  getComplaintStats
};
