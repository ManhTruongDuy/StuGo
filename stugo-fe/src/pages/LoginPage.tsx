import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Shield, Star, Zap, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { loginWithEmail } from '../services/auth.service';
import toast from 'react-hot-toast';



const LoginPage = () => {
    const navigate = useNavigate();
    const { login, setLoading, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loginError, setLoginError] = useState<string>('');

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling

        console.log('Form submitted, preventDefault called');

        if (!validateForm()) {
            console.log('Validation failed');
            return;
        }

        setLoginError(''); // Clear previous errors

        try {
            setLoading(true);
            console.log('Sending login request...');

            const response = await loginWithEmail({
                email: formData.email,
                password: formData.password,
            });

            console.log('Login response:', response);

            if (response.success && response.data) {
                const { user, token } = response.data;

                localStorage.setItem('stugo-token', token);

                login(
                    {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        avatar: user.avatar,
                        phone: user.phone,
                        role: user.role,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    token
                );

                // Show success message
                toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName} 🎉`, {
                    duration: 2000,
                });

                // Navigate after a short delay
                setTimeout(() => {
                    setLoading(false);
                    if (user.role === 'admin') {
                        navigate('/admin');
                    } else if (user.role === 'partner') {
                        navigate('/manager');
                    } else {
                        navigate('/');
                    }
                }, 1500);
            }
        } catch (error: any) {
            console.log('Login error:', error);
            setLoading(false);
            const errorMessage = error.response?.data?.message;

            let displayError = '';

            // Hiển thị thông báo lỗi cụ thể
            if (errorMessage?.includes('không tồn tại') || errorMessage?.includes('not found')) {
                displayError = 'Email không tồn tại trong hệ thống';
            } else if (errorMessage?.includes('mật khẩu') || errorMessage?.includes('password')) {
                displayError = 'Mật khẩu không chính xác';
            } else if (errorMessage?.includes('email')) {
                displayError = 'Email không hợp lệ';
            } else {
                displayError = errorMessage || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
            }

            console.log('Setting error:', displayError);
            setLoginError(displayError);
            toast.error(displayError, { duration: 5000 });
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920')] bg-cover bg-center opacity-20"></div>

                <div className="absolute top-1/4 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
                <div className="absolute bottom-1/4 right-20 w-48 h-48 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>

                <div className="relative z-10 flex flex-col justify-center p-16">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-4xl font-display font-bold text-white">StuGo</span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6 leading-tight">
                        Chào mừng đến với
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                            StuGo Platform
                        </span>
                    </h1>

                    <p className="text-xl text-white/80 mb-12 leading-relaxed">
                        Nền tảng kết nối sinh viên với nhà xe, nhà trọ và quán ăn.
                        Dễ dàng tìm kiếm, so sánh và đặt chỗ.
                    </p>

                    <div className="space-y-6">
                        {[
                            { icon: Zap, text: 'Đặt chỗ nhanh chóng chỉ với vài click' },
                            { icon: Shield, text: 'An toàn và đáng tin cậy' },
                            { icon: Star, text: 'Đánh giá thực từ sinh viên' },
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-lg flex items-center justify-center">
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-lg text-white/90">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 pt-24">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-display font-bold gradient-text">StuGo</span>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 mb-2">
                                Đăng nhập
                            </h2>
                            <p className="text-gray-500">
                                Chào mừng bạn quay lại StuGo
                            </p>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full pl-12 pr-12 py-3 rounded-xl border ${errors.password ? 'border-red-500' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            </div>

                            {/* Login Error Message */}
                            {loginError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-600 text-sm font-medium text-center">{loginError}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3 disabled:opacity-50"
                            >
                                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                            </button>
                        </form>

                        {/* Register Link */}
                        <p className="text-center text-gray-500 mt-6">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="text-primary-600 font-medium hover:underline">
                                Đăng ký ngay
                            </Link>
                        </p>

                        {/* Google Login */}
                        <div className="mt-4">
                            <div className="relative flex items-center gap-3 my-2">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 whitespace-nowrap">hoặc</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <a
                                href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}/api/auth/google`}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Đăng nhập với Google
                            </a>
                        </div>


                        {/* Terms */}
                        <p className="text-center text-xs text-gray-400 mt-6">
                            Bằng việc đăng nhập, bạn đồng ý với{' '}
                            <a href="/terms" className="text-primary-600 hover:underline">Điều khoản</a>
                            {' '}và{' '}
                            <a href="/privacy" className="text-primary-600 hover:underline">Chính sách bảo mật</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
