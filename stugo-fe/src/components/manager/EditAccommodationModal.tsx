import { useState, useEffect } from 'react';
import { XCircle, Save, Plus, Trash2, Upload, X } from 'lucide-react';
import { updateService } from '../../services/service.service';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface EditAccommodationModalProps {
    service: any;
    onClose: () => void;
    onSuccess: () => void;
}

const EditAccommodationModal = ({ service, onClose, onSuccess }: EditAccommodationModalProps) => {
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        openTime: '',
        closeTime: '',
        roomTypes: [{ name: '', price: 0, capacity: 0, available: 0 }],
        amenities: [''],
        rules: [''],
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
                roomTypes: service.roomTypes && service.roomTypes.length > 0
                    ? service.roomTypes
                    : [{ name: '', price: 0, capacity: 0, available: 0 }],
                amenities: service.amenities && service.amenities.length > 0 ? service.amenities : [''],
                rules: service.rules && service.rules.length > 0 ? service.rules : [''],
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
                roomTypes: formData.roomTypes.filter(r => r.name.trim()),
                amenities: formData.amenities.filter(a => a.trim()),
                rules: formData.rules.filter(r => r.trim()),
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

    const addRoomType = () => {
        setFormData({
            ...formData,
            roomTypes: [...formData.roomTypes, { name: '', price: 0, capacity: 0, available: 0 }]
        });
    };

    const removeRoomType = (index: number) => {
        const newRooms = formData.roomTypes.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            roomTypes: newRooms.length > 0 ? newRooms : [{ name: '', price: 0, capacity: 0, available: 0 }]
        });
    };

    const updateRoomType = (index: number, field: string, value: any) => {
        const newRooms = [...formData.roomTypes];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setFormData({ ...formData, roomTypes: newRooms });
    };

    const addAmenity = () => {
        setFormData({ ...formData, amenities: [...formData.amenities, ''] });
    };

    const removeAmenity = (index: number) => {
        const newAmenities = formData.amenities.filter((_, i) => i !== index);
        setFormData({ ...formData, amenities: newAmenities.length > 0 ? newAmenities : [''] });
    };

    const updateAmenity = (index: number, value: string) => {
        const newAmenities = [...formData.amenities];
        newAmenities[index] = value;
        setFormData({ ...formData, amenities: newAmenities });
    };

    const addRule = () => {
        setFormData({ ...formData, rules: [...formData.rules, ''] });
    };

    const removeRule = (index: number) => {
        const newRules = formData.rules.filter((_, i) => i !== index);
        setFormData({ ...formData, rules: newRules.length > 0 ? newRules : [''] });
    };

    const updateRule = (index: number, value: string) => {
        const newRules = [...formData.rules];
        newRules[index] = value;
        setFormData({ ...formData, rules: newRules });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa chỗ ở</h2>
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={img}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <label className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Thêm ảnh</span>
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

                        {/* Basic Info */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên chỗ ở <span className="text-red-500">*</span>
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

                        {/* Room Types */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Loại phòng</h3>
                                <button type="button" onClick={addRoomType} className="btn btn-ghost text-sm">
                                    <Plus className="w-4 h-4" />
                                    Thêm loại phòng
                                </button>
                            </div>
                            <div className="space-y-4">
                                {formData.roomTypes.map((room, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Phòng {index + 1}</span>
                                            {formData.roomTypes.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoomType(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={room.name}
                                                onChange={(e) => updateRoomType(index, 'name', e.target.value)}
                                                className="input"
                                                placeholder="Tên loại phòng"
                                            />
                                            <input
                                                type="number"
                                                value={room.price}
                                                onChange={(e) => updateRoomType(index, 'price', parseInt(e.target.value) || 0)}
                                                className="input"
                                                placeholder="Giá/đêm"
                                                min="0"
                                            />
                                            <input
                                                type="number"
                                                value={room.capacity}
                                                onChange={(e) => updateRoomType(index, 'capacity', parseInt(e.target.value) || 0)}
                                                className="input"
                                                placeholder="Sức chứa"
                                                min="0"
                                            />
                                            <input
                                                type="number"
                                                value={room.available}
                                                onChange={(e) => updateRoomType(index, 'available', parseInt(e.target.value) || 0)}
                                                className="input"
                                                placeholder="Số phòng trống"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Amenities */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Tiện nghi</h3>
                                <button type="button" onClick={addAmenity} className="btn btn-ghost text-sm">
                                    <Plus className="w-4 h-4" />
                                    Thêm
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {formData.amenities.map((amenity, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={amenity}
                                            onChange={(e) => updateAmenity(index, e.target.value)}
                                            className="input flex-1"
                                            placeholder="VD: Wifi, Điều hòa"
                                        />
                                        {formData.amenities.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeAmenity(index)}
                                                className="btn btn-ghost text-red-600 px-3"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rules */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Nội quy</h3>
                                <button type="button" onClick={addRule} className="btn btn-ghost text-sm">
                                    <Plus className="w-4 h-4" />
                                    Thêm
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.rules.map((rule, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={rule}
                                            onChange={(e) => updateRule(index, e.target.value)}
                                            className="input flex-1"
                                            placeholder="VD: Không hút thuốc"
                                        />
                                        {formData.rules.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRule(index)}
                                                className="btn btn-ghost text-red-600 px-3"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
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

export default EditAccommodationModal;
