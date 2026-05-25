import { useState, useEffect } from 'react';
import { XCircle, Save, Plus, Trash2, Upload, X, Link } from 'lucide-react';
import { updateService } from '../../services/service.service';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface EditRestaurantModalProps {
    service: any;
    onClose: () => void;
    onSuccess: () => void;
}

const EditRestaurantModal = ({ service, onClose, onSuccess }: EditRestaurantModalProps) => {
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        openTime: '',
        closeTime: '',
        cuisine: [''],
        menuItems: [{ name: '', price: 0, description: '', category: '' }],
        hasDelivery: false,
        hasReservation: false,
        isAvailable: true,
    });

    useEffect(() => {
        if (service) {
            console.log('Service images:', service.images); // Debug
            setImages(service.images || []);
            setFormData({
                name: service.name || '',
                description: service.description || '',
                address: service.address || '',
                city: service.city || '',
                district: service.district || '',
                ward: service.ward || '',
                openTime: service.openTime || '00:00',
                closeTime: service.closeTime || '23:59',
                cuisine: service.cuisine && service.cuisine.length > 0 ? service.cuisine : [''],
                menuItems: service.menuItems && service.menuItems.length > 0
                    ? service.menuItems
                    : [{ name: '', price: 0, description: '', category: '' }],
                hasDelivery: service.hasDelivery || false,
                hasReservation: service.hasReservation || false,
                isAvailable: service.isAvailable !== false,
            });
        }
    }, [service]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.address) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setSaving(true);
            const updateData = {
                ...formData,
                images,
                cuisine: formData.cuisine.filter(c => c.trim()),
                menuItems: formData.menuItems.filter(m => m.name.trim()),
            };
            await updateService(service.id, updateData);
            toast.success('Cập nhật dịch vụ thành công');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Không thể cập nhật dịch vụ');
        } finally {
            setSaving(false);
        }
    };

    const addMenuItem = () => {
        setFormData({
            ...formData,
            menuItems: [...formData.menuItems, { name: '', price: 0, description: '', category: '' }]
        });
    };

    const removeMenuItem = (index: number) => {
        const newItems = formData.menuItems.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            menuItems: newItems.length > 0 ? newItems : [{ name: '', price: 0, description: '', category: '' }]
        });
    };

    const updateMenuItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.menuItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, menuItems: newItems });
    };

    const addCuisine = () => {
        setFormData({ ...formData, cuisine: [...formData.cuisine, ''] });
    };

    const removeCuisine = (index: number) => {
        const newCuisine = formData.cuisine.filter((_, i) => i !== index);
        setFormData({ ...formData, cuisine: newCuisine.length > 0 ? newCuisine : [''] });
    };

    const updateCuisine = (index: number, value: string) => {
        const newCuisine = [...formData.cuisine];
        newCuisine[index] = value;
        setFormData({ ...formData, cuisine: newCuisine });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => { setImages(prev => [...prev, reader.result as string]); };
            reader.readAsDataURL(file);
        });
    };

    const addImageUrl = () => {
        const trimmed = newImageUrl.trim();
        if (!trimmed) return;
        if (!trimmed.startsWith('http')) { toast.error('URL phải bắt đầu bằng http://'); return; }
        setImages(prev => [...prev, trimmed]);
        setNewImageUrl('');
    };

    const removeImage = (index: number) => { setImages(prev => prev.filter((_, i) => i !== index)); };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa nhà hàng</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Images */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Hình ảnh</h3>
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())} placeholder="Dán URL ảnh vào đây..." className="input w-full pl-9 text-sm" />
                                </div>
                                <button type="button" onClick={addImageUrl} className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-medium flex items-center gap-1.5">
                                    <Plus className="w-4 h-4" />Thêm URL
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg bg-gray-100" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x120?text=Error'; }} />
                                        <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm text-gray-500">Tải ảnh lên</span>
                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên nhà hàng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input w-full min-h-[100px]"
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Địa chỉ</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cuisine */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Loại ẩm thực</h3>
                                <button type="button" onClick={addCuisine} className="btn btn-ghost text-sm">
                                    <Plus className="w-4 h-4" />
                                    Thêm
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {formData.cuisine.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateCuisine(index, e.target.value)}
                                            className="input flex-1"
                                            placeholder="VD: Việt Nam, Hàn Quốc"
                                        />
                                        {formData.cuisine.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeCuisine(index)}
                                                className="btn btn-ghost text-red-600 px-3"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Thực đơn</h3>
                                <button type="button" onClick={addMenuItem} className="btn btn-ghost text-sm">
                                    <Plus className="w-4 h-4" />
                                    Thêm món
                                </button>
                            </div>
                            <div className="space-y-4">
                                {formData.menuItems.map((item, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Món {index + 1}</span>
                                            {formData.menuItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMenuItem(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                                                className="input"
                                                placeholder="Tên món"
                                            />
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateMenuItem(index, 'price', parseInt(e.target.value) || 0)}
                                                className="input"
                                                placeholder="Giá"
                                                min="0"
                                            />
                                            <input
                                                type="text"
                                                value={item.category}
                                                onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                                                className="input"
                                                placeholder="Danh mục"
                                            />
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                                                className="input"
                                                placeholder="Mô tả"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Tính năng</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.hasDelivery}
                                        onChange={(e) => setFormData({ ...formData, hasDelivery: e.target.checked })}
                                        className="w-5 h-5 text-primary-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Có giao hàng</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.hasReservation}
                                        onChange={(e) => setFormData({ ...formData, hasReservation: e.target.checked })}
                                        className="w-5 h-5 text-primary-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Có đặt bàn</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        className="w-5 h-5 text-primary-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Dịch vụ đang hoạt động</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 flex-shrink-0">
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="btn  bg-gray-500 flex-1" disabled={saving}>
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                {saving ? (
                                    <>
                                        <LoadingSpinner />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRestaurantModal;
