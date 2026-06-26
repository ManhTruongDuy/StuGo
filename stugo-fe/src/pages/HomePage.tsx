import { Link, useNavigate } from 'react-router-dom';
import {
    Bus,
    Home,
    UtensilsCrossed,
    ArrowRight,
    Star,
    MapPin,
    Shield,
    Zap,
    Heart,
    TrendingUp,
    CheckCircle,
    Search,
    Crown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ServiceCard from '../components/ui/ServiceCard';
import { getPopularServices } from '../services';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Service } from '../types';
import { useAuthStore } from '../store/authStore';

// Remove stats array

const HomePage = () => {
    const navigate = useNavigate();
    const { user, isPro: checkIsPro } = useAuthStore();
    const isProUser = checkIsPro();
    const [popularServices, setPopularServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pricingTab, setPricingTab] = useState<'user' | 'partner'>('user');

    const getPlanBtnProps = (price: number) => {
        if (!user) {
            return {
                text: price === 0 ? 'Bắt đầu miễn phí' : 'Đăng ký ngay',
                className: price === 0 
                    ? 'border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-gray-50' 
                    : 'bg-primary-500 text-white hover:bg-primary-600',
                to: '/subscription'
            };
        }

        if (price === 0) {
            if (isProUser) {
                return {
                    text: 'Gói cơ bản',
                    className: 'border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed pointer-events-none',
                    to: '#'
                };
            } else {
                return {
                    text: 'Gói hiện tại của bạn',
                    className: 'border-2 border-primary-200 text-primary-600 bg-primary-50/50 cursor-not-allowed pointer-events-none font-semibold',
                    to: '#'
                };
            }
        } else {
            if (isProUser) {
                return {
                    text: 'Đang hoạt động ✨',
                    className: 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.01] font-semibold border-none',
                    to: '/subscription'
                };
            } else {
                return {
                    text: 'Nâng cấp ngay',
                    className: 'bg-primary-500 text-white hover:bg-primary-600 font-semibold shadow-md shadow-primary-500/10',
                    to: '/subscription'
                };
            }
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/services');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCategoryClick = (type: string) => {
        navigate(`/services?type=${type}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const services = await getPopularServices(8); // Fetch 8 popular services
                setPopularServices(services);
            } catch (err) {
                console.error('Error fetching popular services:', err);
                setError('Không thể tải dữ liệu dịch vụ');
                setPopularServices([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchServices();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920')] bg-cover bg-center opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-1/4 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float hidden sm:block"></div>
                <div className="absolute bottom-1/4 right-20 w-32 h-32 bg-secondary-400/20 rounded-full blur-xl animate-float hidden sm:block" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-accent-400/20 rounded-full blur-xl animate-float hidden sm:block" style={{ animationDelay: '2s' }}></div>

                {/* Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-8">
                    <div className="animate-fade-in">
                        {user && isProUser ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-6 shadow-lg shadow-yellow-500/20 transition-all duration-300 hover:scale-105 cursor-default hover:animate-pulse border border-yellow-300/30">
                                <Crown className="w-4 h-4 text-white" />
                                Thành viên Premium - Chào mừng {user.fullName}!
                            </span>
                        ) : user ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                                <Zap className="w-4 h-4 text-yellow-300" />
                                Chào mừng trở lại, {user.fullName}!
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                                <Zap className="w-4 h-4 text-yellow-300" />
                                Nền tảng #1 cho sinh viên
                            </span>
                        )}

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight">
                            Kết nối sinh viên với
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300">
                                mọi dịch vụ cần thiết
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
                            Tìm kiếm nhà xe, nhà trọ và quán ăn phù hợp một cách nhanh chóng.
                            Đặt chỗ trực tiếp, so sánh giá cả và đọc đánh giá từ sinh viên
                            khác.
                        </p>

                        {/* Search Box */}
                        <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-2 mb-12">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm nhà xe, nhà trọ, quán ăn..."
                                        className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <button type="submit" className="btn bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 shadow-lg py-4 px-8">
                                    Tìm kiếm
                                </button>
                            </div>
                        </form>

        {/* Service Categories */}
                        <div className="flex flex-wrap justify-center gap-3 px-4">
                            <button
                                onClick={() => handleCategoryClick('transport')}
                                className="group flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Bus className="w-5 h-5 text-blue-300" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-white text-sm">Nhà xe</p>
                                    <p className="text-xs text-white/60">120+ nhà xe</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleCategoryClick('accommodation')}
                                className="group flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Home className="w-5 h-5 text-purple-300" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-white text-sm">Nhà trọ</p>
                                    <p className="text-xs text-white/60">500+ phòng trọ</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleCategoryClick('restaurant')}
                                className="group flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <UtensilsCrossed className="w-5 h-5 text-orange-300" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-white text-sm">Quán ăn</p>
                                    <p className="text-xs text-white/60">800+ quán ăn</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                {/* <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-8 h-14 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                        <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse"></div>
                    </div>
                </div> */}
            </section>

            {/* Stats Section */}
            <section className="relative -mt-20 z-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
                        <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto lg:max-w-none lg:grid-cols-2">
                            {/* Dynamic stats based on popular services */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 mb-4">
                                    <Star className="w-7 h-7 text-primary-600" />
                                </div>
                                <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                                    {popularServices.length > 0
                                        ? (popularServices.reduce((acc, s) => acc + (s.rating || 0), 0) / popularServices.length).toFixed(1)
                                        : '0.0'}
                                </p>
                                <p className="text-gray-500 text-sm">Đánh giá trung bình</p>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 mb-4">
                                    <TrendingUp className="w-7 h-7 text-primary-600" />
                                </div>
                                <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                                    {popularServices.length > 0 ? '98%' : '0%'}
                                </p>
                                <p className="text-gray-500 text-sm">Khách hàng hài lòng</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-600 text-sm font-medium mb-4">
                            <Shield className="w-4 h-4" />
                            Tại sao chọn StuGo
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
                            Trải nghiệm tốt nhất cho sinh viên
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            StuGo mang đến giải pháp toàn diện giúp sinh viên tiết kiệm thời
                            gian và chi phí khi tìm kiếm các dịch vụ thiết yếu.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: 'Đặt chỗ nhanh chóng',
                                description:
                                    'Chỉ cần vài bước đơn giản để đặt chỗ trực tuyến, không cần gọi điện.',
                                color: 'from-yellow-400 to-orange-500',
                            },
                            {
                                icon: Shield,
                                title: 'An toàn & Uy tín',
                                description:
                                    'Tất cả đối tác đều được xác minh, đảm bảo chất lượng dịch vụ.',
                                color: 'from-green-400 to-emerald-500',
                            },
                            {
                                icon: Star,
                                title: 'Đánh giá thực',
                                description:
                                    'Đọc đánh giá từ sinh viên khác để đưa ra quyết định tốt nhất.',
                                color: 'from-blue-400 to-indigo-500',
                            },
                            {
                                icon: MapPin,
                                title: 'Tìm kiếm theo vị trí',
                                description:
                                    'Dễ dàng tìm dịch vụ gần trường học hoặc địa điểm bạn mong muốn.',
                                color: 'from-purple-400 to-pink-500',
                            },
                            {
                                icon: Heart,
                                title: 'So sánh & Yêu thích',
                                description:
                                    'So sánh nhiều dịch vụ và lưu lại những lựa chọn yêu thích.',
                                color: 'from-pink-400 to-rose-500',
                            },
                            {
                                icon: CheckCircle,
                                title: 'Giá minh bạch',
                                description:
                                    'Thông tin giá cả rõ ràng, không phát sinh chi phí ẩn.',
                                color: 'from-cyan-400 to-blue-500',
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group card p-8 hover:-translate-y-2 transition-all duration-300"
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                                >
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Services Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
                                Dịch vụ nổi bật
                            </h2>
                            <p className="text-gray-600">
                                Được đánh giá cao bởi cộng đồng sinh viên
                            </p>
                        </div>
                        <Link
                            to="/services"
                            className="btn-outline group"
                        >
                            Xem tất cả
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-500 mb-4">{error}</p>
                            <p className="text-gray-500">Đang hiển thị dữ liệu mẫu</p>
                        </div>
                    ) : popularServices.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {popularServices.map((service) => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-gray-500">Chưa có dịch vụ nào</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-600 text-sm font-medium mb-4">
                            <Crown className="w-4 h-4" />
                            Gói dịch vụ
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
                            Chọn gói phù hợp với bạn
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Dành cho sinh viên và đối tác nhà xe — minh bạch, không phí ẩn.
                        </p>
                    </div>

                    {/* Toggle tabs */}
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 gap-1">
                            <button
                                onClick={() => setPricingTab('user')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${pricingTab === 'user' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Sinh viên
                            </button>
                            <button
                                onClick={() => setPricingTab('partner')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${pricingTab === 'partner' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Đối tác nhà xe
                            </button>
                        </div>
                    </div>

                    {/* User plans */}
                    {pricingTab === 'user' && (
                        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            {[
                                {
                                    name: 'Freemium',
                                    price: 0,
                                    description: 'Đủ dùng cho sinh viên mới bắt đầu',
                                    features: ['Tìm kiếm tuyến xe', 'So sánh giá vé & lịch trình', 'Xem đánh giá nhà xe', 'Đặt vé cơ bản', 'Lưu lịch sử chuyến đi'],
                                    popular: false,
                                },
                                {
                                    name: 'StuGo Student Premium',
                                    price: 49000,
                                    description: 'Trải nghiệm đầy đủ dành riêng cho sinh viên',
                                    badge: 'Phổ biến nhất',
                                    features: ['Tất cả tính năng Free', 'Chọn ghế ngồi', 'Ưu tiên giữ chỗ giờ cao điểm', 'Đặt lại chuyến quen 1 chạm', 'Thông báo flash sale', 'Giữ chỗ dịp lễ/Tết', 'Tích điểm & hoàn xu', 'Gợi ý AI thông minh'],
                                    popular: true,
                                },
                            ].map((plan, i) => (
                                <div key={i} className={`relative bg-white rounded-2xl flex flex-col ${plan.badge ? 'pt-10 px-7 pb-7' : 'p-7'} ${plan.popular ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10' : 'border border-gray-200 shadow-lg'}`}>
                                    {plan.badge && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap">
                                            {plan.badge}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
                                    <div className="text-2xl font-bold text-gray-900 mb-5">
                                        {plan.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price) + '/tháng'}
                                    </div>
                                    <ul className="space-y-2 mb-6 flex-1">
                                        {plan.features.map((f, j) => (
                                            <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    {(() => {
                                        const btnProps = getPlanBtnProps(plan.price);
                                        return (
                                            <Link 
                                                to={btnProps.to} 
                                                className={`text-center py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 block ${btnProps.className}`}
                                            >
                                                {btnProps.text}
                                            </Link>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Partner plans */}
                    {pricingTab === 'partner' && (
                        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            {[
                                {
                                    name: 'Business Basic',
                                    price: 0,
                                    originalPrice: 299000,
                                    badge: 'FREE Trial 4 tuần',
                                    badgeColor: 'from-teal-500 to-emerald-500',
                                    description: 'Dành cho nhà xe mới bắt đầu trên StuGo',
                                    features: ['Đăng tuyến xe trên StuGo', 'Quản lý đặt vé', 'Quản lý ghế trống', 'Dashboard quản lý khách hàng', 'Theo dõi lịch trình chuyến xe', 'Hỗ trợ kỹ thuật cơ bản'],
                                    popular: false,
                                },
                                {
                                    name: 'Business Premium',
                                    price: 479000,
                                    originalPrice: 599000,
                                    badge: 'Giảm 20%',
                                    badgeColor: 'from-orange-500 to-red-500',
                                    description: 'Tối ưu doanh thu & tăng trưởng nhanh',
                                    features: ['Tất cả tính năng Basic', 'Ưu tiên hiển thị trên hệ thống', 'Badge "Đối tác xác minh"', 'Thống kê hành vi khách hàng', 'Báo cáo tuyến xe tiềm năng', 'Hỗ trợ marketing', 'Gợi ý AI', 'Quảng bá Fanpage/TikTok StuGo'],
                                    popular: true,
                                },
                            ].map((plan, i) => (
                                <div key={i} className={`relative bg-white rounded-2xl flex flex-col ${plan.badge ? 'pt-10 px-7 pb-7' : 'p-7'} ${plan.popular ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10' : 'border border-gray-200 shadow-lg'}`}>
                                    {plan.badge && (
                                        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${plan.badgeColor} text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap`}>
                                            {plan.badge}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
                                    <div className="mb-1">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {plan.price === 0 ? 'Dùng thử' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price) + '/tháng'}
                                        </span>
                                    </div>
                                    {plan.originalPrice && plan.originalPrice !== plan.price && (
                                        <p className="text-xs text-gray-400 line-through mb-4">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.originalPrice)}/tháng</p>
                                    )}
                                    <ul className="space-y-2 mb-6 flex-1">
                                        {plan.features.map((f, j) => (
                                            <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to={user ? "/subscription?type=partner" : "/partner"} className={`text-center py-2.5 px-4 rounded-xl font-medium text-sm transition-colors ${plan.popular ? 'bg-primary-500 text-white hover:bg-primary-600' : 'border-2 border-gray-200 text-gray-700 hover:border-primary-300'}`}>
                                        {user ? 'Nâng cấp gói' : 'Đăng ký cộng tác'}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-1/4 right-20 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-5xl font-display font-bold text-white mb-6">
                        Sẵn sàng trải nghiệm StuGo?
                    </h2>
                    <p className="text-xl text-white/80 mb-10">
                        Đăng ký ngay hôm nay và nhận ưu đãi 20% cho lần đặt chỗ đầu tiên!
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to={user ? "/services" : "/login"}
                            className="btn bg-white text-primary-600 hover:bg-gray-100 shadow-xl text-lg px-8 py-4 transition-all duration-200"
                        >
                            {user ? "Khám phá dịch vụ ngay" : "Bắt đầu ngay"}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to={user?.role === 'partner' ? "/manager" : "/partner"}
                            className="btn border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 transition-all duration-200"
                        >
                            {user?.role === 'partner' ? "Kênh đối tác" : "Trở thành đối tác"}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
