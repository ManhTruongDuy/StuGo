import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Clock,
    DollarSign,
    FileText,
    Upload,
    Target,
    Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createService } from '../../services/service.service';

const cities = [
    { code: 'hanoi', name: 'Hà Nội' },
    { code: 'hcm', name: 'TP. Hồ Chí Minh' },
    { code: 'danang', name: 'Đà Nẵng' },
];

const districts: Record<string, { code: string; name: string }[]> = {
    hanoi: [
        { code: 'hk', name: 'Hoàn Kiếm' },
        { code: 'cg', name: 'Cầu Giấy' },
        { code: 'tx', name: 'Thanh Xuân' },
        { code: 'hd', name: 'Hai Bà Trưng' },
        { code: 'dd', name: 'Đống Đa' },
        { code: 'ba', name: 'Ba Đình' },
    ],
    hcm: [
        { code: 'q1', name: 'Quận 1' },
        { code: 'q3', name: 'Quận 3' },
        { code: 'q5', name: 'Quận 5' },
        { code: 'q7', name: 'Quận 7' },
        { code: 'bt', name: 'Bình Thạnh' },
        { code: 'td', name: 'Tân Định' },
    ],
    danang: [
        { code: 'hc', name: 'Hải Châu' },
        { code: 'tn', name: 'Thanh Khê' },
        { code: 'sn', name: 'Sơn Trà' },
        { code: 'nhs', name: 'Ngũ Hành Sơn' },
        { code: 'lc', name: 'Liên Chiểu' },
        { code: 'cv', name: 'Cẩm Lệ' },
    ],
};

const CreateTransportForm = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [newRoute, setNewRoute] = useState('');
    const [newDepartureTime, setNewDepartureTime] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: '',
        district: '',
        ward: '',
        address: '',
        latitude: '',
        longitude: '',
        openTime: '05:00',
        closeTime: '22:00',
        minPrice: '',
        maxPrice: '',
        vehicleType: '',
        seats: '',
        routes: [] as string[],
        departureTime: [] as string[],
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'city') {
            setFormData((prev) => ({ ...prev, district: '', ward: '' }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages((prev) => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            toast.loading('Đang lấy vị trí...', { id: 'geolocation' });
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lng = position.coords.longitude.toFixed(6);
                    setFormData((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                    }));
                    toast.success(
                        `Đã lấy tọa độ!\nVĩ độ: ${lat}\nKinh độ: ${lng}`,
                        { id: 'geolocation', duration: 4000 }
                    );
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    toast.error(
                        'Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí hoặc nhập thủ công.',
                        { id: 'geolocation', duration: 4000 }
                    );
                }
            );
        } else {
            toast.error('Trình duyệt không hỗ trợ lấy vị trí');
        }
    };

    const handleAddRoute = () => {
        if (newRoute.trim()) {
            setFormData((prev) => ({
                ...prev,
                routes: [...prev.routes, newRoute.trim()],
            }));
            toast.success(`Đã thêm tuyến: ${newRoute.trim()}`);
            setNewRoute('');
        } else {
            toast.error('Vui lòng nhập tên tuyến đường');
        }
    };

    const handleRemoveRoute = (index: number) => {
        const removedRoute = formData.routes[index];
        setFormData((prev) => ({
            ...prev,
            routes: prev.routes.filter((_, i) => i !== index),
        }));
        toast.success(`Đã xóa tuyến: ${removedRoute}`);
    };

    const handleAddDepartureTime = () => {
        if (newDepartureTime) {
            setFormData((prev) => ({
                ...prev,
                departureTime: [...prev.departureTime, newDepartureTime],
            }));
            toast.success(`Đã thêm giờ khởi hành: ${newDepartureTime}`);
            setNewDepartureTime('');
        } else {
            toast.error('Vui lòng chọn giờ khởi hành');
        }
    };

    const handleRemoveDepartureTime = (index: number) => {
        const removedTime = formData.departureTime[index];
        setFormData((prev) => ({
            ...prev,
            departureTime: prev.departureTime.filter((_, i) => i !== index),
        }));
        toast.success(`Đã xóa giờ: ${removedTime}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.routes.length === 0) {
            toast.error('⚠️ Vui lòng thêm ít nhất 1 tuyến đường');
            return;
        }
        if (formData.departureTime.length === 0) {
            toast.error('⚠️ Vui lòng thêm ít nhất 1 giờ khởi hành');
            return;
        }
        if (!formData.minPrice || !formData.maxPrice) {
            toast.error('⚠️ Vui lòng nhập giá dịch vụ');
            return;
        }

        // Validate coordinates if provided
        if (formData.latitude || formData.longitude) {
            const lat = parseFloat(formData.latitude);
            const lng = parseFloat(formData.longitude);

            if (isNaN(lat) || isNaN(lng)) {
                toast.error('⚠️ Tọa độ không hợp lệ. Vui lòng nhập số hoặc dùng nút "Lấy tọa độ"');
                return;
            }

            if (lat < -90 || lat > 90) {
                toast.error(`⚠️ Vĩ độ phải từ -90 đến 90 (bạn nhập: ${lat})`);
                return;
            }

            if (lng < -180 || lng > 180) {
                toast.error(`⚠️ Kinh độ phải từ -180 đến 180 (bạn nhập: ${lng})`);
                return;
            }
        }

        setIsLoading(true);

        try {
            const serviceData: any = {
                type: 'transport',
                name: formData.name,
                description: formData.description,
                address: formData.address,
                city: formData.city,
                district: formData.district,
                ward: formData.ward || undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                openTime: formData.openTime,
                closeTime: formData.closeTime,
                priceRange: {
                    min: parseInt(formData.minPrice),
                    max: parseInt(formData.maxPrice),
                },
                images: images,
                vehicleType: formData.vehicleType,
                seats: parseInt(formData.seats),
                routes: formData.routes,
                departureTime: formData.departureTime,
            };

            const result = await createService(serviceData);

            toast.success('✅ Tạo dịch vụ nhà xe thành công! Đang chờ phê duyệt.');
            navigate('/manager/services');
        } catch (error: any) {
            console.error('Create transport error:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Có lỗi xảy ra khi tạo dịch vụ';
            toast.error(`❌ ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên nhà xe <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                placeholder="VD: Xe Hoàng Long"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="input pl-12"
                                    placeholder="Mô tả chi tiết về dịch vụ..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loại xe <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="vehicleType"
                                    value={formData.vehicleType}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="">Chọn loại xe</option>
                                    <option value="Xe giường nằm">Xe giường nằm</option>
                                    <option value="Xe ghế ngồi">Xe ghế ngồi</option>
                                    <option value="Xe limousine">Xe limousine</option>
                                    <option value="Xe khách">Xe khách</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số ghế <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="seats"
                                    value={formData.seats}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="VD: 40"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Routes */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tuyến đường <span className="text-red-500">*</span>
                    </h3>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newRoute}
                            onChange={(e) => setNewRoute(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRoute())}
                            className="input flex-1"
                            placeholder="VD: Hà Nội - Thái Bình"
                        />
                        <button
                            type="button"
                            onClick={handleAddRoute}
                            className="btn-outline px-6"
                        >
                            Thêm
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.routes.map((route, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm"
                            >
                                {route}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRoute(index)}
                                    className="hover:text-blue-900"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Departure Times */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Giờ khởi hành <span className="text-red-500">*</span>
                    </h3>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="time"
                            value={newDepartureTime}
                            onChange={(e) => setNewDepartureTime(e.target.value)}
                            className="input flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleAddDepartureTime}
                            className="btn-outline px-6"
                        >
                            Thêm
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.departureTime.map((time, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm"
                            >
                                <Clock className="w-4 h-4" />
                                {time}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveDepartureTime(index)}
                                    className="hover:text-green-900"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Location */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vị trí</h3>
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                        <select
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">Chọn tỉnh/thành</option>
                            {cities.map((city) => (
                                <option key={city.code} value={city.code}>
                                    {city.name}
                                </option>
                            ))}
                        </select>

                        {formData.city && districts[formData.city] ? (
                            <select
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                className="input"
                                required
                            >
                                <option value="">Chọn quận/huyện</option>
                                {districts[formData.city].map((d) => (
                                    <option key={d.code} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                className="input"
                                placeholder="Quận/Huyện"
                                required
                            />
                        )}

                        <input
                            type="text"
                            name="ward"
                            value={formData.ward}
                            onChange={handleChange}
                            className="input"
                            placeholder="Phường/Xã"
                        />
                    </div>

                    <div className="relative mb-4">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="input pl-12"
                            placeholder="Địa chỉ chi tiết"
                            required
                        />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vĩ độ (Latitude)
                            </label>
                            <input
                                type="text"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                className="input"
                                placeholder="VD: 21.028511"
                            />
                            <p className="text-xs text-gray-500 mt-1">Hà Nội: ~21°, TP.HCM: ~10°</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kinh độ (Longitude)
                            </label>
                            <input
                                type="text"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                className="input"
                                placeholder="VD: 105.804817"
                            />
                            <p className="text-xs text-gray-500 mt-1">Hà Nội: ~105°, TP.HCM: ~106°</p>
                        </div>
                        <div className="flex flex-col justify-end">
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="btn-outline"
                            >
                                <Target className="w-5 h-5" />
                                Lấy tọa độ
                            </button>
                            <p className="text-xs text-gray-500 mt-1 text-center">Tự động lấy vị trí hiện tại</p>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Giá cả</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                name="minPrice"
                                value={formData.minPrice}
                                onChange={handleChange}
                                className="input pl-12"
                                placeholder="Giá thấp nhất"
                                required
                            />
                        </div>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                name="maxPrice"
                                value={formData.maxPrice}
                                onChange={handleChange}
                                className="input pl-12"
                                placeholder="Giá cao nhất"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h3>
                    <div className="grid grid-cols-4 gap-4">
                        {images.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 cursor-pointer flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            console.log('Cancel button clicked');
                            navigate('/manager');
                        }}
                        className="btn-ghost"
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            'Tạo dịch vụ'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateTransportForm;
