import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Gift, Shield, Zap, Loader2, Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Plan {
    _id: string;
    name: string;
    price: number;
    durationDays: number;
    features?: string[];
    popular?: boolean;
}

const FALLBACK_PARTNER_PLANS: Plan[] = [
    {
        _id: 'standard',
        name: 'Standard',
        price: 1500000,
        durationDays: 30,
        features: [
            'Đăng ký tối đa 5 dịch vụ',
            'Quản lý đặt chỗ cơ bản',
            'Xem thống kê tổng quan',
            'Hỗ trợ qua email',
        ],
    },
    {
        _id: 'premium',
        name: 'Premium',
        price: 2500000,
        durationDays: 30,
        popular: true,
        features: [
            'Không giới hạn dịch vụ đăng ký',
            'Đứng TOP trên kết quả tìm kiếm',
            'Thống kê doanh thu chi tiết',
            'Hỗ trợ trực tiếp 1-1 24/7',
        ],
    },
];

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const role = user?.role || 'user';

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasExistingSub, setHasExistingSub] = useState(false);
    const [activeSub, setActiveSub] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const [plansRes, subRes] = await Promise.allSettled([
                    api.get('/subscriptions/plans'),
                    api.get('/subscriptions/my'),
                ]);

                // Plans
                if (plansRes.status === 'fulfilled' && plansRes.value.data.success) {
                    const all: Plan[] = plansRes.value.data.plans || [];
                    const filtered = all.filter(p => !(p as any).targetRole || (p as any).targetRole === role);
                    setPlans(filtered.length > 0 ? filtered : FALLBACK_PARTNER_PLANS);
                } else {
                    setPlans(FALLBACK_PARTNER_PLANS);
                }

                // Subscription status
                if (subRes.status === 'fulfilled' && subRes.value.data.success) {
                    setActiveSub(subRes.value.data.subscription);
                    setHasExistingSub(true);
                } else {
                    // 404 means no active sub — check if they ever had one
                    try {
                        const histRes = await api.get('/subscriptions/my');
                        setHasExistingSub(!!histRes.data.subscription);
                    } catch {
                        setHasExistingSub(false);
                    }
                }
            } catch {
                setPlans(FALLBACK_PARTNER_PLANS);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [role]);

    const formatPrice = (price: number) =>
        price === 0
            ? 'Miễn phí'
            : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) + '/tháng';

    const handleSelectPlan = (plan: Plan) => {
        if (plan.price === 0) return;
        navigate('/subscription/payment', {
            state: { planId: plan._id, planName: plan.name, planPrice: plan.price },
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    // Partner view
    if (role === 'partner') {
        const isTrialEligible = !hasExistingSub;

        return (
            <div className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-display font-bold text-gray-900 mb-3">
                            Gói đối tác StuGo
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Tiếp cận hàng ngàn sinh viên và quản lý dịch vụ hiệu quả hơn.
                        </p>
                    </div>

                    {/* Trial banner */}
                    {isTrialEligible && (
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 mb-8 text-white flex items-start gap-4">
                            <Gift className="w-8 h-8 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-lg mb-1">Bạn được dùng thử miễn phí 2 tháng!</p>
                                <p className="text-teal-100 text-sm">
                                    Là đối tác mới, bạn nhận ngay 60 ngày trải nghiệm đầy đủ tính năng — không cần thanh toán.
                                    Chọn bất kỳ gói nào bên dưới để kích hoạt.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Active subscription info */}
                    {activeSub && (
                        <div className="bg-white border border-teal-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
                            <Crown className="w-6 h-6 text-teal-600 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">
                                    Gói hiện tại: {activeSub.planId?.name || 'Standard'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Hết hạn: {new Date(activeSub.endDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={`grid gap-6 ${plans.length >= 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-sm mx-auto'}`}>
                        {plans.map((plan) => {
                            const isActive = activeSub?.planId?._id === plan._id || activeSub?.planId === plan._id;
                            const Icon = plan.popular ? Zap : Shield;
                            const displayPrice = isTrialEligible ? 'Miễn phí (2 tháng)' : formatPrice(plan.price);

                            return (
                                <div
                                    key={plan._id}
                                    className={`relative bg-white rounded-2xl p-8 transition-transform hover:-translate-y-1 ${
                                        plan.popular
                                            ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10'
                                            : 'border border-gray-200 shadow-lg'
                                    }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                                            Phổ biến nhất
                                        </div>
                                    )}
                                    <div className="text-center mb-6">
                                        <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 ${plan.popular ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-600'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <div className="text-2xl font-bold text-gray-900">{displayPrice}</div>
                                        {isTrialEligible && (
                                            <p className="text-xs text-gray-400 mt-1">sau đó {formatPrice(plan.price)}</p>
                                        )}
                                    </div>
                                    {plan.features && (
                                        <ul className="space-y-3 mb-6">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    <span className="text-gray-600 text-sm">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isActive}
                                        className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                                            isActive
                                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                : plan.popular
                                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300'
                                        }`}
                                    >
                                        {isActive ? 'Gói hiện tại' : isTrialEligible ? 'Kích hoạt dùng thử' : 'Nâng cấp ngay'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // User view — simple free vs premium
    return (
        <div className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-3">
                        Nâng cấp tài khoản
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Trải nghiệm StuGo trọn vẹn và tiết kiệm hơn mỗi ngày.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {[
                        {
                            _id: 'free',
                            name: 'Sinh viên (Free)',
                            price: 0,
                            features: ['Tìm kiếm và so sánh dịch vụ', 'Đọc đánh giá chân thực', 'Quản lý lịch sử đặt chỗ', 'Phí dịch vụ 5% khi đặt chỗ'],
                        },
                        {
                            _id: 'premium_user',
                            name: 'Premium',
                            price: 39000,
                            popular: true,
                            features: ['Tất cả tính năng Free', 'Miễn phí 100% phí dịch vụ', 'Ưu tiên hỗ trợ 24/7', 'Tích điểm đổi quà (Sắp ra mắt)'],
                        },
                    ].map((plan) => (
                        <div
                            key={plan._id}
                            className={`bg-white rounded-2xl p-8 ${
                                (plan as any).popular
                                    ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10'
                                    : 'border border-gray-200 shadow-lg'
                            }`}
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <div className="text-2xl font-bold text-gray-900">{formatPrice(plan.price)}</div>
                            </div>
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        <span className="text-gray-600 text-sm">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => plan.price > 0 && handleSelectPlan(plan as Plan)}
                                disabled={plan.price === 0}
                                className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                                    plan.price === 0
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                }`}
                            >
                                {plan.price === 0 ? 'Đang sử dụng' : 'Nâng cấp ngay'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
