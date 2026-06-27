import { useEffect, useState, useMemo } from 'react';
import {
    Search,
    Download,
    CreditCard,
    CheckCircle,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    TrendingUp,
} from 'lucide-react';
import { getAdminTransactions, getPaymentStats, checkPaymentStatus, deleteTransaction } from '../../services/admin.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'paid' | 'cancelled' | 'expired';

const AdminTransactionsPage = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params: any = { page: currentPage, limit: 20 };
            if (statusFilter !== 'all') params.status = statusFilter;

            const [transResult, statsResult] = await Promise.all([
                getAdminTransactions(params),
                getPaymentStats(),
            ]);

            setTransactions(transResult.data);
            setPagination(transResult.pagination);
            setStats(statsResult);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Không thể tải lịch sử giao dịch');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckStatus = async (orderCode: number) => {
        try {
            toast.loading('Đang kiểm tra...', { id: 'check-status' });
            const res = await checkPaymentStatus(orderCode);
            if (res && res.status === 'PAID') {
                toast.success('Giao dịch đã được thanh toán', { id: 'check-status' });
                fetchData();
            } else {
                toast.error('Giao dịch chưa được thanh toán hoặc không hợp lệ', { id: 'check-status' });
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi kiểm tra trạng thái', { id: 'check-status' });
        }
    };

    const handleDelete = async (orderCode: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này không?')) return;
        
        try {
            const toastId = toast.loading('Đang xóa...');
            const success = await deleteTransaction(orderCode);
            if (success) {
                toast.success('Xóa giao dịch thành công', { id: toastId });
                fetchData();
            } else {
                toast.error('Không thể xóa giao dịch', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Giao dịch này không thể xóa', { id: 'check-status' });
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, currentPage]);

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        const query = searchQuery.toLowerCase();
        return transactions.filter(
            (t) =>
                t.orderCode?.toString().includes(query) ||
                t.userName?.toLowerCase().includes(query) ||
                t.transactionId?.toLowerCase().includes(query) ||
                (typeof t.bookingId === 'string' ? t.bookingId.toLowerCase().includes(query) : t.bookingId?._id?.toLowerCase().includes(query))
        );
    }, [transactions, searchQuery]);

    const getStatusBadge = (status: string) => {
        const config: Record<string, { icon: any; class: string; label: string }> = {
            pending: {
                icon: Clock,
                class: 'bg-yellow-100 text-yellow-700',
                label: 'Đang xử lý',
            },
            paid: {
                icon: CheckCircle,
                class: 'bg-green-100 text-green-700',
                label: 'Thành công',
            },
            cancelled: {
                icon: XCircle,
                class: 'bg-red-100 text-red-700',
                label: 'Đã hủy',
            },
            expired: {
                icon: Clock,
                class: 'bg-gray-100 text-gray-700',
                label: 'Hết hạn',
            },
        };
        const cfg = config[status] || config.pending;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.class}`}>
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
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

    const handleExportExcel = () => {
        try {
            if (filteredTransactions.length === 0) {
                toast.error('Không có dữ liệu để xuất');
                return;
            }

            const headers = [
                'Mã giao dịch',
                'Mã đơn hàng',
                'Người dùng',
                'Phương thức',
                'Số tiền (VND)',
                'Trạng thái',
                'Ngày tạo'
            ];
            let csv = headers.join(';') + '\n';

            filteredTransactions.forEach(trans => {
                const statusMap: Record<string, string> = {
                    'pending': 'Đang xử lý',
                    'paid': 'Thành công',
                    'cancelled': 'Đã hủy',
                    'expired': 'Hết hạn'
                };

                const methodMap: Record<string, string> = {
                    'vietqr': 'VietQR',
                    'bank_transfer': 'Chuyển khoản',
                    'ewallet': 'Ví điện tử'
                };

                const row = [
                    `"'${trans.transactionId || 'N/A'}"`,
                    `"'${trans.orderCode}"`,
                    `"${trans.userName || 'N/A'}"`,
                    `"${methodMap[trans.method] || trans.method}"`,
                    `"${trans.amount}"`,
                    `"${statusMap[trans.status] || trans.status}"`,
                    `"'${new Date(trans.createdAt).toLocaleString('vi-VN')}"`
                ];
                csv += row.join(';') + '\n';
            });

            // Add summary
            const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            csv += '\n';
            csv += [
                '"Tổng cộng"',
                `"${filteredTransactions.length} giao dịch"`,
                '""', '""',
                `"${totalAmount}"`,
                '""', '""'
            ].join(';') + '\n';

            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `giao-dich-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Xuất báo cáo thành công!');
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Không thể xuất báo cáo');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">
                        Lịch sử giao dịch
                    </h1>
                    <p className="text-gray-500">
                        Theo dõi tất cả giao dịch thanh toán trên hệ thống
                    </p>
                </div>
                <button onClick={handleExportExcel} className="btn-primary">
                    <Download className="w-5 h-5" />
                    Xuất báo cáo
                </button>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng giao dịch</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(stats?.totalRevenue || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Số giao dịch</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {pagination?.total || transactions.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Thành công</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.totalTransactions || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-wrap items-center gap-4 w-full">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã giao dịch, người dùng..."
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
                        <option value="pending">Đang xử lý</option>
                        <option value="paid">Thành công</option>
                        <option value="cancelled">Đã hủy</option>
                        <option value="expired">Hết hạn</option>
                    </select>
                </div>
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
                                        Mã giao dịch
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Mã đặt chỗ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Phương thức
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Số tiền
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((trans) => (
                                        <tr key={trans.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-mono font-medium text-gray-900">
                                                    #{trans.orderCode}
                                                </p>
                                                {trans.transactionId && (
                                                    <p className="text-xs text-gray-500 truncate w-32">
                                                        {trans.transactionId}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {trans.bookingId ? (
                                                    <p className="text-xs font-mono text-gray-600 truncate w-24" title={typeof trans.bookingId === 'string' ? trans.bookingId : trans.bookingId._id}>
                                                        {typeof trans.bookingId === 'string' ? trans.bookingId : trans.bookingId._id}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Premium</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {trans.userName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    {trans.method === 'vietqr'
                                                        ? 'VietQR'
                                                        : trans.method === 'bank_transfer'
                                                            ? 'Chuyển khoản'
                                                            : 'Ví điện tử'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatPrice(trans.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(trans.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(trans.createdAt).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {trans.status === 'pending' && (
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleCheckStatus(trans.orderCode)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Kiểm tra
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(trans.orderCode)}
                                                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            Không có giao dịch nào
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
                        Hiển thị {filteredTransactions.length} / {pagination.total} giao dịch
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
        </div>
    );
};

export default AdminTransactionsPage;
