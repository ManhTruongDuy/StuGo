import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, CreditCard, FileText, Home, Package, Clock, User } from 'lucide-react';
import { getPaymentByOrderCode, checkPaymentStatus } from '../services/payment.service';
import { getBookingById } from '../services/booking.service';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface PaymentInfo {
    id: string;
    bookingId: string;
    orderCode: number;
    amount: number;
    description: string;
    status: 'pending' | 'paid' | 'cancelled';
    createdAt?: string;
    updatedAt?: string;
}

interface BookingInfo {
    id: string;
    serviceName: string;
    serviceType: string;
    date: string;
    timeSlot?: string;
    route?: string;
    roomTypeName?: string;
    quantity: number;
    totalAmount: number;
    depositAmount: number;
    paymentStatus: string;
    status: string;
    customerInfo?: {
        name?: string;
        phone?: string;
        email?: string;
    };
}

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get('orderCode');

    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<PaymentInfo | null>(null);
    const [booking, setBooking] = useState<BookingInfo | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const handlePaymentSuccess = async () => {
            if (!orderCode) {
                toast.error('Mã đơn hàng không hợp lệ');
                navigate('/');
                return;
            }

            // ✅ Restore token từ sessionStorage nếu có (sau khi redirect từ PayOS)
            const sessionToken = sessionStorage.getItem('token');
            const sessionUser = sessionStorage.getItem('user');

            if (sessionToken && !localStorage.getItem('token')) {
                localStorage.setItem('token', sessionToken);
                console.log('✅ Restored token from sessionStorage');
            }
            if (sessionUser && !localStorage.getItem('user')) {
                localStorage.setItem('user', sessionUser);
                console.log('✅ Restored user from sessionStorage');
            }

            // Clear sessionStorage sau khi restore
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

            // Check if already processed
            const processedKey = `payment_processed_${orderCode}`;
            const alreadyProcessed = localStorage.getItem(processedKey);

            if (alreadyProcessed) {
                console.log('⚠️ Payment đã được xử lý, chỉ load dữ liệu');
                await loadPaymentData();
                return;
            }

            try {
                setLoading(true);
                console.log('✅ Processing payment for orderCode:', orderCode);

                // Mark as processed
                localStorage.setItem(processedKey, 'true');

                // Clear pendingOrderCode
                localStorage.removeItem('pendingOrderCode');

                // Call backend to update payment status
                try {
                    const statusData = await checkPaymentStatus(parseInt(orderCode));
                    console.log('✅ Payment status updated:', statusData);

                    if (statusData?.status === 'PAID') {
                        toast.success('Thanh toán thành công!');
                    }
                } catch (statusError) {
                    console.error('❌ Error updating status:', statusError);
                    // Continue to load data anyway
                }

                // Load payment and booking data
                await loadPaymentData();
            } catch (error: any) {
                console.error('❌ Error processing payment:', error);
                await loadPaymentData();
            } finally {
                setLoading(false);
            }
        };

        const loadPaymentData = async () => {
            try {
                const paymentData = await getPaymentByOrderCode(parseInt(orderCode!));
                if (!paymentData) {
                    toast.error('Không tìm thấy thông tin thanh toán');
                    navigate('/');
                    return;
                }
                console.log('Payment data:', paymentData);
                setPayment(paymentData);

                // Extract booking info
                if (paymentData.bookingId) {
                    const bookingInfo: any = typeof paymentData.bookingId === 'object'
                        ? paymentData.bookingId
                        : null;

                    if (bookingInfo) {
                        setBooking({
                            id: bookingInfo._id || bookingInfo.id || paymentData.bookingId,
                            serviceName: bookingInfo.serviceName,
                            serviceType: bookingInfo.serviceType,
                            date: bookingInfo.date,
                            timeSlot: bookingInfo.timeSlot,
                            route: bookingInfo.route,
                            roomTypeName: bookingInfo.roomTypeName,
                            quantity: bookingInfo.quantity,
                            totalAmount: bookingInfo.totalAmount,
                            depositAmount: bookingInfo.depositAmount,
                            paymentStatus: bookingInfo.paymentStatus,
                            status: bookingInfo.status,
                            customerInfo: bookingInfo.customerInfo,
                        });
                    } else {
                        try {
                            const bookingData = await getBookingById(
                                typeof paymentData.bookingId === 'string'
                                    ? paymentData.bookingId
                                    : String(paymentData.bookingId)
                            );
                            if (bookingData) {
                                setBooking(bookingData);
                            }
                        } catch (bookingError) {
                            console.warn('Could not fetch booking:', bookingError);
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error loading payment data:', error);
                toast.error('Không thể tải thông tin thanh toán');
            }
        };

        handlePaymentSuccess();
    }, [orderCode, navigate]);

    const handleRefreshStatus = async () => {
        if (!orderCode) return;

        try {
            setRefreshing(true);
            console.log('🔄 Refreshing payment status...');

            // Clear processed flag
            const processedKey = `payment_processed_${orderCode}`;
            localStorage.removeItem(processedKey);

            const statusData = await checkPaymentStatus(parseInt(orderCode));
            console.log('Refreshed status:', statusData);

            if (statusData?.status === 'PAID') {
                toast.success('Trạng thái đã được cập nhật!');
                localStorage.setItem(processedKey, 'true');

                // Reload data
                const paymentData = await getPaymentByOrderCode(parseInt(orderCode));
                if (paymentData) {
                    setPayment(paymentData);

                    if (paymentData.bookingId && typeof paymentData.bookingId === 'object') {
                        const bookingInfo: any = paymentData.bookingId;
                        setBooking({
                            id: bookingInfo._id || bookingInfo.id,
                            serviceName: bookingInfo.serviceName,
                            serviceType: bookingInfo.serviceType,
                            date: bookingInfo.date,
                            timeSlot: bookingInfo.timeSlot,
                            route: bookingInfo.route,
                            roomTypeName: bookingInfo.roomTypeName,
                            quantity: bookingInfo.quantity,
                            totalAmount: bookingInfo.totalAmount,
                            depositAmount: bookingInfo.depositAmount,
                            paymentStatus: bookingInfo.paymentStatus,
                            status: bookingInfo.status,
                            customerInfo: bookingInfo.customerInfo,
                        });
                    }
                }
            } else {
                toast.error('Thanh toán vẫn chưa được xác nhận');
            }
        } catch (error: any) {
            console.error('Error refreshing:', error);
            toast.error('Không thể làm mới trạng thái');
        } finally {
            setRefreshing(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getServiceTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            accommodation: 'Nhà trọ',
            restaurant: 'Nhà hàng',
            transport: 'Vận chuyển',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!payment || !booking) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Không tìm thấy thông tin thanh toán</p>
                    <button onClick={() => navigate('/')} className="btn-primary">
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-green-50 via-white to-blue-50">
            <div className="max-w-2xl mx-auto px-4">
                {/* Success Icon */}
                <div className="text-center mb-8 animate-scale-in">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle className="w-14 h-14 text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                        Thanh toán thành công!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Cảm ơn bạn đã sử dụng dịch vụ của StuGo
                    </p>
                </div>

                {/* Payment Summary Card */}
                <div className="card p-8 mb-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h2>
                            <p className="text-sm text-gray-500">Mã đơn hàng: #{orderCode}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Số tiền đã thanh toán</span>
                            <span className="text-2xl font-bold text-green-600">
                                {formatPrice(payment.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Trạng thái</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                Đã thanh toán
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600">Thời gian</span>
                            <span className="text-gray-900 font-medium">
                                {payment.updatedAt ? formatDate(payment.updatedAt) : 'Vừa xong'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Booking Details Card */}
                <div className="card p-8 mb-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Chi tiết đặt chỗ</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Dịch vụ</p>
                                <p className="font-semibold text-gray-900">{booking.serviceName}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {getServiceTypeLabel(booking.serviceType)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Ngày</p>
                                <p className="font-semibold text-gray-900">{formatDate(booking.date)}</p>
                                {booking.timeSlot && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Khung giờ: {booking.timeSlot}
                                    </p>
                                )}
                            </div>
                        </div>

                        {booking.route && (
                            <div className="flex items-start gap-4">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Tuyến đường</p>
                                    <p className="font-semibold text-gray-900">{booking.route}</p>
                                </div>
                            </div>
                        )}

                        {booking.roomTypeName && (
                            <div className="flex items-start gap-4">
                                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Loại phòng</p>
                                    <p className="font-semibold text-gray-900">{booking.roomTypeName}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-4">
                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500">Số lượng</p>
                                <p className="font-semibold text-gray-900">{booking.quantity}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Tổng tiền</span>
                                <span className="font-semibold text-gray-900">{formatPrice(booking.totalAmount)}</span>
                            </div>
                            {booking.paymentStatus === 'deposit_paid' && (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Đã thanh toán (cọc)</span>
                                        <span className="text-green-600">{formatPrice(payment.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="text-gray-500">Còn lại</span>
                                        <span className="text-orange-600">
                                            {formatPrice(booking.totalAmount - payment.amount)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                {booking.customerInfo && (
                    <div className="card p-6 mb-6 bg-gray-50">
                        <h3 className="font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
                        <div className="space-y-2 text-sm">
                            {booking.customerInfo.name && (
                                <p>
                                    <span className="text-gray-500">Tên:</span>{' '}
                                    <span className="font-medium text-gray-900">{booking.customerInfo.name}</span>
                                </p>
                            )}
                            {booking.customerInfo.phone && (
                                <p>
                                    <span className="text-gray-500">SĐT:</span>{' '}
                                    <span className="font-medium text-gray-900">{booking.customerInfo.phone}</span>
                                </p>
                            )}
                            {booking.customerInfo.email && (
                                <p>
                                    <span className="text-gray-500">Email:</span>{' '}
                                    <span className="font-medium text-gray-900">{booking.customerInfo.email}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Next Steps */}
                <div className="card p-6 bg-blue-50 border border-blue-200 mb-6">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">Bước tiếp theo</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Email xác nhận đã được gửi đến địa chỉ email của bạn</li>
                                <li>• Vui lòng kiểm tra email để xem chi tiết đặt chỗ</li>
                                {booking.paymentStatus === 'deposit_paid' && (
                                    <li>• Bạn cần thanh toán phần còn lại trước khi sử dụng dịch vụ</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {(booking.paymentStatus === 'pending' || booking.status === 'pending') && (
                        <button
                            onClick={handleRefreshStatus}
                            disabled={refreshing}
                            className="flex-1 btn-outline py-4 flex items-center justify-center gap-2"
                        >
                            {refreshing ? (
                                <>
                                    <LoadingSpinner />
                                    Đang kiểm tra...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Làm mới trạng thái
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/account')}
                        className="flex-1 btn-primary py-4"
                    >
                        Xem lịch sử đặt chỗ
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 btn-outline py-4 flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
