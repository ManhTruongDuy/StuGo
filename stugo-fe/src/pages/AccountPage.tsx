import { useState } from 'react';
import {
    User,
    Camera,
    Mail,
    Phone,
    MapPin,
    Building2,
    CreditCard,
    Save,
    ChevronDown,
    Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { updateUserProfile } from '../services';
import toast from 'react-hot-toast';

const banks = [
    { id: 'vcb', name: 'Vietcombank' },
    { id: 'tcb', name: 'Techcombank' },
    { id: 'mb', name: 'MB Bank' },
    { id: 'acb', name: 'ACB' },
    { id: 'bidv', name: 'BIDV' },
    { id: 'vtb', name: 'VietinBank' },
    { id: 'vpb', name: 'VPBank' },
    { id: 'tpb', name: 'TPBank' },
];

const cities = [
    { code: 'hanoi', name: 'Hà Nội' },
    { code: 'hcm', name: 'TP. Hồ Chí Minh' },
    { code: 'danang', name: 'Đà Nẵng' },
    { code: 'haiphong', name: 'Hải Phòng' },
    { code: 'cantho', name: 'Cần Thơ' },
];

const districts: Record<string, { code: string; name: string }[]> = {
    hanoi: [
        { code: 'hk', name: 'Hoàn Kiếm' },
        { code: 'dd', name: 'Đống Đa' },
        { code: 'btl', name: 'Bắc Từ Liêm' },
        { code: 'ntl', name: 'Nam Từ Liêm' },
        { code: 'cg', name: 'Cầu Giấy' },
        { code: 'tx', name: 'Thanh Xuân' },
        { code: 'hbt', name: 'Hai Bà Trưng' },
        { code: 'hm', name: 'Hoàng Mai' },
        { code: 'lbk', name: 'Long Biên' },
        { code: 'td', name: 'Tây Hồ' },
        { code: 'ba', name: 'Ba Đình' },
        { code: 'hd', name: 'Hà Đông' },
        { code: 'st', name: 'Sơn Tây' },
        { code: 'bc', name: 'Ba Vì' },
        { code: 'pc', name: 'Phúc Thọ' },
        { code: 'dl', name: 'Đan Phượng' },
        { code: 'hl', name: 'Hoài Đức' },
        { code: 'qo', name: 'Quốc Oai' },
        { code: 'tx', name: 'Thạch Thất' },
        { code: 'cm', name: 'Chương Mỹ' },
        { code: 'tl', name: 'Thanh Oai' },
        { code: 'tt', name: 'Thường Tín' },
        { code: 'pl', name: 'Phú Xuyên' },
        { code: 'uy', name: 'Ứng Hòa' },
        { code: 'mđ', name: 'Mỹ Đức' },
        { code: 'sc', name: 'Sóc Sơn' },
        { code: 'đa', name: 'Đông Anh' },
        { code: 'gl', name: 'Gia Lâm' },
        { code: 'ml', name: 'Mê Linh' },
        { code: 'tho', name: 'Thanh Trì' },
    ],
    hcm: [
        { code: 'q1', name: 'Quận 1' },
        { code: 'q3', name: 'Quận 3' },
        { code: 'q4', name: 'Quận 4' },
        { code: 'q5', name: 'Quận 5' },
        { code: 'q6', name: 'Quận 6' },
        { code: 'q7', name: 'Quận 7' },
        { code: 'q8', name: 'Quận 8' },
        { code: 'q10', name: 'Quận 10' },
        { code: 'q11', name: 'Quận 11' },
        { code: 'q12', name: 'Quận 12' },
        { code: 'td', name: 'Thủ Đức' },
        { code: 'bth', name: 'Bình Thạnh' },
        { code: 'go', name: 'Gò Vấp' },
        { code: 'pn', name: 'Phú Nhuận' },
        { code: 'tb', name: 'Tân Bình' },
        { code: 'tp', name: 'Tân Phú' },
        { code: 'bc', name: 'Bình Tân' },
        { code: 'cc', name: 'Củ Chi' },
        { code: 'hm', name: 'Hóc Môn' },
        { code: 'bc', name: 'Bình Chánh' },
        { code: 'nbe', name: 'Nhà Bè' },
        { code: 'cg', name: 'Cần Giờ' },
    ],
};

const AccountPage = () => {
    const { user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || '',
        district: user?.district || '',
        ward: user?.ward || '',
        bankName: user?.bankName || '',
        bankAccount: user?.bankAccount || '',
    });
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Reset district when city changes
        if (name === 'city') {
            setFormData((prev) => ({ ...prev, district: '', ward: '' }));
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error('Không tìm thấy thông tin người dùng');
            return;
        }

        setIsLoading(true);

        try {
            const updateData = {
                fullName: formData.fullName,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                district: formData.district,
                ward: formData.ward,
                bankName: formData.bankName,
                bankAccount: formData.bankAccount,
                avatar: avatarPreview,
            };

            const response = await updateUserProfile(user.id, updateData);

            if (response.success) {
                // Update local user state
                updateUser({
                    ...formData,
                    avatar: avatarPreview,
                });
                toast.success('Cập nhật thông tin thành công!');
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                        Cài đặt tài khoản
                    </h1>
                    <p className="text-gray-500">
                        Quản lý thông tin cá nhân và cài đặt tài khoản
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            Ảnh đại diện
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                )}
                                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                                    <Camera className="w-5 h-5 text-gray-600" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{user?.fullName}</p>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    JPG, PNG hoặc GIF. Tối đa 2MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Info */}
                    <div className="card p-6 border-2 border-primary-500 bg-gradient-to-br from-white to-primary-50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-primary-500" />
                                    Gói dịch vụ hiện tại
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Bạn đang sử dụng gói <span className="font-bold text-primary-700 uppercase">{user?.plan || 'free'}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => window.location.href = '/subscription'}
                                className="btn-primary flex-shrink-0"
                            >
                                Nâng cấp gói
                            </button>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            Thông tin cá nhân
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và tên
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="input pl-12"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input pl-12 bg-gray-400"
                                        placeholder="email@example.com"
                                        disabled
                                        readOnly
                                        
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số điện thoại
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input pl-12"
                                        placeholder="0912345678"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Địa chỉ
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="input pl-12"
                                        placeholder="Số nhà, tên đường"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Settings */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            Cài đặt vị trí
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tỉnh/Thành phố
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="input pl-12 appearance-none cursor-pointer"
                                    >
                                        <option value="">Chọn tỉnh/thành</option>
                                        {cities.map((city) => (
                                            <option key={city.code} value={city.code}>
                                                {city.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quận/Huyện
                                </label>
                                <div className="relative">
                                    <select
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        className="input appearance-none cursor-pointer"
                                        disabled={!formData.city}
                                    >
                                        <option value="">Chọn quận/huyện</option>
                                        {formData.city &&
                                            districts[formData.city]?.map((district) => (
                                                <option key={district.code} value={district.code}>
                                                    {district.name}
                                                </option>
                                            ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phường/Xã
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="ward"
                                        value={formData.ward}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Nhập phường/xã"
                                        disabled={!formData.district}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Info */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            Thông tin ngân hàng
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngân hàng
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        className="input pl-12 appearance-none cursor-pointer"
                                    >
                                        <option value="">Chọn ngân hàng</option>
                                        {banks.map((bank) => (
                                            <option key={bank.id} value={bank.id}>
                                                {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số tài khoản
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="bankAccount"
                                        value={formData.bankAccount}
                                        onChange={handleChange}
                                        className="input pl-12"
                                        placeholder="Nhập số tài khoản"
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-4">
                            💡 Thông tin ngân hàng được sử dụng để nhận tiền hoàn trả khi hủy
                            đặt chỗ.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="btn-ghost"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang lưu...
                                </span>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Cập nhật
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountPage;
