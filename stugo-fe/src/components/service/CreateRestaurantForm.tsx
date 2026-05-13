import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    DollarSign,
    FileText,
    Upload,
    Target,
    Loader2,
    Plus,
    Minus,
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

interface MenuItem {
    name: string;
    price: string;
    description: string;
    category: string;
}

const CreateRestaurantForm = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([
        { name: '', price: '', description: '', category: '' },
    ]);
    const [cuisine, setCuisine] = useState<string[]>([]);
    const [newCuisine, setNewCuisine] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: '',
        district: '',
        ward: '',
        address: '',
        latitude: '',
        longitude: '',
        minPrice: '',
        maxPrice: '',
        hasDelivery: false,
        hasReservation: false,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

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
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData((prev) => ({
                        ...prev,
                        latitude: position.coords.latitude.toFixed(6),
                        longitude: position.coords.longitude.toFixed(6),
                    }));
                    toast.success('Đã lấy tọa độ vị trí!');
                },
                () => {
                    toast.error('Không thể lấy vị trí. Vui lòng thử lại.');
                }
            );
        }
    };

    const handleMenuItemChange = (index: number, field: keyof MenuItem, value: string) => {
        const updated = [...menuItems];
        updated[index][field] = value;
        setMenuItems(updated);
    };

    const addMenuItem = () => {
        setMenuItems([...menuItems, { name: '', price: '', description: '', category: '' }]);
    };

    const removeMenuItem = (index: number) => {
        setMenuItems(menuItems.filter((_, i) => i !== index));
    };

    const handleAddCuisine = () => {
        if (newCuisine.trim()) {
            setCuisine([...cuisine, newCuisine.trim()]);
            setNewCuisine('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validMenuItems = menuItems.filter(item => item.name && item.price);
        if (validMenuItems.length === 0) {
            toast.error('Vui lòng thêm ít nhất 1 món ăn đầy đủ tên và giá');
            return;
        }
        if (!formData.minPrice || !formData.maxPrice) {
            toast.error('Vui lòng nhập giá dịch vụ');
            return;
        }

        setIsLoading(true);

        try {
            const serviceData: any = {
                type: 'restaurant',
                name: formData.name,
                description: formData.description,
                address: formData.address,
                city: formData.city,
                district: formData.district,
                ward: formData.ward || undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                openTime: '08:00',
                closeTime: '22:00',
                priceRange: {
                    min: parseInt(formData.minPrice),
                    max: parseInt(formData.maxPrice),
                },
                images: images,
                cuisine: cuisine,
                menuItems: validMenuItems.map(item => ({
                    name: item.name,
                    price: parseInt(item.price),
                    description: item.description || undefined,
                    category: item.category || undefined,
                })),
                hasDelivery: formData.hasDelivery,
                hasReservation: formData.hasReservation,
            };

            await createService(serviceData);
            toast.success('Tạo dịch vụ quán ăn thành công! Đang chờ phê duyệt.');
            navigate('/manager/services');
        } catch (error: any) {
            console.error('Create service error:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Có lỗi xảy ra khi tạo dịch vụ';
            toast.error(errorMessage);
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
                                Tên quán ăn <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                placeholder="VD: Quán Cơm Tấm Sài Gòn"
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
                                    placeholder="Mô tả chi tiết về quán ăn..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasDelivery"
                                    checked={formData.hasDelivery}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Hỗ trợ giao hàng</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasReservation"
                                    checked={formData.hasReservation}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Hỗ trợ đặt bàn</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Cuisine */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Loại ẩm thực</h3>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newCuisine}
                            onChange={(e) => setNewCuisine(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCuisine())}
                            className="input flex-1"
                            placeholder="VD: Việt Nam, Trung Hoa, Nhật Bản..."
                        />
                        <button
                            type="button"
                            onClick={handleAddCuisine}
                            className="btn-outline px-6"
                        >
                            Thêm
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {cuisine.map((item, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm"
                            >
                                {item}
                                <button
                                    type="button"
                                    onClick={() => setCuisine(cuisine.filter((_, i) => i !== index))}
                                    className="hover:text-orange-900"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Menu Items */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Thực đơn <span className="text-red-500">*</span>
                        </h3>
                        <button
                            type="button"
                            onClick={addMenuItem}
                            className="btn-outline py-2 px-4 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm món
                        </button>
                    </div>
                    <div className="space-y-4">
                        {menuItems.map((item, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700">Món {index + 1}</span>
                                    {menuItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMenuItem(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                                        className="input"
                                        placeholder="Tên món"
                                    />
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => handleMenuItemChange(index, 'price', e.target.value)}
                                        className="input"
                                        placeholder="Giá"
                                    />
                                    <input
                                        type="text"
                                        value={item.category}
                                        onChange={(e) => handleMenuItemChange(index, 'category', e.target.value)}
                                        className="input"
                                        placeholder="Danh mục (VD: Món chính)"
                                    />
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleMenuItemChange(index, 'description', e.target.value)}
                                        className="input"
                                        placeholder="Mô tả"
                                    />
                                </div>
                            </div>
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
                        <input
                            type="text"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            className="input"
                            placeholder="Vĩ độ"
                        />
                        <input
                            type="text"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            className="input"
                            placeholder="Kinh độ"
                        />
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            className="btn-outline"
                        >
                            <Target className="w-5 h-5" />
                            Lấy tọa độ
                        </button>
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
                        onClick={() => navigate('/manager')}
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

export default CreateRestaurantForm;
