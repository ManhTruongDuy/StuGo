import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { createCombo } from '../../services/combo.service';
import toast from 'react-hot-toast';

const AdminCreateComboPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        thumbnail: '',
        images: [''],
        destination: '',
        duration: '',
        accommodationName: '',
        transportType: '',
        includes: [''],
        excludes: [''],
        termsAndConditions: [''],
        pricing: {
            servedPrice: 0,
            unservedPrice: 0,
            privateRentalPrice: 0
        }
    });

    const handleArrayChange = (field: 'images' | 'includes' | 'excludes' | 'termsAndConditions', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const addArrayItem = (field: 'images' | 'includes' | 'excludes' | 'termsAndConditions') => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const removeArrayItem = (field: 'images' | 'includes' | 'excludes' | 'termsAndConditions', index: number) => {
        const newArray = [...formData[field]];
        newArray.splice(index, 1);
        if (newArray.length === 0) newArray.push('');
        setFormData({ ...formData, [field]: newArray });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Clean up empty array items
            const cleanedData = {
                ...formData,
                images: formData.images.filter(img => img.trim() !== ''),
                includes: formData.includes.filter(i => i.trim() !== ''),
                excludes: formData.excludes.filter(e => e.trim() !== ''),
                termsAndConditions: formData.termsAndConditions.filter(t => t.trim() !== ''),
            };

            await createCombo(cleanedData);
            toast.success('Tạo Combo thành công');
            navigate('/admin/combos');
        } catch (error: any) {
            console.error('Lỗi khi tạo Combo:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo Combo');
        } finally {
            setLoading(false);
        }
    };

    const renderArrayInput = (title: string, field: 'images' | 'includes' | 'excludes' | 'termsAndConditions', placeholder: string) => (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{title}</label>
            {formData[field].map((item, index) => (
                <div key={index} className="flex gap-2">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => handleArrayChange(field, index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                        placeholder={placeholder}
                    />
                    <button
                        type="button"
                        onClick={() => removeArrayItem(field, index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => addArrayItem(field)}
                className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700"
            >
                <Plus className="w-4 h-4" /> Thêm dòng
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tạo Combo / Tour</h1>
                        <p className="text-gray-500 mt-1">Điền thông tin chi tiết cho gói du lịch trọn gói mới</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2 sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Tên Combo <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="Vd: Combo 2N1Đ Sapa Mù Sương..."
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Ảnh đại diện (URL) <span className="text-red-500">*</span></label>
                        <input
                            type="url"
                            required
                            value={formData.thumbnail}
                            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Điểm đến <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="Vd: Sapa, Lào Cai"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Thời gian (Lịch trình) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="Vd: 2 Ngày 1 Đêm"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Nơi lưu trú (Khách sạn) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.accommodationName}
                            onChange={(e) => setFormData({ ...formData, accommodationName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="Vd: Khách sạn 4 sao Pao's Sapa"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Phương tiện di chuyển <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.transportType}
                            onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="Vd: Xe Limousine giường nằm cao cấp"
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Cấu hình Giá Bán (VNĐ)</h3>
                    <div className="grid sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Giá có tài xế phục vụ</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.pricing.servedPrice || ''}
                                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, servedPrice: parseInt(e.target.value) || 0 } })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Giá chỉ đưa đón (Ko phục vụ)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.pricing.unservedPrice || ''}
                                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, unservedPrice: parseInt(e.target.value) || 0 } })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Giá thuê nguyên chuyến</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.pricing.privateRentalPrice || ''}
                                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, privateRentalPrice: parseInt(e.target.value) || 0 } })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-8">
                    {renderArrayInput('Thư viện ảnh phụ (URLs)', 'images', 'https://...')}
                    {renderArrayInput('Giá đã bao gồm (Includes)', 'includes', 'Vd: Ăn sáng buffet...')}
                    {renderArrayInput('Giá chưa bao gồm (Excludes)', 'excludes', 'Vd: Chi phí cá nhân...')}
                    {renderArrayInput('Điều khoản & Chính sách', 'termsAndConditions', 'Vd: Hủy trước 24h hoàn 50%...')}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Đang lưu...' : 'Lưu Combo'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCreateComboPage;
