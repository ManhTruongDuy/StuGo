import { useEffect, useMemo, useState } from 'react';
import { Search, MoreVertical, Eye, Ban, Check, Mail } from 'lucide-react';
import { getAdminUsers } from '../../services/admin.service';
import type { User } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const UsersListPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
    const [page] = useState(1);
    const [pagination, setPagination] = useState<any | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const res = await getAdminUsers({ page, limit: 50 });
                setUsers(res.data);
                setPagination(res.pagination || null);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Không thể tải danh sách người dùng');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const userStatus = (user as any).status || 'active';
            const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [users, searchQuery, statusFilter]);

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
            {loading && (
                <div className="flex items-center justify-center min-h-[300px]">
                    <LoadingSpinner />
                </div>
            )}

            {!loading && (
                <>
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
                            {users.length}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tổng người dùng (trang hiện tại)</p>
                        <p className="font-semibold text-gray-900">{users.length} tài khoản</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-600">
                            {users.filter((u: any) => u.status === 'active').length}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Đang hoạt động</p>
                        <p className="font-semibold text-gray-900">
                            {users.filter((u: any) => u.status === 'active').length} tài khoản
                        </p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-red-600">
                            {users.filter((u: any) => u.status === 'banned').length}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Bị khóa</p>
                        <p className="font-semibold text-gray-900">
                            {users.filter((u: any) => u.status === 'banned').length} tài khoản
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            className="input pl-12"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'active'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Hoạt động
                        </button>
                        <button
                            onClick={() => setStatusFilter('banned')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'banned'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Bị khóa
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Người dùng
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Liên hệ
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Số đặt chỗ
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Ngày tham gia
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar}
                                                alt={user.fullName}
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{user.fullName}</p>
                                                <p className="text-sm text-gray-500">#{user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm text-gray-900">{user.email}</p>
                                            <p className="text-sm text-gray-500">{user.phone}</p>
                                        </div>
                                    </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                                                : '-'}
                                        </td>
                                    <td className="px-6 py-4">{getStatusBadge((user as any).status || 'active')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <Eye className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Hiển thị {filteredUsers.length} trong tổng số {pagination?.total || users.length} người dùng
                </p>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">
                        Trước
                    </button>
                    <button className="w-10 h-10 rounded-lg bg-primary-500 text-white font-medium">
                        1
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">
                        Sau
                    </button>
                </div>
                </div>
            </>
            )}
        </div>
    );
};

export default UsersListPage;
