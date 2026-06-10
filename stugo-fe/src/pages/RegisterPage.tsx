import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { register } from '../services/auth.service';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login, setLoading, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [registerError, setRegisterError] = useState<string>('');

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ tên';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^0[0-9]{9}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setRegisterError(''); // Clear previous errors

        try {
            setLoading(true);

            const response = await register({
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
            });

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
                        plan: (user.plan === 'premium' ? 'premium_user' : user.plan) as any,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    token
                );

                // Show success message
                toast.success(`Tạo tài khoản thành công! Chào mừng ${user.fullName} đến với StuGo 🎉`, {
                    duration: 2000,
                });

                // Navigate after a short delay
                setTimeout(() => {
                    setLoading(false);
                    navigate('/');
                }, 1500);
            }
        } catch (error: any) {
            setLoading(false);
            const errorMessage = error.response?.data?.message;

            let displayError = '';

            // Hiển thị thông báo lỗi cụ thể
            if (errorMessage?.includes('đã tồn tại') || errorMessage?.includes('already exists')) {
                if (errorMessage.includes('email')) {
                    displayError = 'Email này đã được đăng ký. Vui lòng sử dụng email khác.';
                } else if (errorMessage.includes('phone')) {
                    displayError = 'Số điện thoại này đã được đăng ký. Vui lòng sử dụng số khác.';
                } else {
                    displayError = 'Tài khoản đã tồn tại. Vui lòng đăng nhập.';
                }
            } else if (errorMessage?.includes('email')) {
                displayError = 'Email không hợp lệ';
            } else if (errorMessage?.includes('phone')) {
                displayError = 'Số điện thoại không hợp lệ';
            } else if (errorMessage?.includes('password')) {
                displayError = 'Mật khẩu không đủ mạnh';
            } else {
                displayError = errorMessage || 'Đăng ký thất bại. Vui lòng thử lại.';
            }

            setRegisterError(displayError);
            toast.error(displayError, { duration: 5000 });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 pt-20">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                        <MapPin className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl font-display font-bold gradient-text">StuGo</span>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                            Tạo tài khoản
                        </h2>
                        <p className="text-gray-500">
                            Đăng ký để bắt đầu sử dụng StuGo
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Họ và tên
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                        </div>

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

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Số điện thoại
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`}
                                    placeholder="0901234567"
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`w-full pl-12 pr-12 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                        </div>

                        {/* Register Error Message */}
                        {registerError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 text-sm font-medium text-center">{registerError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3 disabled:opacity-50"
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 mt-6">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-primary-600 font-medium hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
