import { Combo, Service } from '../models/index.js';

const normalizeLinkedServices = async (linkedServices = []) => {
  if (!Array.isArray(linkedServices) || linkedServices.length === 0) return [];

  const serviceIds = linkedServices
    .map(ls => (typeof ls.serviceId === 'object' ? ls.serviceId?._id || ls.serviceId?.id : ls.serviceId))
    .filter(Boolean);

  if (serviceIds.length === 0) return [];

  const services = await Service.find({ _id: { $in: serviceIds } }).select('_id ownerId').lean();
  const serviceMap = services.reduce((acc, service) => {
    acc[service._id.toString()] = service;
    return acc;
  }, {});

  return linkedServices
    .map(ls => {
      const rawServiceId = typeof ls.serviceId === 'object' ? ls.serviceId?._id || ls.serviceId?.id : ls.serviceId;
      if (!rawServiceId) return null;
      const serviceId = rawServiceId.toString();
      const matchedService = serviceMap[serviceId];
      if (!matchedService) return null;

      const rawSupplierId = typeof ls.supplierId === 'object' ? ls.supplierId?._id || ls.supplierId?.id : ls.supplierId;
      const supplierId = rawSupplierId || matchedService.ownerId;

      return {
        serviceId,
        supplierId: supplierId?.toString(),
        netPriceAtBooking: Number(ls.netPriceAtBooking || 0)
      };
    })
    .filter(Boolean);
};

export const createCombo = async (req, res, next) => {
  try {
    const { name, thumbnail, images, destination, duration, linkedServices, accommodationName, transportType, includes, excludes, termsAndConditions, pricing } = req.body;
    const normalizedLinkedServices = await normalizeLinkedServices(linkedServices);
    
    const combo = new Combo({
      name,
      thumbnail,
      images,
      destination,
      duration,
      linkedServices: normalizedLinkedServices,
      accommodationName,
      transportType,
      includes,
      excludes,
      termsAndConditions,
      pricing,
      ownerId: req.user._id,
      status: req.user.role === 'admin' ? 'active' : 'pending' // Admin's combo is active immediately
    });

    await combo.save();

    res.status(201).json({
      success: true,
      data: combo,
      message: 'Tạo combo thành công'
    });
  } catch (error) {
    next(error);
  }
};

export const getCombos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, destination, status } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // Default to active for customers
    }

    if (req.user && req.user.role === 'partner' && req.query.myCombos === 'true') {
      query.ownerId = req.user._id;
      delete query.status; // Partners can see their own pending combos
      if (status) query.status = status;
    }

    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }

    const combos = await Combo.find(query)
      .populate('ownerId', 'fullName avatar')
      .populate('linkedServices.serviceId', 'name type thumbnail')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Combo.countDocuments(query);

    res.status(200).json({
      success: true,
      data: combos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getComboById = async (req, res, next) => {
  try {
    const combo = await Combo.findById(req.params.id)
      .populate('ownerId', 'fullName avatar')
      .populate('linkedServices.serviceId', 'name type thumbnail images address')
      .populate('linkedServices.supplierId', 'fullName avatar');

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Combo'
      });
    }

    res.status(200).json({
      success: true,
      data: combo
    });
  } catch (error) {
    next(error);
  }
};

export const updateCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findById(req.params.id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Combo'
      });
    }

    if (combo.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật Combo này'
      });
    }

    const payload = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(req.body, 'linkedServices')) {
      payload.linkedServices = await normalizeLinkedServices(req.body.linkedServices);
    }

    const updatedCombo = await Combo.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCombo,
      message: 'Cập nhật Combo thành công'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findById(req.params.id);

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Combo'
      });
    }

    if (combo.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa Combo này'
      });
    }

    await Combo.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa Combo thành công'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createCombo,
  getCombos,
  getComboById,
  updateCombo,
  deleteCombo
};
