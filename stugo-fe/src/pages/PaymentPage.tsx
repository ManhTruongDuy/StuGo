import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard,
    QrCode,
    Building2,
    Wallet,
    Check,
    ChevronLeft,
    Copy,
    Clock,
    Shield,
    AlertCircle,
} from 'lucide-react';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

type PaymentMethod = 'vietqr' | 'bank' | 'ewallet';

const PaymentPage = () => {
    const navigate = useNavigate();
    const { currentBooking, resetBooking, setHasInsurance } = useBookingStore();
    const { user, isPro } = useAuthStore();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [bookingCode, setBookingCode] = useState('');
    
    const isPremiumUser = isPro();
    const serviceFeePercent = isPremiumUser ? 0 : 0.05;
    
    // Total calculation overrides store total to include service fee
    const subTotal = currentBooking.service ? currentBooking.service.priceRange.min * currentBooking.quantity : 0;
    const insuranceFee = currentBooking.hasInsurance ? 20000 * currentBooking.quantity : 0;
    const serviceFee = subTotal * serviceFeePercent;
    const finalTotalAmount = subTotal + insuranceFee + serviceFee;
    const finalDepositAmount = finalTotalAmount;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const bankInfo = {
        bankName: 'VietComBank',
        accountNumber: '1234567890',
        accountHolder: 'CONG TY STUGO',
        content: `STUGO ${currentBooking.date} ${user?.id || 'GUEST'}`,
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}`);
    };

    const handlePayment = async () => {
        setIsProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setBookingCode(`#STG${Date.now().toString().slice(-8)}`);
        setIsProcessing(false);
        setIsComplete(true);

        toast.success('Thanh toán thành công!');
    };

    const handleFinish = () => {
        resetBooking();
        navigate('/bookings');
    };

    if (!currentBooking.service) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Không có thông tin đặt chỗ
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Vui lòng chọn dịch vụ và đặt chỗ trước khi thanh toán
                    </p>
                    <button onClick={() => navigate('/services')} className="btn-primary">
                        Xem dịch vụ
                    </button>
                </div>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="max-w-lg mx-auto px-4">
                    <div className="card p-8 text-center animate-scale-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                            Thanh toán thành công!
                        </h1>
                        <p className="text-gray-500 mb-8">
                            Đặt chỗ của bạn đã được xác nhận. Chúng tôi sẽ gửi email xác nhận
                            trong vài phút.
                        </p>

                        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                Thông tin đặt chỗ
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Mã đặt chỗ</span>
                                    <span className="font-medium text-gray-900">
                                        {bookingCode}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Dịch vụ</span>
                                    <span className="font-medium text-gray-900">
                                        {currentBooking.service.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ngày</span>
                                    <span className="font-medium text-gray-900">
                                        {currentBooking.date}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Khung giờ</span>
                                    <span className="font-medium text-gray-900">
                                        {currentBooking.timeSlot}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Đã thanh toán</span>
                                    <span className="font-medium text-green-600">
                                        {formatPrice(finalDepositAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleFinish}
                                className="flex-1 btn-primary"
                            >
                                Xem lịch sử đặt chỗ
                            </button>
                            <button
                                onClick={() => {
                                    resetBooking();
                                    navigate('/');
                                }}
                                className="flex-1 btn-outline"
                            >
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Quay lại
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Payment Methods */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Chọn phương thức thanh toán
                            </h2>

                            <div className="space-y-4">
                                {/* VietQR */}
                                <button
                                    onClick={() => setPaymentMethod('vietqr')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'vietqr'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'vietqr'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        <QrCode className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">VietQR</p>
                                        <p className="text-sm text-gray-500">
                                            Quét mã QR để thanh toán nhanh
                                        </p>
                                    </div>
                                    {paymentMethod === 'vietqr' && (
                                        <Check className="w-6 h-6 text-primary-500 ml-auto" />
                                    )}
                                </button>

                                {/* Bank Transfer */}
                                <button
                                    onClick={() => setPaymentMethod('bank')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'bank'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'bank'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">
                                            Chuyển khoản ngân hàng
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Chuyển khoản thủ công qua Internet Banking
                                        </p>
                                    </div>
                                    {paymentMethod === 'bank' && (
                                        <Check className="w-6 h-6 text-primary-500 ml-auto" />
                                    )}
                                </button>

                                {/* E-Wallet */}
                                <button
                                    onClick={() => setPaymentMethod('ewallet')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'ewallet'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'ewallet'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">Ví điện tử</p>
                                        <p className="text-sm text-gray-500">
                                            MoMo, ZaloPay, VNPay...
                                        </p>
                                    </div>
                                    {paymentMethod === 'ewallet' && (
                                        <Check className="w-6 h-6 text-primary-500 ml-auto" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="card p-6">
                            {paymentMethod === 'vietqr' && (
                                <div className="text-center">
                                    <h3 className="font-semibold text-gray-900 mb-4">
                                        Quét mã QR để thanh toán
                                    </h3>
                                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 inline-block mb-4">
                                        {/* Placeholder QR Code */}
                                        <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                            <QrCode className="w-24 h-24 text-gray-400" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-xl">
                                        <Clock className="w-5 h-5" />
                                        <span>Mã QR có hiệu lực trong 15 phút</span>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'bank' && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-4">
                                        Thông tin chuyển khoản
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="text-sm text-gray-500">Ngân hàng</p>
                                                <p className="font-semibold text-gray-900">
                                                    {bankInfo.bankName}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleCopy(bankInfo.bankName, 'tên ngân hàng')
                                                }
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-5 h-5 text-gray-500" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="text-sm text-gray-500">Số tài khoản</p>
                                                <p className="font-semibold text-gray-900">
                                                    {bankInfo.accountNumber}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleCopy(bankInfo.accountNumber, 'số tài khoản')
                                                }
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-5 h-5 text-gray-500" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="text-sm text-gray-500">Chủ tài khoản</p>
                                                <p className="font-semibold text-gray-900">
                                                    {bankInfo.accountHolder}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleCopy(bankInfo.accountHolder, 'tên chủ tài khoản')
                                                }
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-5 h-5 text-gray-500" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200">
                                            <div>
                                                <p className="text-sm text-primary-600">
                                                    Nội dung chuyển khoản
                                                </p>
                                                <p className="font-semibold text-primary-700">
                                                    {bankInfo.content}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleCopy(bankInfo.content, 'nội dung chuyển khoản')
                                                }
                                                className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-5 h-5 text-primary-600" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm">
                                        <p>
                                            ⚠️ Vui lòng nhập đúng nội dung chuyển khoản để hệ thống tự
                                            động xác nhận thanh toán.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'ewallet' && (
                                <div className="text-center py-8">
                                    <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        Tính năng đang được phát triển. Vui lòng chọn phương thức
                                        thanh toán khác.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-6 sticky top-24">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                Tóm tắt đặt chỗ
                            </h3>

                            {/* Service Info */}
                            <div className="flex gap-4 mb-6">
                                <img
                                    src={currentBooking.service.images[0]}
                                    alt={currentBooking.service.name}
                                    className="w-20 h-20 rounded-xl object-cover"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 line-clamp-2">
                                        {currentBooking.service.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {currentBooking.date} • {currentBooking.timeSlot}
                                    </p>
                                </div>
                            </div>

                            {/* Insurance Checkbox */}
                            {currentBooking.service.type === 'transport' && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={currentBooking.hasInsurance}
                                            onChange={(e) => setHasInsurance(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Bảo hiểm chuyến đi (+20.000đ/vé)
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Bảo vệ bạn trong suốt hành trình di chuyển.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Price Breakdown */}
                            <div className="space-y-3 py-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        Tạm tính
                                    </span>
                                    <span className="text-gray-900">
                                        {formatPrice(subTotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-1">
                                        Phí dịch vụ 
                                        {isPremiumUser && (
                                            <span className="text-xs text-primary-600 font-medium px-2 py-0.5 bg-primary-50 rounded-full ml-2">
                                                Miễn phí (Premium)
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-gray-900">
                                        {formatPrice(serviceFee)}
                                    </span>
                                </div>
                                {currentBooking.hasInsurance && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            Bảo hiểm chuyến đi
                                        </span>
                                        <span className="text-gray-900">
                                            {formatPrice(insuranceFee)}
                                        </span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-100 my-2"></div>
                            </div>

                            <div className="flex justify-between py-4 border-t border-gray-100">
                                <span className="font-semibold text-gray-900">
                                    Thanh toán ngay
                                </span>
                                <span className="text-xl font-bold text-primary-600">
                                    {formatPrice(finalDepositAmount)}
                                </span>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || paymentMethod === 'ewallet'}
                                className="w-full btn-primary py-4 mb-4"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang xử lý...
                                    </span>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        Xác nhận thanh toán
                                    </>
                                )}
                            </button>

                            {/* Security Note */}
                            <div className="flex items-start gap-3 text-sm text-gray-500">
                                <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <p>
                                    Thanh toán của bạn được bảo mật và mã hóa bằng SSL 256-bit
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
