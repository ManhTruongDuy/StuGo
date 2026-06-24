import { userRepository, bookingRepository, paymentRepository } from '../repositories/index.js';

/**
 * Get all users (Admin only)
 * GET /api/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, status, plan } = req.query;
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: { isMock: 1, createdAt: -1 }
    };

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (plan) {
      if (plan === 'premium') {
        filter.plan = { $in: ['premium', 'premium_user'] };
      } else {
        filter.plan = plan;
      }
    }

    let result;
    
    if (search) {
      result = await userRepository.searchUsers(search, filter, options);
    } else {
      result = await userRepository.find(filter, options);
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
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    // Users can only view their own profile, admins can view any
    if (req.params.id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thông tin này'
      });
    }

    const user = await userRepository.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar || user.avatarUrl,
        phone: user.phone,
        address: user.address,
        city: user.city,
        district: user.district,
        ward: user.ward,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankAccountName: user.bankAccountName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    // Users can only update their own profile, admins can update any
    if (req.params.id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật'
      });
    }

    // Prevent role/status changes unless admin
    const { role, status, ...updateData } = req.body;
    
    if (req.userRole === 'admin') {
      if (role) updateData.role = role;
      if (status) updateData.status = status;
    }

    const user = await userRepository.updateById(req.params.id, updateData);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (Admin only)
 * PATCH /api/users/:id/status
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'banned', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const user = await userRepository.updateById(req.params.id, { status });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: user,
      message: `Đã ${status === 'banned' ? 'khóa' : 'kích hoạt'} tài khoản`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/users/:id/stats
 */
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Get booking stats
    const bookingStats = await bookingRepository.find({ userId }, { limit: 1000 });
    const completedBookings = bookingStats.data.filter(b => b.status === 'completed');
    const totalSpent = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const user = await userRepository.findById(userId);

    res.json({
      success: true,
      data: {
        totalBookings: bookingStats.pagination.total,
        completedBookings: completedBookings.length,
        totalSpent,
        memberSince: user?.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get partners list (Admin only)
 * GET /api/users/partners
 */
export const getPartners = async (req, res, next) => {
  try {
    const { status, search, plan } = req.query;
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: { createdAt: -1 }
    };

    const filter = {};
    if (status) filter.status = status;
    if (plan) {
      if (plan === 'premium') {
        filter.plan = { $in: ['premium', 'premium_user'] };
      } else {
        filter.plan = plan; // e.g. 'free'
      }
    }

    let result;
    if (search) {
      result = await userRepository.searchPartners(search, filter, options);
    } else {
      result = await userRepository.findPartners(filter, options);
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
 * Create a new partner (Admin only)
 * POST /api/users/partners
 */
export const createPartner = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, address, city, district, ward, contracts } = req.body;

    // Validate email
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng'
      });
    }

    // Validate contracts
    if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Hợp đồng là bắt buộc và phải có ít nhất 1 ảnh hợp đồng'
      });
    }

    // Create partner
    const user = await userRepository.create({
      email,
      password,
      fullName,
      phone,
      address,
      city,
      district,
      ward,
      contracts,
      role: 'partner',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Tạo đối tác thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user overview stats (Admin only)
 * GET /api/users/stats
 */
export const getUserOverviewStats = async (req, res, next) => {
  try {
    const total = await userRepository.count({});
    const active = await userRepository.count({ status: 'active' });
    const banned = await userRepository.count({ status: 'banned' });

    res.json({
      success: true,
      data: {
        total,
        active,
        banned
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  getUserStats,
  getPartners,
  createPartner,
  getUserOverviewStats
};
