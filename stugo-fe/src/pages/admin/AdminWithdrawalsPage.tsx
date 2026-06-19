import { useState, useEffect } from 'react';
import {
    Wallet,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    CreditCard,
    Building2,
    User,
} from 'lucide-react';
import { getAllAdminTransactions, updateTransactionStatus, type Transaction } from '../../services/transaction.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'completed' | 'failed';

const AdminWithdrawalsPage = () => {
    const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [statusFilter]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const response = await getAllAdminTransactions(statusFilter, 'withdrawal', 1, 100);
            if (response.success) {
                setWithdrawals(response.data as any); // Assuming response.data is Transaction[] based on service
            }
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            toast.error('Không thể tải danh sách rút tiền');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'completed' | 'failed') => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${status === 'completed' ? 'duyệt' : 'từ chối'} yêu cầu rút tiền này?`)) {
            return;
        }

        try {
            setProcessingId(id);
            await updateTransactionStatus(id, status);
            toast.success(`Đã ${status === 'completed' ? 'duyệt' : 'từ chối'} yêu cầu rút tiền`);
            fetchWithdrawals();
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        Đã chuyển
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                        <XCircle className="w-4 h-4" />
                        Từ chối
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 text-sm font-medium border border-yellow-200">
                        <Clock className="w-4 h-4 animate-spin-slow" />
                        Đang xử lý
                    </span>
                );
        }
    };

    const filteredWithdrawals = withdrawals.filter((w) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const userName = (w as any).userId?.fullName?.toLowerCase() || '';
            const userEmail = (w as any).userId?.email?.toLowerCase() || '';
            return (
                userName.includes(query) ||
                userEmail.includes(query) ||
                w.bankName?.toLowerCase().includes(query) ||
                w.accountNumber?.includes(query) ||
                w.accountHolder?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">
                        Quản lý rút tiền
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Phê duyệt và theo dõi các yêu cầu rút tiền từ đối tác
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, ngân hàng, số tài khoản..."
                            className="input pl-11 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="input w-full sm:w-48 appearance-none bg-white cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Đang chờ xử lý</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="failed">Đã từ chối</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : filteredWithdrawals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Wallet className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Không có yêu cầu rút tiền nào
                        </h3>
                        <p className="text-gray-500 mt-1">
                            Các yêu cầu rút tiền của đối tác sẽ xuất hiện ở đây
                        </p>
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
                                        Thông tin nhận tiền
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                        Số tiền
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredWithdrawals.map((withdrawal) => (
                                    <tr key={withdrawal._id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {(withdrawal as any).userId?.fullName || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {(withdrawal as any).userId?.email || ''}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {new Date(withdrawal.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {withdrawal.bankName?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {withdrawal.accountNumber}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {withdrawal.accountHolder}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-500 line-through">
                                                    {formatPrice(withdrawal.amount)}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Thực nhận: <span className="text-green-600">{formatPrice(withdrawal.netAmount)}</span>
                                                </p>
                                                <p className="text-xs text-red-500">
                                                    Phí: {formatPrice(withdrawal.fee)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(withdrawal.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {withdrawal.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(withdrawal._id, 'completed')}
                                                        disabled={processingId === withdrawal._id}
                                                        className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(withdrawal._id, 'failed')}
                                                        disabled={processingId === withdrawal._id}
                                                        className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminWithdrawalsPage;
