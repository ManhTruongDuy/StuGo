import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { XCircle, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface RefundRequest {
  _id: string;
  bookingId: {
    _id: string;
    bookingCode: string;
    serviceName: string;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  amountPaid: number;
  refundPercentage: number;
  refundAmount: number;
  departureDate: string;
  status: 'pending' | 'approved' | 'rejected';
  userReason: string;
  adminReason?: string;
  bankInfo: {
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

const AdminRefundsPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [adminReason, setAdminReason] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  
  const [data, setData] = useState<{ data: RefundRequest[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchRefunds = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/refunds?page=${page}&limit=20${
          statusFilter !== 'all' ? `&status=${statusFilter}` : ''
        }`,
        { withCredentials: true }
      );
      setData(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách yêu cầu hoàn tiền');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter, page]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewAction === 'reject' && !adminReason.trim()) {
      toast.error('Vui lòng nhập lí do từ chối');
      return;
    }
    if (selectedRefund) {
      setIsReviewing(true);
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/refunds/${selectedRefund._id}/review`,
          { action: reviewAction, reason: adminReason },
          { withCredentials: true }
        );
        toast.success(response.data.message);
        setIsReviewModalOpen(false);
        setSelectedRefund(null);
        setAdminReason('');
        fetchRefunds();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      } finally {
        setIsReviewing(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Đã duyệt</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Đã từ chối</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Chờ duyệt</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yêu cầu hoàn tiền</h1>
          <p className="text-gray-500 mt-1">Quản lý các yêu cầu hoàn tiền từ người dùng</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-accent-500 flex-1 sm:flex-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã vé / Dịch vụ</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người yêu cầu</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày khởi hành</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tiền hoàn</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent-500" />
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không có yêu cầu hoàn tiền nào
                  </td>
                </tr>
              ) : (
                data?.data?.map((refund: RefundRequest) => (
                  <tr key={refund._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{refund.bookingId?.bookingCode || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{refund.bookingId?.serviceName || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{refund.userId?.fullName}</p>
                      <p className="text-sm text-gray-500">{refund.userId?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {format(new Date(refund.departureDate), 'dd/MM/yyyy HH:mm')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tạo lúc: {format(new Date(refund.createdAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-accent-600">{refund.refundAmount.toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-gray-500">({refund.refundPercentage}% của {refund.amountPaid.toLocaleString('vi-VN')}đ)</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(refund.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRefund(refund);
                          setIsReviewModalOpen(true);
                          setAdminReason(refund.adminReason || '');
                          setReviewAction('approve');
                        }}
                        className="p-2 text-gray-400 hover:text-accent-500 hover:bg-accent-50 rounded-lg transition-colors"
                        title="Xem chi tiết & Xử lý"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Xử lý yêu cầu hoàn tiền
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm">
                  <p className="font-semibold mb-2">Thông tin tài khoản nhận tiền:</p>
                  <p><strong>Ngân hàng:</strong> {selectedRefund.bankInfo.bankName}</p>
                  <p><strong>Số tài khoản:</strong> {selectedRefund.bankInfo.bankAccount}</p>
                  <p><strong>Tên chủ TK:</strong> {selectedRefund.bankInfo.bankAccountName}</p>
                  <div className="mt-2 border-t border-blue-200 pt-2">
                    <p><strong>Số tiền cần hoàn:</strong> <span className="font-bold text-lg">{selectedRefund.refundAmount.toLocaleString('vi-VN')}đ</span> ({selectedRefund.refundPercentage}%)</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Lí do hủy vé từ khách hàng:</p>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">{selectedRefund.userReason || 'Không có lí do'}</p>
                </div>
              </div>

              {selectedRefund.status === 'pending' ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hành động</label>
                    <div className="flex gap-4">
                      <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer flex-1 transition-colors ${reviewAction === 'approve' ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="reviewAction"
                          checked={reviewAction === 'approve'}
                          onChange={() => setReviewAction('approve')}
                          className="w-4 h-4 text-accent-600 focus:ring-accent-500"
                        />
                        <span className="font-medium">Đã chuyển khoản (Duyệt)</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer flex-1 transition-colors ${reviewAction === 'reject' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="reviewAction"
                          checked={reviewAction === 'reject'}
                          onChange={() => setReviewAction('reject')}
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="font-medium">Từ chối hoàn</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú / Lí do (Gửi cho khách hàng) {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={adminReason}
                      onChange={(e) => setAdminReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-accent-500 resize-none h-24"
                      placeholder={reviewAction === 'approve' ? 'Ví dụ: Đã chuyển khoản qua VPBank mã giao dịch XXXXXX' : 'Lí do từ chối...'}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isReviewing}
                      className="px-6 py-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-medium rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {isReviewing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        'Xác nhận'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Trạng thái: {getStatusBadge(selectedRefund.status)}</p>
                  {selectedRefund.adminReason && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-500 mb-1">Ghi chú của Admin:</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg text-gray-700">{selectedRefund.adminReason}</p>
                    </div>
                  )}
                  {selectedRefund.resolvedAt && (
                    <p className="text-sm text-gray-500 mt-3">Thời gian xử lý: {format(new Date(selectedRefund.resolvedAt), 'dd/MM/yyyy HH:mm')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefundsPage;
