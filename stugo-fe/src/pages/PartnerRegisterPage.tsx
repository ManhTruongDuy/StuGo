import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Mail, Lock, User, Phone, Building2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { register } from '../services/auth.service';
import toast from 'react-hot-toast';

const BENEFITS = [
    'Tiếp cận hàng nghìn sinh viên mỗi ngày',
    'Quản lý đặt chỗ & doanh thu dễ dàng',
    'Dashboard thống kê chi tiết',
    'Dùng thử miễn phí 2 tháng',
    'Hỗ trợ kỹ thuật tận tình',
];

const PartnerRegisterPage = () => {
    const navigate = useNavigate();
    const { login, setLoading, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        businessName: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [registerError, setRegisterError] = useState('');

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
        if (!formData.email.trim()) e.email = 'Vui lòng nhập email';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email không hợp lệ';
        if (!formData.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
        else if (!/^0[0-9]{9}$/.test(formData.phone)) e.phone = 'Số điện thoại không hợp lệ';
        if (!formData.password) e.password = 'Vui lòng nhập mật khẩu';
        else if (formData.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Mật khẩu xác nhận không khớp';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setRegisterError('');
        try {
            setLoading(true);
            const response = await register({
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: 'partner',
            });
            if (response.success && response.data) {
                const { user, token } = response.data;
                localStorage.setItem('stugo-token', token);
                login({
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    phone: user.phone,
                    role: user.role,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }, token);
                toast.success(`Chào mừng ${user.fullName} đến với StuGo! 🎉`);
                setTimeout(() => { setLoading(false); navigate('/manager'); }, 1500);
            }
        } catch (error: any) {
            setLoading(false);
            const msg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setRegisterError(msg);
            toast.error(msg);
        }
    };

    const inputClass = (field: string) =>
        `w-full pl-12 pr-4 py-3 rounded-xl border ${errors[field] ? 'border-red-500' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all`;

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            {/* Left — benefits panel (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary-600 to-secondary-600 p-12 flex-col justify-center text-white">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <MapPin className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl font-display font-bold">StuGo</span>
                </div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">
                    Trở thành đối tác<br />của StuGo
                </h2>
                <p className="text-primary-100 mb-8 text-lg">
                    Kết nối dịch vụ của bạn với hàng nghìn sinh viên trên toàn quốc.
                </p>
                <ul className="space-y-4">
                    {BENEFITS.map((b, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                            <span className="text-primary-100">{b}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center p-6 pt-20 lg:pt-6">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-display font-bold gradient-text">StuGo</span>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">
                                Đăng ký cộng tác
                            </h2>
                            <p className="text-gray-500 text-sm">
                                Tạo tài khoản đối tác để đăng dịch vụ trên StuGo
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className={inputClass('fullName')} placeholder="Nguyễn Văn A" />
                                </div>
                                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                            </div>

                            {/* Business Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên doanh nghiệp / dịch vụ <span className="text-gray-400">(tuỳ chọn)</span></label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={formData.businessName}
                                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        placeholder="Nhà xe Hoàng Long, Phòng trọ ABC..." />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className={inputClass('email')} placeholder="email@example.com" />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="tel" value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className={inputClass('phone')} placeholder="0901234567" />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type={showPassword ? 'text' : 'password'} value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className={inputClass('password')} placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className={inputClass('confirmPassword')} placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>

                            {registerError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-600 text-sm text-center">{registerError}</p>
                                </div>
                            )}

                            <button type="submit" disabled={isLoading}
                                className="w-full btn-primary py-3 disabled:opacity-50">
                                {isLoading ? 'Đang xử lý...' : 'Đăng ký cộng tác'}
                            </button>
                        </form>

                        <div className="mt-5 text-center space-y-2 text-sm text-gray-500">
                            <p>Đã có tài khoản đối tác?{' '}
                                <Link to="/login" className="text-primary-600 font-medium hover:underline">Đăng nhập</Link>
                            </p>
                            <p>Là sinh viên?{' '}
                                <Link to="/register" className="text-primary-600 font-medium hover:underline">Đăng ký tài khoản thường</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerRegisterPage;
