import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Check,
    ChevronLeft,
    Shield,
    AlertCircle,
    Loader2,
    Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const SubscriptionPaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, updateUser } = useAuthStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [planDetails, setPlanDetails] = useState<{ name: string; price: number; duration: string } | null>(null);

    // planId passed via navigation state OR from PayOS return URL
    const planId = location.state?.planId || new URLSearchParams(location.search).get('planId');
    const returnStatus = new URLSearchParams(location.search).get('status');
    const returnOrderCode = new URLSearchParams(location.search).get('orderCode');

    useEffect(() => {
        if (!planId) {
            toast.error('Vui lòng chọn một gói dịch vụ trước');
            navigate('/subscription');
            return;
        }

        if (location.state?.planName && location.state?.planPrice !== undefined) {
            setPlanDetails({ name: location.state.planName, price: location.state.planPrice, duration: location.state.duration || '1 tháng' });
        } else {
            // Fallback: fetch plan details from backend
            api.get('/subscriptions/plans').then(res => {
                const plan = res.data.plans?.find((p: any) => p._id === planId);
                if (plan) {
                    const isTrial = user?.role === 'partner' && plan.code === 'business_basic';
                    setPlanDetails({
                        name: plan.name,
                        price: isTrial ? 0 : plan.price,
                        duration: isTrial ? '4 tuần' : '1 tháng'
                    });
                }
            }).catch(() => {});
        }
    }, [planId, navigate]);

    // Handle PayOS return
    useEffect(() => {
        if (returnStatus === 'success' && returnOrderCode && planId) {
            handleActivateAfterPayment();
        } else if (returnStatus === 'cancel') {
            toast.error('Thanh toán đã bị hủy');
        }
    }, [returnStatus]);

    const handleActivateAfterPayment = async () => {
        setIsProcessing(true);
        try {
            const res = await api.post('/subscriptions/activate', { planId, orderCode: returnOrderCode });
            if (res.data.success) {
                const planCode = res.data.subscription?.planId?.code || 'premium_user';
                updateUser({ plan: planCode } as any);
                setIsComplete(true);
                toast.success('Kích hoạt gói thành công!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể kích hoạt gói');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (!planId) return;
        setIsProcessing(true);
        try {
            const res = await api.post('/subscriptions/payment', { planId });
            if (res.data.success) {
                if (res.data.isTrial) {
                    // Free trial — activated immediately by backend
                    const planCode = res.data.subscription?.planId?.code || 'business_basic';
                    updateUser({ plan: planCode } as any);
                    setIsComplete(true);
                    toast.success(res.data.message || 'Kích hoạt dùng thử thành công!');
                } else if (res.data.checkoutUrl) {
                    // Redirect to PayOS checkout
                    window.location.href = res.data.checkoutUrl;
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể xử lý thanh toán. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    if (!planDetails) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500 mr-2" />
                <span>Không tìm thấy thông tin gói</span>
            </div>
        );
    }

    if (isProcessing && returnStatus === 'success') {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-3" />
                <span className="text-gray-600">Đang kích hoạt gói của bạn...</span>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="min-h-screen pt-24 pb-16 bg-gray-50 flex items-center justify-center">
                <div className="max-w-lg mx-auto px-4 w-full">
                    <div className="card p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                            Kích hoạt thành công!
                        </h1>
                        <p className="text-gray-500 mb-8">
                            Tài khoản đã được nâng cấp lên gói <span className="font-semibold text-primary-600">{planDetails.name}</span>.
                        </p>
                        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left space-y-2">
                            <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-500">Gói dịch vụ</span>
                                <span className="font-medium">{planDetails.name}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">Thời hạn</span>
                                <span className="font-medium">{planDetails.duration}</span>
                            </div>
                        </div>
                        <button onClick={() => navigate('/account')} className="w-full btn-primary">
                            Đến trang tài khoản
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="max-w-lg mx-auto px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                    <ChevronLeft className="w-5 h-5" />
                    Quay lại
                </button>

                <div className="card p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-7 h-7 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-gray-900">
                            Nâng cấp gói {planDetails.name}
                        </h1>
                        <p className="text-gray-500 mt-2">Xác nhận để tiếp tục thanh toán</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Gói dịch vụ</span>
                            <span className="font-medium">{planDetails.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Thời hạn</span>
                            <span className="font-medium">{planDetails.duration}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-3">
                            <span className="font-semibold text-gray-900">Tổng cộng</span>
                            <span className="text-xl font-bold text-primary-600">
                                {planDetails.price === 0 ? (user?.role === 'partner' ? 'Dùng thử' : 'Miễn phí') : formatPrice(planDetails.price)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full btn-primary py-4 mb-4"
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang xử lý...
                            </span>
                        ) : planDetails.price === 0 ? (
                            user?.role === 'partner' ? 'Kích hoạt dùng thử' : 'Kích hoạt miễn phí'
                        ) : (
                            'Thanh toán qua PayOS'
                        )}
                    </button>

                    <div className="flex items-start gap-3 text-sm text-gray-500">
                        <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p>Thanh toán được bảo mật và mã hóa bằng SSL 256-bit</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPaymentPage;
