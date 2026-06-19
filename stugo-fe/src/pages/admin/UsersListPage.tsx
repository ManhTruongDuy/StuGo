import { useEffect, useState } from 'react';
import { Search, Eye, Ban, Check, Mail, MoreVertical } from 'lucide-react';
import { getAdminUsers, getUserOverviewStats } from '../../services/admin.service';
import type { User } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const UsersListPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [planFilter, setPlanFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any | null>(null);
    const [stats, setStats] = useState<{ total: number; active: number; banned: number } | null>(null);

    // Debounce searchQuery
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const params: any = { page, limit: 10 };
                if (debouncedSearchQuery) params.search = debouncedSearchQuery;
                if (statusFilter !== 'all') params.status = statusFilter;
                if (roleFilter !== 'all') params.role = roleFilter;
                if (planFilter !== 'all') params.plan = planFilter;

                const [resUsers, resStats] = await Promise.all([
                    getAdminUsers(params),
                    getUserOverviewStats()
                ]);
                setUsers(resUsers.data);
                setPagination(resUsers.pagination || null);
                if (resStats) setStats(resStats);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Không thể tải danh sách người dùng');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page, debouncedSearchQuery, statusFilter, roleFilter, planFilter]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery, statusFilter, roleFilter, planFilter]);

    const getStatusBadge = (status: string) => {
        return status === 'active' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <Check className="w-3 h-3" />
                Hoạt động
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <Ban className="w-3 h-3" />
                Bị khóa
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Danh sách người dùng
                </h1>
                <p className="text-gray-500">
                    Quản lý tài khoản người dùng trên nền tảng
                </p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">
                            {stats?.total ?? 0}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tổng người dùng</p>
                        <p className="font-semibold text-gray-900">{stats?.total ?? 0} tài khoản</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-600">
                            {stats?.active ?? 0}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Đang hoạt động</p>
                        <p className="font-semibold text-gray-900">
                            {stats?.active ?? 0} tài khoản
                        </p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-red-600">
                            {stats?.banned ?? 0}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Bị khóa</p>
                        <p className="font-semibold text-gray-900">
                            {stats?.banned ?? 0} tài khoản
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            className="input pl-12 w-full"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="input w-40"
                    >
                        <option value="all">Tất cả vai trò</option>
                        <option value="user">Sinh viên</option>
                        <option value="partner">Đối tác</option>
                        <option value="admin">Admin</option>
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="input w-40"
                    >
                        <option value="all">Tất cả gói</option>
                        <option value="free">Freemium</option>
                        <option value="premium">Student Premium</option>
                        <option value="business_basic">Business Basic</option>
                        <option value="business_premium">Business Premium</option>
                        <option value="standard">Standard</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="input w-44"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="banned">Bị khóa</option>
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
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Người dùng</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Liên hệ</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Vai trò</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Gói</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                                                        {user.fullName?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.fullName}</p>
                                                    <p className="text-xs text-gray-400">#{user.id?.slice(-8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{user.email}</p>
                                            <p className="text-xs text-gray-500">{user.phone || '—'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                user.role === 'partner' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {user.role === 'admin' ? 'Admin' : user.role === 'partner' ? 'Đối tác' : 'Sinh viên'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const plan = (user as any).plan || 'free';
                                                const planMap: Record<string, { label: string; cls: string }> = {
                                                    free: { label: 'Freemium', cls: 'bg-gray-100 text-gray-600' },
                                                    premium: { label: 'Student Premium', cls: 'bg-purple-100 text-purple-700' },
                                                    premium_user: { label: 'Student Premium', cls: 'bg-purple-100 text-purple-700' },
                                                    business_basic: { label: 'Business Basic', cls: 'bg-teal-100 text-teal-700' },
                                                    business_premium: { label: 'Business Premium', cls: 'bg-orange-100 text-orange-700' },
                                                    standard: { label: 'Standard', cls: 'bg-blue-100 text-blue-700' },
                                                };
                                                const p = planMap[plan] || { label: plan, cls: 'bg-gray-100 text-gray-600' };
                                                return (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${p.cls}`}>
                                                        {p.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge((user as any).status || 'active')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Xem">
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Gửi email">
                                                    <Mail className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Thêm">
                                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Hiển thị {users.length} / {pagination.total} người dùng
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border">
                            Trang {page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersListPage;
