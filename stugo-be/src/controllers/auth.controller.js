import { userRepository } from '../repositories/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'stugo-dev-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Email/Password Register
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng'
      });
    }

    // Only allow 'user' or 'partner' roles from registration — never 'admin'
    const allowedRole = role === 'partner' ? 'partner' : 'user';

    // Create new user
    const user = await userRepository.create({
      email,
      password,
      fullName,
      phone,
      role: allowedRole,
      status: 'active'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar || user.avatarUrl,
          phone: user.phone,
          role: user.role,
          status: user.status,
          plan: user.plan,
          bankName: user.bankName,
          bankAccount: user.bankAccount,
          bankAccountName: user.bankAccountName
        },
        token
      },
      message: 'Đăng ký thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Email/Password Login
 * POST /api/auth/login
 */
export const loginWithEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác'
      });
    }

    // Check if banned
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar || user.avatarUrl,
          phone: user.phone,
          role: user.role,
          status: user.status,
          plan: user.plan,
          bankName: user.bankName,
          bankAccount: user.bankAccount,
          bankAccountName: user.bankAccountName
        },
        token
      },
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    next(error);
  }
};



/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.userId);

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
        plan: user.plan,
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
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

/**
 * Refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.userId);

    if (!user || user.status === 'banned') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  loginWithEmail,
  getCurrentUser,
  logout,
  refreshToken,
  googleCallback
};

/**
 * Google OAuth Callback — issues JWT after passport authenticates
 * GET /api/auth/google/callback
 */
export async function googleCallback(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
    }
    const token = generateToken(user._id);
    // Redirect to frontend with token in query string — FE picks it up
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
  }
}
