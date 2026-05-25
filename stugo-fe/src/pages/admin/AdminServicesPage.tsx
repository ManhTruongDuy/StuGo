import { useEffect, useState, useMemo } from 'react';
import {
    Search,
    Filter,
    MapPin,
    Star,
    ToggleLeft,
    ToggleRight,
    Bus,
    Building2,
    Utensils,
    Pencil,
    Plus,
    Trash2,
    X,
    Loader2,
    Image,
} from 'lucide-react';
import { getServices } from '../../services/service.service';
import api from '../../services/api';
import type { Service, ServiceType } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type TypeFilter = 'all' | ServiceType;
type StatusFilter = 'all' | 'active' | 'inactive';

// ── Image Edit Modal ──────────────────────────────────────────────────────────
const ImageEditModal = ({
    service,
    onClose,
    onSaved,
}: {
    service: Service;
    onClose: () => void;
    onSaved: (id: string, images: string[]) => void;
}) => {
    const [images, setImages] = useState<string[]>(service.images || []);
    const [newUrl, setNewUrl] = useState('');
    const [saving, setSaving] = useState(false);

    const addUrl = () => {
        const trimmed = newUrl.trim();
        if (!trimmed) return;
        if (!trimmed.startsWith('http')) {
            toast.error('URL phải bắt đầu bằng http:// hoặc https://');
            return;
        }
        setImages((prev) => [...prev, trimmed]);
        setNewUrl('');
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put(`/services/${service.id}`, { images });
            toast.success('Đã cập nhật ảnh');
            onSaved(service.id, images);
            onClose();
        } catch {
            toast.error('Không thể cập nhật ảnh');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Image className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Chỉnh sửa ảnh</h3>
                            <p className="text-xs text-gray-500 line-clamp-1">{service.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Add URL input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thêm URL ảnh
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                                placeholder="https://example.com/image.jpg"
                                className="input flex-1 text-sm"
                            />
                            <button
                                onClick={addUrl}
                                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Dán URL ảnh từ Unsplash, imgbb, hoặc bất kỳ nguồn nào
                        </p>
                    </div>

                    {/* Image list */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Danh sách ảnh ({images.length})
                        </label>
                        {images.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                                Chưa có ảnh nào. Thêm URL ảnh ở trên.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {images.map((url, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                                        <img
                                            src={url}
                                            alt=""
                                            className="w-14 h-10 object-cover rounded-lg flex-shrink-0 bg-gray-200"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/56x40?text=Error';
                                            }}
                                        />
                                        <span className="flex-1 text-xs text-gray-600 truncate">{url}</span>
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 px-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminServicesPage = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [editingService, setEditingService] = useState<Service | null>(null);

    useEffect(() => {
        const fetchAllServices = async () => {
            try {
                setLoading(true);
                const response = await getServices({ limit: 200, sortBy: 'newest' });
                setServices(response.data || []);
            } catch (error) {
                console.error('Error fetching services for admin:', error);
                toast.error('Không thể tải danh sách dịch vụ');
            } finally {
                setLoading(false);
            }
        };

        fetchAllServices();
    }, []);

    const filteredServices = useMemo(() => {
        return services.filter((service) => {
            const matchesType = typeFilter === 'all' || service.type === typeFilter;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' ? service.isAvailable : !service.isAvailable);
            const matchesSearch =
                !searchQuery ||
                service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.district.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesType && matchesStatus && matchesSearch;
        });
    }, [services, typeFilter, statusFilter, searchQuery]);

    const stats = useMemo(() => {
        const total = services.length;
        const transport = services.filter((s) => s.type === 'transport').length;
        const accommodation = services.filter((s) => s.type === 'accommodation').length;
        const restaurant = services.filter((s) => s.type === 'restaurant').length;
        const active = services.filter((s) => s.isAvailable).length;

        return { total, transport, accommodation, restaurant, active };
    }, [services]);

    const getTypeBadge = (type: ServiceType) => {
        switch (type) {
            case 'transport':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        <Bus className="w-3 h-3" />
                        Nhà xe
                    </span>
                );
            case 'accommodation':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        <Building2 className="w-3 h-3" />
                        Nhà trọ
                    </span>
                );
            case 'restaurant':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        <Utensils className="w-3 h-3" />
                        Quán ăn
                    </span>
                );
            default:
                return null;
        }
    };

    const getStatusBadge = (isAvailable: boolean) => {
        return isAvailable ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <ToggleRight className="w-3 h-3" />
                Đang hoạt động
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <ToggleLeft className="w-3 h-3" />
                Tạm dừng
            </span>
        );
    };

    const formatPriceRange = (service: Service) => {
        if (!service.priceRange?.min && !service.priceRange?.max) {
            return 'Liên hệ';
        }

        const formatter = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        });

        if (service.priceRange.min && service.priceRange.max) {
            return `${formatter.format(service.priceRange.min)} - ${formatter.format(
                service.priceRange.max
            )}`;
        }

        if (service.priceRange.min) {
            return `Từ ${formatter.format(service.priceRange.min)}`;
        }

        return `Đến ${formatter.format(service.priceRange.max)}`;
    };

    const handleImagesSaved = (id: string, images: string[]) => {
        setServices((prev) =>
            prev.map((s) => (s.id === id ? { ...s, images } : s))
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-height-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Image edit modal */}
            {editingService && (
                <ImageEditModal
                    service={editingService}
                    onClose={() => setEditingService(null)}
                    onSaved={handleImagesSaved}
                />
            )}
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Quản lý dịch vụ
                </h1>
                <p className="text-gray-500">
                    Theo dõi tất cả dịch vụ nhà xe, nhà trọ, quán ăn trên hệ thống
                </p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-sm text-gray-500 mb-1">Tổng dịch vụ</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-gray-500 mb-1">Nhà xe</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.transport}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-gray-500 mb-1">Nhà trọ</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.accommodation}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-gray-500 mb-1">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo tên dịch vụ, thành phố, quận/huyện..."
                            className="input pl-10 w-full"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="input w-full sm:w-44"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                        </select>
                    </div>
                </div>

                {/* Type tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            typeFilter === 'all'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setTypeFilter('transport')}
                        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                            typeFilter === 'transport'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Bus className="w-4 h-4" />
                        Nhà xe
                    </button>
                    <button
                        onClick={() => setTypeFilter('accommodation')}
                        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                            typeFilter === 'accommodation'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Nhà trọ
                    </button>
                    <button
                        onClick={() => setTypeFilter('restaurant')}
                        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                            typeFilter === 'restaurant'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Utensils className="w-4 h-4" />
                        Quán ăn
                    </button>
                </div>
            </div>

            {/* Services table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Dịch vụ
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Loại
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Địa chỉ
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Giá
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Đánh giá
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Ảnh
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    {service.images?.[0] ? (
                                                        <img
                                                            src={service.images[0]}
                                                            alt={service.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <MapPin className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-1">
                                                        {service.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        ID: {service.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getTypeBadge(service.type)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="space-y-0.5">
                                                    <p className="line-clamp-1">
                                                        {service.address}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {service.ward &&
                                                            `${service.ward}, `}{' '}
                                                        {service.district}, {service.city}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatPriceRange(service)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="font-medium">
                                                    {service.rating.toFixed(1)}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    ({service.reviewCount})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(service.isAvailable)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setEditingService(service)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Sửa ảnh ({service.images?.length || 0})
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-8 text-center text-gray-500"
                                    >
                                        Không có dịch vụ nào phù hợp với bộ lọc
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminServicesPage;

