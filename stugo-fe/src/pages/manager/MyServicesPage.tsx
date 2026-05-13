import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    MapPin,
    Clock,
    DollarSign,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { getMyServices, deleteService } from '../../services/service.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ServiceViewModal from '../../components/manager/ServiceViewModal';
import EditTransportModal from '../../components/manager/EditTransportModal';
import EditAccommodationModal from '../../components/manager/EditAccommodationModal';
import EditRestaurantModal from '../../components/manager/EditRestaurantModal';
import toast from 'react-hot-toast';

// Helper function
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const MyServicesPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<any[]>([]);
    const [filteredServices, setFilteredServices] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [viewService, setViewService] = useState<any>(null);
    const [editService, setEditService] = useState<any>(null);

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        filterServices();
    }, [searchTerm, typeFilter, statusFilter, services]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await getMyServices();
            setServices(response.data || []);
        } catch (error: any) {
            console.error('Error fetching services:', error);
            toast.error('Không thể tải danh sách dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    const filterServices = () => {
        let filtered = [...services];

        // Filter by type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(s => s.type === typeFilter);
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(s =>
                statusFilter === 'active' ? s.isAvailable : !s.isAvailable
            );
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.name?.toLowerCase().includes(term) ||
                s.location?.toLowerCase().includes(term)
            );
        }

        setFilteredServices(filtered);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteService(id);
            toast.success('Xóa dịch vụ thành công');
            fetchServices();
            setDeleteConfirm(null);
        } catch (error: any) {
            toast.error('Không thể xóa dịch vụ');
        }
    };

    const getServiceTypeLabel = (type: string) => {
        switch (type) {
            case 'transport':
                return 'Vận chuyển';
            case 'accommodation':
                return 'Chỗ ở';
            case 'restaurant':
                return 'Nhà hàng';
            default:
                return type;
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <ToggleRight className="w-3 h-3" />
                    Hoạt động
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <ToggleLeft className="w-3 h-3" />
                Tạm dừng
            </span>
        );
    };

    const stats = [
        {
            label: 'Tổng dịch vụ',
            value: services.length,
            color: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Đang hoạt động',
            value: services.filter(s => s.isAvailable).length,
            color: 'from-green-500 to-green-600',
        },
        {
            label: 'Vận chuyển',
            value: services.filter(s => s.type === 'transport').length,
            color: 'from-purple-500 to-purple-600',
        },
        {
            label: 'Chỗ ở & Nhà hàng',
            value: services.filter(s => s.type === 'accommodation' || s.type === 'restaurant').length,
            color: 'from-orange-500 to-orange-600',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">
                        Dịch vụ của tôi
                    </h1>
                    <p className="text-gray-500">
                        Quản lý tất cả dịch vụ bạn đang cung cấp
                    </p>
                </div>
                <button
                    onClick={() => navigate('/manager/create')}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Tạo dịch vụ mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="card p-4">
                        <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, địa điểm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="input w-full sm:w-48"
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="transport">Vận chuyển</option>
                            <option value="accommodation">Chỗ ở</option>
                            <option value="restaurant">Nhà hàng</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input w-full sm:w-40"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Tạm dừng</option>
                    </select>
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                        <div key={service.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Image */}
                            <div className="relative h-48 bg-gray-200">
                                {service.images && service.images[0] ? (
                                    <img
                                        src={service.images[0]}
                                        alt={service.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                        <MapPin className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    {getStatusBadge(service.isAvailable ? 'active' : 'inactive')}
                                </div>
                                <div className="absolute top-3 left-3">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700">
                                        {getServiceTypeLabel(service.type)}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                                    {service.name}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    {service.address && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                            <span className="line-clamp-1">{service.address}</span>
                                        </div>
                                    )}

                                    {/* Transport: Show first route and departure times */}
                                    {service.type === 'transport' && (
                                        <>
                                            {service.routes && service.routes.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    <span className="line-clamp-1">{service.routes[0]}</span>
                                                </div>
                                            )}
                                            {service.departureTime && service.departureTime.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                    <span>{service.departureTime.slice(0, 3).join(', ')}</span>
                                                    {service.departureTime.length > 3 && <span>...</span>}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Accommodation: Show room types */}
                                    {service.type === 'accommodation' && service.roomTypes && service.roomTypes.length > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <span>{service.roomTypes.length} loại phòng</span>
                                        </div>
                                    )}

                                    {/* Restaurant: Show cuisine and operating hours */}
                                    {service.type === 'restaurant' && (
                                        <>
                                            {service.cuisine && service.cuisine.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                    <span className="line-clamp-1">{service.cuisine.join(', ')}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Operating hours for all types */}
                                    {service.openTime && service.closeTime && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <span>{service.openTime} - {service.closeTime}</span>
                                        </div>
                                    )}

                                    {/* Price */}
                                    <div className="flex items-center gap-2 text-sm font-medium text-primary-600">
                                        <DollarSign className="w-4 h-4" />
                                        {service.type === 'transport' && service.priceRange ? (
                                            <span>Từ {formatPrice(service.priceRange.min)}</span>
                                        ) : service.type === 'accommodation' && service.roomTypes?.[0]?.price ? (
                                            <span>Từ {formatPrice(service.roomTypes[0].price)}/đêm</span>
                                        ) : service.type === 'accommodation' && service.priceRange ? (
                                            <span>Từ {formatPrice(service.priceRange.min)}/đêm</span>
                                        ) : service.type === 'restaurant' && service.priceRange ? (
                                            <span>Từ {formatPrice(service.priceRange.min)}</span>
                                        ) : service.type === 'restaurant' && service.menuItems?.[0]?.price ? (
                                            <span>Từ {formatPrice(service.menuItems[0].price)}</span>
                                        ) : (
                                            <span>Liên hệ</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setViewService(service)}
                                        className="flex-1 btn btn-ghost text-sm py-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Xem
                                    </button>
                                    <button
                                        onClick={() => setEditService(service)}
                                        className="flex-1 btn btn-primary text-sm py-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(service.id)}
                                        className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm py-2 px-3"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                                ? 'Không tìm thấy dịch vụ nào'
                                : 'Bạn chưa có dịch vụ nào'}
                        </p>
                        {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                            <button
                                onClick={() => navigate('/manager/create')}
                                className="btn btn-primary"
                            >
                                <Plus className="w-5 h-5" />
                                Tạo dịch vụ đầu tiên
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Xóa dịch vụ?
                            </h3>
                            <p className="text-gray-500">
                                Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn btn-secondary flex-1"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Service Modal */}
            {viewService && (
                <ServiceViewModal
                    service={viewService}
                    onClose={() => setViewService(null)}
                    onEdit={() => {
                        setEditService(viewService);
                        setViewService(null);
                    }}
                />
            )}

            {/* Edit Modals */}
            {editService && editService.type === 'transport' && (
                <EditTransportModal
                    service={editService}
                    onClose={() => setEditService(null)}
                    onSuccess={() => {
                        setEditService(null);
                        fetchServices();
                    }}
                />
            )}

            {editService && editService.type === 'accommodation' && (
                <EditAccommodationModal
                    service={editService}
                    onClose={() => setEditService(null)}
                    onSuccess={() => {
                        setEditService(null);
                        fetchServices();
                    }}
                />
            )}

            {editService && editService.type === 'restaurant' && (
                <EditRestaurantModal
                    service={editService}
                    onClose={() => setEditService(null)}
                    onSuccess={() => {
                        setEditService(null);
                        fetchServices();
                    }}
                />
            )}
        </div>
    );
};

export default MyServicesPage;
