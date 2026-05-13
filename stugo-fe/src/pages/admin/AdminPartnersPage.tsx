import { useEffect, useState } from 'react';
import {
    Search,
    MoreVertical,
    Eye,
    Ban,
    Check,
    MapPin,
    Phone,
    Mail,
    Store,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Users,
} from 'lucide-react';
import { getPartners, updateUserStatus } from '../../services/admin.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'active' | 'banned';

const AdminPartnersPage = () => {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const params: any = { page: currentPage, limit: 20 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;

            const result = await getPartners(params);
            setPartners(result.data);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Error fetching partners:', error);
            toast.error('Không thể tải danh sách đối tác');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, [statusFilter, currentPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchPartners();
            } else {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleStatusChange = async (partnerId: string, newStatus: 'active' | 'banned') => {
        try {
            await updateUserStatus(partnerId, newStatus);
            toast.success(newStatus === 'banned' ? 'Đã khóa đối tác' : 'Đã kích hoạt đối tác');
            setActionMenuId(null);
            fetchPartners();
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            banned: 'bg-red-100 text-red-700',
            pending: 'bg-yellow-100 text-yellow-700',
        };
        const labels: Record<string, string> = {
            active: 'Hoạt động',
            banned: 'Đã khóa',
            pending: 'Chờ duyệt',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Danh sách đối tác
                </h1>
                <p className="text-gray-500">
                    Quản lý các chủ nhà hàng, nhà trọ, nhà xe trên hệ thống
                </p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng đối tác</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {pagination?.total || partners.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {partners.filter((p) => p.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <Ban className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đã khóa</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {partners.filter((p) => p.status === 'banned').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, số điện thoại..."
                            className="input pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="input w-40"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    >
                        <option value="all">Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="banned">Đã khóa</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Đối tác
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Liên hệ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Địa chỉ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Dịch vụ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Doanh thu
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partners.length > 0 ? (
                                    partners.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium">
                                                        {partner.avatar ? (
                                                            <img
                                                                src={partner.avatar}
                                                                alt={partner.fullName}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            partner.fullName?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {partner.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Tham gia {new Date(partner.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Mail className="w-4 h-4" />
                                                        {partner.email}
                                                    </div>
                                                    {partner.phone && (
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                            <Phone className="w-4 h-4" />
                                                            {partner.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {partner.city && (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        {partner.district && `${partner.district}, `}
                                                        {partner.city}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Store className="w-4 h-4 text-primary-600" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {partner.servicesCount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatPrice(partner.totalRevenue)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(partner.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative flex items-center justify-end">
                                                    <button
                                                        onClick={() =>
                                                            setActionMenuId(
                                                                actionMenuId === partner.id ? null : partner.id
                                                            )
                                                        }
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {actionMenuId === partner.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                                <Eye className="w-4 h-4" />
                                                                Xem chi tiết
                                                            </button>
                                                            {partner.status === 'active' ? (
                                                                <button
                                                                    onClick={() =>
                                                                        handleStatusChange(partner.id, 'banned')
                                                                    }
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <Ban className="w-4 h-4" />
                                                                    Khóa tài khoản
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        handleStatusChange(partner.id, 'active')
                                                                    }
                                                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                    Kích hoạt
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            Không có đối tác nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Hiển thị {partners.length} / {pagination.total} đối tác
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium text-gray-700">
                            Trang {currentPage} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close menu */}
            {actionMenuId && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setActionMenuId(null)}
                />
            )}
        </div>
    );
};

export default AdminPartnersPage;
