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
} from 'lucide-react';
import { getServices } from '../../services/service.service';
import type { Service, ServiceType } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type TypeFilter = 'all' | ServiceType;
type StatusFilter = 'all' | 'active' | 'inactive';

const AdminServicesPage = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-height-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
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

