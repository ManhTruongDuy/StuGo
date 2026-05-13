import { useEffect, useState, useMemo } from 'react';
import {
    Wallet,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    X,
    Building2,
    CreditCard,
    ArrowDownRight,
} from 'lucide-react';
import { getDashboardOverview, type DashboardOverview } from '../../services/dashboard.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'completed' | 'failed';

interface WithdrawalRequest {
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: string;
    requestDate: string;
    transferDate?: string;
}

const WithdrawalHistoryPage = () => {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const overviewData = await getDashboardOverview();
            setOverview(overviewData);

            // Mock withdrawal data - In production, this would come from an API
            setWithdrawals([
                {
                    id: '1',
                    amount: 5000000,
                    fee: 50000,
                    netAmount: 4950000,
                    bankName: 'Vietcombank',
                    accountNumber: '1234567890',
                    accountHolder: 'NGUYEN VAN A',
                    status: 'completed',
                    requestDate: '2026-01-25T10:00:00Z',
                    transferDate: '2026-01-26T14:00:00Z',
                },
                {
                    id: '2',
                    amount: 3000000,
                    fee: 30000,
                    netAmount: 2970000,
                    bankName: 'Techcombank',
                    accountNumber: '9876543210',
                    accountHolder: 'NGUYEN VAN A',
                    status: 'pending',
                    requestDate: '2026-01-28T09:30:00Z',
                },
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredWithdrawals = useMemo(() => {
        if (statusFilter === 'all') return withdrawals;
        return withdrawals.filter((w) => w.status === statusFilter);
    }, [withdrawals, statusFilter]);

    const totalBalance = overview?.revenue.total || 0;
    const totalWithdrawn = withdrawals
        .filter((w) => w.status === 'completed')
        .reduce((sum, w) => sum + w.netAmount, 0);
    const pendingAmount = withdrawals
        .filter((w) => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);

    const handleWithdrawalRequest = async () => {
        const amount = parseInt(withdrawAmount.replace(/\D/g, ''));
        if (!amount || amount < 100000) {
            toast.error('Số tiền tối thiểu là 100,000 VNĐ');
            return;
        }
        if (amount > totalBalance - totalWithdrawn - pendingAmount) {
            toast.error('Số dư không đủ');
            return;
        }

        try {
            setSubmitting(true);
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newRequest: WithdrawalRequest = {
                id: Date.now().toString(),
                amount,
                fee: Math.round(amount * 0.01),
                netAmount: Math.round(amount * 0.99),
                bankName: 'Vietcombank',
                accountNumber: '1234567890',
                accountHolder: 'NGUYEN VAN A',
                status: 'pending',
                requestDate: new Date().toISOString(),
            };

            setWithdrawals((prev) => [newRequest, ...prev]);
            toast.success('Đã gửi yêu cầu rút tiền');
            setShowModal(false);
            setWithdrawAmount('');
        } catch (error) {
            toast.error('Không thể gửi yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { icon: any; class: string; label: string }> = {
            pending: {
                icon: Clock,
                class: 'bg-yellow-100 text-yellow-700',
                label: 'Đang xử lý',
            },
            completed: {
                icon: CheckCircle,
                class: 'bg-green-100 text-green-700',
                label: 'Thành công',
            },
            failed: {
                icon: XCircle,
                class: 'bg-red-100 text-red-700',
                label: 'Thất bại',
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">
                        Lịch sử rút tiền
                    </h1>
                    <p className="text-gray-500">
                        Quản lý các giao dịch rút tiền của bạn
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Yêu cầu rút tiền
                </button>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng doanh thu</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(totalBalance)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Số dư khả dụng</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(totalBalance - totalWithdrawn - pendingAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <ArrowDownRight className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đã rút</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(totalWithdrawn)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                statusFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                statusFilter === 'pending'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Đang xử lý
                        </button>
                        <button
                            onClick={() => setStatusFilter('completed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                statusFilter === 'completed'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Thành công
                        </button>
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
                                        Số tiền
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Phí
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Thực nhận
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Ngân hàng
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Ngày yêu cầu
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Ngày chuyển
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredWithdrawals.length > 0 ? (
                                    filteredWithdrawals.map((withdrawal) => (
                                        <tr key={withdrawal.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatPrice(withdrawal.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-red-600">
                                                -{formatPrice(withdrawal.fee)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-green-600">
                                                {formatPrice(withdrawal.netAmount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-900">
                                                            {withdrawal.bankName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {withdrawal.accountNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(withdrawal.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(withdrawal.requestDate).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {withdrawal.transferDate
                                                    ? new Date(withdrawal.transferDate).toLocaleDateString('vi-VN')
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            Chưa có giao dịch rút tiền nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Withdrawal Request Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Yêu cầu rút tiền
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Balance Info */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500">Số dư khả dụng</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatPrice(totalBalance - totalWithdrawn - pendingAmount)}
                                </p>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số tiền muốn rút
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        className="input pl-10 w-full text-lg"
                                        placeholder="0"
                                        value={withdrawAmount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setWithdrawAmount(
                                                value ? parseInt(value).toLocaleString('vi-VN') : ''
                                            );
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tối thiểu 100,000 VNĐ • Phí 1%
                                </p>
                            </div>

                            {/* Bank Info */}
                            <div className="p-4 bg-blue-50 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-sm font-medium">Tài khoản nhận</span>
                                </div>
                                <p className="text-sm text-blue-900">
                                    Vietcombank - 1234567890
                                </p>
                                <p className="text-sm text-blue-600">NGUYEN VAN A</p>
                            </div>

                            {/* Preview */}
                            {withdrawAmount && (
                                <div className="p-4 bg-green-50 rounded-xl space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Số tiền rút</span>
                                        <span className="text-gray-900">
                                            {formatPrice(parseInt(withdrawAmount.replace(/\D/g, '')) || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Phí (1%)</span>
                                        <span className="text-red-600">
                                            -{formatPrice(Math.round((parseInt(withdrawAmount.replace(/\D/g, '')) || 0) * 0.01))}
                                        </span>
                                    </div>
                                    <div className="border-t border-green-200 pt-2 flex justify-between">
                                        <span className="text-green-700 font-medium">Thực nhận</span>
                                        <span className="text-green-700 font-bold">
                                            {formatPrice(Math.round((parseInt(withdrawAmount.replace(/\D/g, '')) || 0) * 0.99))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleWithdrawalRequest}
                                    disabled={!withdrawAmount || submitting}
                                    className="btn-primary flex-1"
                                >
                                    {submitting ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        'Xác nhận'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalHistoryPage;
