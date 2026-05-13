import { useEffect, useState, useMemo } from 'react';
import {
    Search,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Send,
    X,
    Eye,
} from 'lucide-react';
import {
    getComplaints,
    respondToComplaint,
    updateComplaintStatus,
    getComplaintStats,
} from '../../services/admin.service';
import type { Complaint } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

const AdminComplaintsPage = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    // Modal state
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [responseText, setResponseText] = useState('');
    const [responding, setResponding] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params: any = { page: currentPage, limit: 20 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (priorityFilter !== 'all') params.priority = priorityFilter;

            const [complaintsResult, statsResult] = await Promise.all([
                getComplaints(params),
                getComplaintStats(),
            ]);

            setComplaints(complaintsResult.data);
            setPagination(complaintsResult.pagination);
            setStats(statsResult);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            toast.error('Không thể tải danh sách khiếu nại');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, priorityFilter, currentPage]);

    const filteredComplaints = useMemo(() => {
        if (!searchQuery) return complaints;
        const query = searchQuery.toLowerCase();
        return complaints.filter(
            (c) =>
                c.subject?.toLowerCase().includes(query) ||
                c.userName?.toLowerCase().includes(query) ||
                c.userEmail?.toLowerCase().includes(query)
        );
    }, [complaints, searchQuery]);

    const handleRespond = async () => {
        if (!selectedComplaint || !responseText.trim()) return;

        try {
            setResponding(true);
            await respondToComplaint(selectedComplaint.id, responseText);
            toast.success('Đã gửi phản hồi');
            setSelectedComplaint(null);
            setResponseText('');
            fetchData();
        } catch (error) {
            toast.error('Không thể gửi phản hồi');
        } finally {
            setResponding(false);
        }
    };

    const handleStatusChange = async (complaintId: string, newStatus: string) => {
        try {
            await updateComplaintStatus(complaintId, newStatus);
            toast.success('Đã cập nhật trạng thái');
            fetchData();
        } catch (error) {
            toast.error('Không thể cập nhật');
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { icon: any; class: string; label: string }> = {
            pending: {
                icon: Clock,
                class: 'bg-yellow-100 text-yellow-700',
                label: 'Chờ xử lý',
            },
            in_progress: {
                icon: AlertTriangle,
                class: 'bg-blue-100 text-blue-700',
                label: 'Đang xử lý',
            },
            resolved: {
                icon: CheckCircle,
                class: 'bg-green-100 text-green-700',
                label: 'Đã giải quyết',
            },
            closed: {
                icon: XCircle,
                class: 'bg-gray-100 text-gray-700',
                label: 'Đã đóng',
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

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            low: 'bg-gray-100 text-gray-600',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            low: 'Thấp',
            medium: 'Trung bình',
            high: 'Cao',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[priority] || styles.medium}`}>
                {labels[priority] || priority}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Khiếu nại & Phản hồi
                </h1>
                <p className="text-gray-500">
                    Quản lý và xử lý các khiếu nại từ người dùng
                </p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng khiếu nại</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.total || pagination?.total || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Chờ xử lý</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.pending || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đã giải quyết</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.resolved || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ưu tiên cao</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {complaints.filter((c) => (c as any).priority === 'high').length}
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
                            placeholder="Tìm theo tiêu đề, người gửi..."
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
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="in_progress">Đang xử lý</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="closed">Đã đóng</option>
                    </select>

                    <select
                        className="input w-36"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                    >
                        <option value="all">Tất cả mức độ</option>
                        <option value="high">Ưu tiên cao</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
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
                                        Người gửi
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Tiêu đề
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Mức độ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredComplaints.length > 0 ? (
                                    filteredComplaints.map((complaint) => (
                                        <tr key={complaint.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {complaint.userName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {complaint.userEmail}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900 line-clamp-1 max-w-xs">
                                                    {complaint.subject}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getPriorityBadge((complaint as any).priority || 'medium')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(complaint.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(complaint.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedComplaint(complaint)}
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                                        title="Xem & Phản hồi"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {complaint.status === 'pending' && (
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(complaint.id, 'resolved')
                                                            }
                                                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                                            title="Đánh dấu đã giải quyết"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            Không có khiếu nại nào
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
                        Hiển thị {filteredComplaints.length} / {pagination.total} khiếu nại
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

            {/* Detail & Response Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Chi tiết khiếu nại
                            </h2>
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Người gửi</p>
                                        <p className="font-medium text-gray-900">
                                            {selectedComplaint.userName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {selectedComplaint.userEmail}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Ngày gửi</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(selectedComplaint.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Tiêu đề</p>
                                    <p className="font-medium text-gray-900">
                                        {selectedComplaint.subject}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Nội dung</p>
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-700">
                                        {selectedComplaint.message}
                                    </div>
                                </div>

                                {selectedComplaint.response && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Phản hồi trước đó</p>
                                        <div className="p-4 bg-blue-50 rounded-xl text-blue-700">
                                            {typeof selectedComplaint.response === 'object'
                                                ? (selectedComplaint.response as any).content
                                                : selectedComplaint.response}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Response Form */}
                            {selectedComplaint.status !== 'closed' && (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700">
                                        Phản hồi khiếu nại
                                    </label>
                                    <textarea
                                        rows={4}
                                        className="input w-full resize-none"
                                        placeholder="Nhập nội dung phản hồi..."
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                    />
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => setSelectedComplaint(null)}
                                            className="btn-secondary"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleRespond}
                                            disabled={!responseText.trim() || responding}
                                            className="btn-primary"
                                        >
                                            {responding ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Gửi phản hồi
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaintsPage;
