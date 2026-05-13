import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stugo-dev-secret-key-2026';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không được cung cấp'
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await userRepository.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      if (user.status === 'banned') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị khóa'
        });
      }

      req.userId = user._id.toString();
      req.userRole = user.role;
      req.user = user;
      
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication
 * Attaches user info if token present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await userRepository.findById(decoded.userId);
        
        if (user && user.status !== 'banned') {
          req.userId = user._id.toString();
          req.userRole = user.role;
          req.user = user;
        }
      } catch {
        // Token invalid, but that's okay for optional auth
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role authorization middleware
 * Requires specific roles to access
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = authorize('admin');

/**
 * Partner only middleware
 */
export const partnerOnly = authorize('partner', 'admin');

/**
 * Partner or Admin middleware
 */
export const partnerOrAdmin = authorize('partner', 'admin');

export default {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  partnerOnly,
  partnerOrAdmin
};
