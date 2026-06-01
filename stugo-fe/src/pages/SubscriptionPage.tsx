import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Check, Gift, Shield, Loader2, Crown,
    Bus, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Plan {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    durationDays: number;
    features?: string[];
    popular?: boolean;
    badge?: string;
    badgeColor?: string;
    icon?: any;
    description?: string;
    mvpOffer?: string;
}

// ─── User plans (MVP) ────────────────────────────────────────────────────────
const USER_PLANS: Plan[] = [
    {
        _id: 'free',
        name: 'Freemium',
        price: 0,
        durationDays: 30,
        icon: Shield,
        description: 'Đủ dùng cho sinh viên mới bắt đầu',
        features: [
            'Tìm kiếm tuyến xe',
            'So sánh giá vé & lịch trình',
            'Xem đánh giá nhà xe',
            'Đặt vé cơ bản',
            'Lưu lịch sử chuyến đi',
        ],
    },
    {
        _id: 'premium_user',
        name: 'StuGo Student Premium',
        price: 49000,
        durationDays: 30,
        popular: true,
        icon: Crown,
        badge: 'Phổ biến nhất',
        badgeColor: 'from-primary-500 to-secondary-500',
        description: 'Trải nghiệm đầy đủ dành riêng cho sinh viên',
        features: [
            'Tất cả tính năng Free',
            'Chọn ghế ngồi',
            'Ưu tiên giữ chỗ giờ cao điểm',
            'Đặt lại chuyến quen chỉ với 1 chạm',
            'Thông báo vé giảm giá / flash sale',
            'Giữ chỗ dịp lễ/Tết',
            'Ưu đãi riêng cho sinh viên',
            'Tích điểm & hoàn xu',
            'Gợi ý chuyến xe thông minh bằng AI',
            'Ưu đãi đối tác (quán ăn, homestay, cafe...)',
            'Hỗ trợ khách hàng ưu tiên 24/7',
        ],
    },
];

// ─── Partner plans (MVP) ─────────────────────────────────────────────────────
const PARTNER_PLANS: Plan[] = [
    {
        _id: 'business_basic',
        name: 'Business Basic',
        price: 0,
        originalPrice: 299000,
        durationDays: 60,
        icon: Bus,
        badge: 'FREE Trial 2 tháng',
        badgeColor: 'from-teal-500 to-emerald-500',
        mvpOffer: 'Miễn phí hoàn toàn trong 2 tháng đầu',
        description: 'Dành cho nhà xe mới bắt đầu trên StuGo',
        features: [
            'Đăng tuyến xe trên StuGo',
            'Quản lý đặt vé',
            'Quản lý ghế trống',
            'Dashboard quản lý khách hàng',
            'Theo dõi lịch trình chuyến xe',
            'Hỗ trợ kỹ thuật cơ bản',
        ],
    },
    {
        _id: 'business_premium',
        name: 'Business Premium',
        price: 479000,
        originalPrice: 599000,
        durationDays: 30,
        popular: true,
        icon: TrendingUp,
        badge: 'Giảm 20%',
        badgeColor: 'from-orange-500 to-red-500',
        mvpOffer: 'Giảm 20% — chỉ còn 479.000đ/tháng',
        description: 'Tối ưu doanh thu & tăng trưởng nhanh',
        features: [
            'Tất cả tính năng Business Basic',
            'Ưu tiên hiển thị trên hệ thống',
            'Badge "Đối tác xác minh"',
            'Thống kê hành vi khách hàng',
            'Báo cáo tuyến xe tiềm năng',
            'Hỗ trợ chiến dịch marketing',
            'Gợi ý nhu cầu tuyến xe bằng AI',
            'Ưu tiên quảng bá trên Fanpage/TikTok StuGo',
        ],
    },
];

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const role = user?.role || 'user';

    const [loading, setLoading] = useState(true);
    const [hasExistingSub, setHasExistingSub] = useState(false);
    const [activeSub, setActiveSub] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const subRes = await api.get('/subscriptions/my').catch(() => null);
                if (subRes?.data?.success) {
                    setActiveSub(subRes.data.subscription);
                    setHasExistingSub(true);
                }
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

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

    const plans = role === 'partner' ? PARTNER_PLANS : USER_PLANS;
    const isTrialEligible = role === 'partner' && !hasExistingSub;

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Hero / Cover ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 pt-24 pb-20">
                {/* Background image — replace src with your actual cover image */}
                <img
                    src="/logo.jpg"
                    alt="StuGo cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
                />
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
                    <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 leading-tight">
                        {role === 'partner' ? 'Gói đối tác StuGo' : 'Chọn gói phù hợp với bạn'}
                    </h1>
                    <p className="text-primary-100 text-lg max-w-2xl mx-auto">
                        {role === 'partner'
                            ? 'Tiếp cận hàng ngàn sinh viên. Quản lý nhà xe hiệu quả hơn mỗi ngày.'
                            : 'Đặt vé xe dễ dàng, tiết kiệm và thông minh hơn với StuGo.'}
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-8 pb-20">

                {/* ── Trial banner (partner only) ───────────────────────────── */}
                {isTrialEligible && (
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 mb-8 text-white flex items-start gap-4 shadow-lg">
                        <Gift className="w-8 h-8 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-lg mb-1">Dùng thử miễn phí 2 tháng dành cho đối tác mới!</p>
                            <p className="text-teal-100 text-sm">
                                Kích hoạt ngay hôm nay — không cần thanh toán, không cần thẻ tín dụng.
                                Trải nghiệm đầy đủ tính năng trong 60 ngày đầu tiên.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Active subscription info ──────────────────────────────── */}
                {activeSub && (
                    <div className="bg-white border border-teal-200 rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-sm">
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

                {/* ── Plan cards ────────────────────────────────────────────── */}
                <div className={`grid gap-6 mb-16 mt-6 ${plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-3xl mx-auto'}`}>
                    {plans.map((plan) => {
                        const Icon = plan.icon || Shield;
                        const isActive = activeSub?.planId?._id === plan._id || activeSub?.planId === plan._id;
                        const isFree = plan.price === 0 && role === 'user';

                        return (
                            <div
                                key={plan._id}
                                className={`relative bg-white rounded-2xl flex flex-col transition-transform hover:-translate-y-1 ${plan.badge ? 'pt-10 px-7 pb-7' : 'p-7'} ${
                                    plan.popular
                                        ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10'
                                        : 'border border-gray-200 shadow-lg'
                                }`}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${plan.badgeColor} text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap`}>
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Header */}
                                <div className="text-center mb-5">
                                    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${plan.popular ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-600'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                                    {plan.description && (
                                        <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
                                    )}
                                    {/* Price */}
                                    <div className="flex items-end justify-center gap-2">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {role === 'partner' && plan._id === 'business_basic' && isTrialEligible
                                                ? 'Miễn phí'
                                                : formatPrice(plan.price)}
                                        </span>
                                    </div>
                                    {plan.originalPrice && plan.originalPrice !== plan.price && (
                                        <p className="text-xs text-gray-400 line-through mt-0.5">
                                            {formatPrice(plan.originalPrice)}
                                        </p>
                                    )}
                                    {plan.mvpOffer && (
                                        <p className="text-xs font-medium text-teal-600 mt-1 bg-teal-50 px-2 py-1 rounded-lg">
                                            🎁 {plan.mvpOffer}
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                {plan.features && (
                                    <ul className="space-y-2.5 mb-6 flex-1">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <div className="mt-0.5 w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-2.5 h-2.5 text-green-600" />
                                                </div>
                                                <span className="text-gray-600 text-sm">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* CTA */}
                                <button
                                    onClick={() => !isFree && !isActive && handleSelectPlan(plan)}
                                    disabled={isFree || isActive}
                                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors text-sm ${
                                        isActive
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : isFree
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : plan.popular
                                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                                            : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-primary-300 hover:text-primary-600'
                                    }`}
                                >
                                    {isActive
                                        ? 'Gói hiện tại'
                                        : isFree
                                        ? 'Đang sử dụng'
                                        : role === 'partner' && plan._id === 'business_basic' && isTrialEligible
                                        ? 'Kích hoạt dùng thử'
                                        : 'Đăng ký ngay'}
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default SubscriptionPage;
