import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { createCombo, getComboById, updateCombo } from '../../services/combo.service';
import { getServices } from '../../services/service.service';
import type { Service } from '../../types';
import toast from 'react-hot-toast';
import ImageDropzone from '../../components/ui/ImageDropzone';

type ArrayField = 'images' | 'includes' | 'excludes' | 'termsAndConditions';

interface LinkedServiceRow {
    serviceId: string;
    supplierId: string;
    netPriceAtBooking: number;
}

const EMPTY_LINKED_SERVICE: LinkedServiceRow = {
    serviceId: '',
    supplierId: '',
    netPriceAtBooking: 0,
};

const AdminCreateComboPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [services, setServices] = useState<Service[]>([]);

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
        linkedServices: [EMPTY_LINKED_SERVICE],
        pricing: {
            servedPrice: 0,
            unservedPrice: 0,
            privateRentalPrice: 0,
        },
    });

    const serviceMap = useMemo(() => {
        return services.reduce<Record<string, Service>>((acc, service) => {
            acc[service.id] = service;
            return acc;
        }, {});
    }, [services]);

    useEffect(() => {
        const fetchServices = async () => {
            setServicesLoading(true);
            try {
                const response = await getServices({
                    status: 'active',
                    limit: 200,
                });
                setServices(response.data || []);
            } catch (error) {
                console.error('Error fetching services for combo:', error);
                toast.error('Không thể tải danh sách dịch vụ liên kết');
            } finally {
                setServicesLoading(false);
            }
        };

        fetchServices();
    }, []);

    useEffect(() => {
        if (!isEditMode || !id) return;

        const fetchCombo = async () => {
            setPageLoading(true);
            try {
                const result = await getComboById(id);
                const combo = result?.data;
                if (!combo) {
                    toast.error('Không tìm thấy combo cần chỉnh sửa');
                    navigate('/admin/combos');
                    return;
                }

                const linkedServices = (combo.linkedServices || []).map((ls: any) => ({
                    serviceId: typeof ls.serviceId === 'object' ? (ls.serviceId?._id || ls.serviceId?.id || '') : (ls.serviceId || ''),
                    supplierId: typeof ls.supplierId === 'object' ? (ls.supplierId?._id || ls.supplierId?.id || '') : (ls.supplierId || ''),
                    netPriceAtBooking: Number(ls.netPriceAtBooking || 0),
                }));

                setFormData({
                    name: combo.name || '',
                    thumbnail: combo.thumbnail || '',
                    images: combo.images?.length ? combo.images : [''],
                    destination: combo.destination || '',
                    duration: combo.duration || '',
                    accommodationName: combo.accommodationName || '',
                    transportType: combo.transportType || '',
                    includes: combo.includes?.length ? combo.includes : [''],
                    excludes: combo.excludes?.length ? combo.excludes : [''],
                    termsAndConditions: combo.termsAndConditions?.length ? combo.termsAndConditions : [''],
                    linkedServices: linkedServices.length ? linkedServices : [EMPTY_LINKED_SERVICE],
                    pricing: {
                        servedPrice: Number(combo.pricing?.servedPrice || 0),
                        unservedPrice: Number(combo.pricing?.unservedPrice || 0),
                        privateRentalPrice: Number(combo.pricing?.privateRentalPrice || 0),
                    },
                });
            } catch (error) {
                console.error('Error fetching combo detail:', error);
                toast.error('Không thể tải thông tin combo');
            } finally {
                setPageLoading(false);
            }
        };

        fetchCombo();
    }, [id, isEditMode, navigate]);

    const handleArrayChange = (field: ArrayField, index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const addArrayItem = (field: ArrayField) => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const removeArrayItem = (field: ArrayField, index: number) => {
        const newArray = [...formData[field]];
        newArray.splice(index, 1);
        if (newArray.length === 0) newArray.push('');
        setFormData({ ...formData, [field]: newArray });
    };

    const addLinkedService = () => {
        setFormData({
            ...formData,
            linkedServices: [...formData.linkedServices, { ...EMPTY_LINKED_SERVICE }],
        });
    };

    const removeLinkedService = (index: number) => {
        const next = formData.linkedServices.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            linkedServices: next.length ? next : [{ ...EMPTY_LINKED_SERVICE }],
        });
    };

    const handleLinkedServiceChange = (index: number, field: keyof LinkedServiceRow, value: string | number) => {
        const next = [...formData.linkedServices];
        const row = { ...next[index] };

        if (field === 'serviceId') {
            const serviceId = String(value);
            const selected = serviceMap[serviceId];
            row.serviceId = serviceId;
            row.supplierId = selected?.ownerId || '';
            next[index] = row;
            setFormData({ ...formData, linkedServices: next });
            return;
        }

        if (field === 'netPriceAtBooking') {
            row.netPriceAtBooking = Number(value) || 0;
        } else {
            row[field] = String(value) as never;
        }

        next[index] = row;
        setFormData({ ...formData, linkedServices: next });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            const linkedServicesPayload = formData.linkedServices
                .filter((ls) => ls.serviceId)
                .map((ls) => ({
                    serviceId: ls.serviceId,
                    supplierId: ls.supplierId,
                    netPriceAtBooking: Number(ls.netPriceAtBooking || 0),
                }));

            const cleanedData = {
                ...formData,
                images: formData.images.filter((img) => img.trim() !== ''),
                includes: formData.includes.filter((item) => item.trim() !== ''),
                excludes: formData.excludes.filter((item) => item.trim() !== ''),
                termsAndConditions: formData.termsAndConditions.filter((item) => item.trim() !== ''),
                linkedServices: linkedServicesPayload,
            };

            if (isEditMode && id) {
                await updateCombo(id, cleanedData);
                toast.success('Cập nhật Combo thành công');
            } else {
                await createCombo(cleanedData);
                toast.success('Tạo Combo thành công');
            }

            navigate('/admin/combos');
        } catch (error: any) {
            console.error('Lỗi khi lưu Combo:', error);
            toast.error(error.response?.data?.message || 'Không thể lưu Combo');
        } finally {
            setLoading(false);
        }
    };

    const renderArrayInput = (title: string, field: ArrayField, placeholder: string) => (
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

    if (pageLoading) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">Đang tải dữ liệu combo...</div>
        );
    }

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
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? 'Chỉnh sửa Combo / Tour' : 'Tạo Combo / Tour'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isEditMode
                                ? 'Cập nhật thông tin combo, giá bán và dịch vụ liên kết'
                                : 'Điền thông tin chi tiết cho gói du lịch trọn gói mới'}
                        </p>
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

                    <div className="sm:col-span-2 mb-4">
                        <ImageDropzone
                            label="Ảnh đại diện (Thumbnail) *"
                            value={formData.thumbnail}
                            onChange={(val) => setFormData({ ...formData, thumbnail: val })}
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
                        <label className="block text-sm font-medium text-gray-700">Nơi lưu trú (Khách sạn)</label>
                        <input
                            type="text"
                            value={formData.accommodationName}
                            onChange={(e) => setFormData({ ...formData, accommodationName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="Vd: Khách sạn 4 sao Pao's Sapa"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Phương tiện di chuyển</label>
                        <input
                            type="text"
                            value={formData.transportType}
                            onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                            placeholder="Vd: Xe Limousine giường nằm cao cấp"
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Dịch vụ liên kết</h3>
                    <div className="space-y-3">
                        {formData.linkedServices.map((row, index) => {
                            const selectedService = row.serviceId ? serviceMap[row.serviceId] : null;

                            return (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50/60">
                                    <div className="md:col-span-6">
                                        <label className="block text-xs text-gray-500 mb-1">Dịch vụ</label>
                                        <select
                                            value={row.serviceId}
                                            onChange={(e) => handleLinkedServiceChange(index, 'serviceId', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                                            disabled={servicesLoading}
                                        >
                                            <option value="">Chọn dịch vụ liên kết</option>
                                            {services.map((service) => (
                                                <option key={service.id} value={service.id}>
                                                    {service.name} - {service.type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-xs text-gray-500 mb-1">Giá net snapshot</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.netPriceAtBooking || ''}
                                            onChange={(e) => handleLinkedServiceChange(index, 'netPriceAtBooking', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">Supplier</label>
                                        <input
                                            type="text"
                                            value={selectedService?.owner?.fullName || row.supplierId || 'Tự động theo dịch vụ'}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                                            disabled
                                        />
                                    </div>

                                    <div className="md:col-span-1 flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => removeLinkedService(index)}
                                            className="w-full md:w-auto p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            title="Xóa dịch vụ liên kết"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={addLinkedService}
                            className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700"
                        >
                            <Plus className="w-4 h-4" /> Thêm dịch vụ liên kết
                        </button>
                        <p className="text-xs text-gray-500">Supplier sẽ tự nhận theo dịch vụ đã chọn. Bạn có thể nhập giá net để đối soát.</p>
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
                                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, servedPrice: parseInt(e.target.value, 10) || 0 } })}
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
                                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, unservedPrice: parseInt(e.target.value, 10) || 0 } })}
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
                                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, privateRentalPrice: parseInt(e.target.value, 10) || 0 } })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Thư viện ảnh phụ</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {formData.images.map((img, index) => (
                                <ImageDropzone
                                    key={index}
                                    label={`Ảnh ${index + 1}`}
                                    value={img}
                                    onChange={(val) => handleArrayChange('images', index, val)}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => addArrayItem('images')}
                            className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700"
                        >
                            <Plus className="w-4 h-4" /> Thêm ảnh khác
                        </button>
                    </div>

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
                        {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật Combo' : 'Lưu Combo'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCreateComboPage;
