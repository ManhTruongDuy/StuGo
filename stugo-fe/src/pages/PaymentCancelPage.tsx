import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, AlertCircle, RefreshCw, Home, CreditCard, FileText, ArrowLeft } from 'lucide-react';
import { getPaymentByOrderCode } from '../services/payment.service';
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
    seats?: string[];
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

const PaymentCancelPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get('orderCode');

    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<PaymentInfo | null>(null);
    const [booking, setBooking] = useState<BookingInfo | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!orderCode) {
                toast.error('Mã đơn hàng không hợp lệ');
                navigate('/');
                return;
            }

            // Restore token from sessionStorage (same as PaymentSuccessPage)
            const sessionToken = sessionStorage.getItem('token');
            const sessionUser = sessionStorage.getItem('user');
            if (sessionToken && !localStorage.getItem('token')) {
                localStorage.setItem('token', sessionToken);
            }
            if (sessionUser && !localStorage.getItem('user')) {
                localStorage.setItem('user', sessionUser);
            }
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

            try {
                setLoading(true);

                // Fetch payment info (which now includes populated booking)
                const paymentData = await getPaymentByOrderCode(parseInt(orderCode));
                if (!paymentData) {
                    toast.error('Không tìm thấy thông tin thanh toán');
                    navigate('/');
                    return;
                }
                setPayment(paymentData);

                // Extract booking info from payment response (booking is populated)
                if (paymentData.bookingId) {
                    // bookingId might be an object if populated, or just an ID string
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
                            seats: bookingInfo.seats,
                            roomTypeName: bookingInfo.roomTypeName,
                            quantity: bookingInfo.quantity,
                            totalAmount: bookingInfo.totalAmount,
                            depositAmount: bookingInfo.depositAmount,
                            paymentStatus: bookingInfo.paymentStatus,
                            status: bookingInfo.status,
                            customerInfo: bookingInfo.customerInfo,
                        });
                    } else {
                        // Fallback: try to fetch booking separately if not populated
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
                            console.warn('Could not fetch booking details:', bookingError);
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error fetching payment data:', error);
                toast.error(error.message || 'Không thể tải thông tin thanh toán');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderCode, navigate]);

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

    const handleRetryPayment = () => {
        if (booking) {
            // Go back to the service detail page so they can re-book
            const serviceId = typeof (booking as any).serviceId === 'object'
                ? (booking as any).serviceId?._id
                : (booking as any).serviceId;
            if (serviceId) {
                navigate(`/service/${serviceId}`);
            } else {
                navigate('/bookings');
            }
        } else {
            navigate('/bookings');
        }
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
        <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-orange-50 via-white to-red-50">
            <div className="max-w-2xl mx-auto px-4">
                {/* Cancel Icon */}
                <div className="text-center mb-8 animate-scale-in">
                    <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <XCircle className="w-14 h-14 text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                        Thanh toán đã bị hủy
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Đơn hàng của bạn chưa được thanh toán
                    </p>
                </div>

                {/* Warning Card */}
                <div className="card p-6 mb-6 bg-orange-50 border border-orange-200 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-orange-900 mb-2">Lưu ý quan trọng</h3>
                            <ul className="text-sm text-orange-800 space-y-1">
                                <li>• Đặt chỗ của bạn vẫn được giữ trong thời gian ngắn</li>
                                <li>• Vui lòng thanh toán lại để xác nhận đặt chỗ</li>
                                <li>• Nếu không thanh toán, đặt chỗ sẽ tự động bị hủy sau một thời gian</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Payment Summary Card */}
                <div className="card p-8 mb-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h2>
                            <p className="text-sm text-gray-500">Mã đơn hàng: #{orderCode}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Số tiền</span>
                            <span className="text-xl font-bold text-gray-900">
                                {formatPrice(payment.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Trạng thái</span>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                Đã hủy
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

                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Dịch vụ</p>
                            <p className="font-semibold text-gray-900">{booking.serviceName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ngày</p>
                            <p className="font-semibold text-gray-900">{formatDate(booking.date)}</p>
                            {booking.timeSlot && (
                                <p className="text-sm text-gray-500 mt-1">Khung giờ: {booking.timeSlot}</p>
                            )}
                        </div>
                        {booking.route && (
                            <div>
                                <p className="text-sm text-gray-500">Tuyến đường</p>
                                <p className="font-semibold text-gray-900">{booking.route}</p>
                            </div>
                        )}
                        {booking.roomTypeName && (
                            <div>
                                <p className="text-sm text-gray-500">Loại phòng</p>
                                <p className="font-semibold text-gray-900">{booking.roomTypeName}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-500">Số lượng</p>
                            <p className="font-semibold text-gray-900">{booking.quantity}</p>
                        </div>
                        {booking.seats && booking.seats.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500">Ghế đã chọn</p>
                                <p className="font-semibold text-gray-900">{booking.seats.join(', ')}</p>
                            </div>
                        )}
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tổng tiền</span>
                                <span className="font-semibold text-gray-900">{formatPrice(booking.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={handleRetryPayment}
                        className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Thanh toán lại
                    </button>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex-1 btn-outline py-4 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại
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

                {/* Help Section */}
                <div className="mt-8 card p-6 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3">Cần hỗ trợ?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Nếu bạn gặp vấn đề trong quá trình thanh toán, vui lòng liên hệ với chúng tôi:
                    </p>
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="text-gray-500">Email:</span>{' '}
                            <a href="mailto:support@stugo.vn" className="text-primary-600 hover:underline">
                                support@stugo.vn
                            </a>
                        </p>
                        <p>
                            <span className="text-gray-500">Hotline:</span>{' '}
                            <a href="tel:19001234" className="text-primary-600 hover:underline">
                                1900 1234
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancelPage;
