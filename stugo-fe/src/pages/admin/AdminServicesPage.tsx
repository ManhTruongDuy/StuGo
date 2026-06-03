import { useEffect, useState, useMemo } from 'react';
import {
    Search, Filter, MapPin, Star, ToggleLeft, ToggleRight,
    Bus, Building2, Utensils, Pencil, Plus, X,
    Loader2, Upload, Link as LinkIcon, Save,
} from 'lucide-react';
import { getServices } from '../../services/service.service';
import api from '../../services/api';
import type { Service, ServiceType } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type TypeFilter = 'all' | ServiceType;
type StatusFilter = 'all' | 'active' | 'inactive';

// ── Drag & Drop Image Upload ──────────────────────────────────────────────────
const ImageDropZone = ({
    images,
    onAdd,
    onRemove,
}: {
    images: string[];
    onAdd: (urls: string[]) => void;
    onRemove: (index: number) => void;
}) => {
    const [dragging, setDragging] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const readFiles = (files: FileList) => {
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onloadend = () => onAdd([reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) readFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);

    const addUrl = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        if (!trimmed.startsWith('http')) { toast.error('URL phải bắt đầu bằng http://'); return; }
        onAdd([trimmed]);
        setUrlInput('');
    };

    return (
        <div className="space-y-3">
            {/* URL input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                        placeholder="Dán URL ảnh..."
                        className="input w-full pl-9 text-sm"
                    />
                </div>
                <button type="button" onClick={addUrl}
                    className="px-3 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 text-sm font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Thêm
                </button>
            </div>

            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-4 transition-colors ${dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
                {images.length === 0 ? (
                    <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">Kéo thả ảnh vào đây hoặc <span className="text-primary-500 font-medium">chọn file</span></p>
                        <input type="file" accept="image/*" multiple className="hidden"
                            onChange={(e) => e.target.files && readFiles(e.target.files)} />
                    </label>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative group aspect-square">
                                <img src={img} alt="" className="w-full h-full object-cover rounded-lg bg-gray-100"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'; }} />
                                <button type="button" onClick={() => onRemove(i)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                            <Plus className="w-5 h-5 text-gray-300" />
                            <input type="file" accept="image/*" multiple className="hidden"
                                onChange={(e) => e.target.files && readFiles(e.target.files)} />
                        </label>
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-400">Hỗ trợ kéo thả file, chọn file từ máy, hoặc dán URL ảnh</p>
        </div>
    );
};

// ── Full Edit Modal ───────────────────────────────────────────────────────────
const ServiceEditModal = ({
    service,
    onClose,
    onSaved,
}: {
    service: any;
    onClose: () => void;
    onSaved: (updated: any) => void;
}) => {
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<string[]>(service.images || []);
    const [form, setForm] = useState({
        name: service.name || '',
        description: service.description || '',
        address: service.address || '',
        city: service.city || '',
        district: service.district || '',
        ward: service.ward || '',
        openTime: service.openTime || '08:00',
        closeTime: service.closeTime || '22:00',
        priceMin: service.priceRange?.min?.toString() || '',
        priceMax: service.priceRange?.max?.toString() || '',
        isAvailable: service.isAvailable !== false,
        status: service.status || 'active',
        latitude: service.latitude?.toString() || '',
        longitude: service.longitude?.toString() || '',
    });

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

    const handleSave = async () => {
        if (!form.name.trim() || !form.address.trim()) {
            toast.error('Tên và địa chỉ là bắt buộc');
            return;
        }
        try {
            setSaving(true);
            const payload = {
                name: form.name,
                description: form.description,
                address: form.address,
                city: form.city,
                district: form.district,
                ward: form.ward,
                openTime: form.openTime,
                closeTime: form.closeTime,
                priceRange: {
                    min: parseInt(form.priceMin) || 0,
                    max: parseInt(form.priceMax) || 0,
                },
                isAvailable: form.isAvailable,
                status: form.status,
                latitude: parseFloat(form.latitude) || 0,
                longitude: parseFloat(form.longitude) || 0,
                images,
            };
            await api.put(`/services/${service.id}`, payload);
            toast.success('Đã cập nhật dịch vụ');
            onSaved({ ...service, ...payload, id: service.id });
            onClose();
        } catch {
            toast.error('Không thể cập nhật dịch vụ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Chỉnh sửa dịch vụ</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{service.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Images */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hình ảnh</label>
                        <ImageDropZone
                            images={images}
                            onAdd={(urls) => setImages(prev => [...prev, ...urls])}
                            onRemove={(i) => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        />
                    </div>

                    {/* Basic info */}
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên dịch vụ <span className="text-red-500">*</span></label>
                            <input value={form.name} onChange={e => set('name', e.target.value)} className="input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input w-full" />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ & Tọa độ</label>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <input value={form.address} onChange={e => set('address', e.target.value)} className="input w-full" placeholder="Địa chỉ *" />
                            </div>
                            <input value={form.city} onChange={e => set('city', e.target.value)} className="input" placeholder="Thành phố" />
                            <input value={form.district} onChange={e => set('district', e.target.value)} className="input" placeholder="Quận/Huyện" />
                            <input value={form.ward} onChange={e => set('ward', e.target.value)} className="input sm:col-span-2" placeholder="Phường/Xã" />
                            <input type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)} className="input" placeholder="Vĩ độ (Latitude)" />
                            <input type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)} className="input" placeholder="Kinh độ (Longitude)" />
                        </div>
                    </div>

                    {/* Hours & Price */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa</label>
                            <input type="time" value={form.openTime} onChange={e => set('openTime', e.target.value)} className="input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đóng cửa</label>
                            <input type="time" value={form.closeTime} onChange={e => set('closeTime', e.target.value)} className="input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá thấp nhất (VNĐ)</label>
                            <input type="number" value={form.priceMin} onChange={e => set('priceMin', e.target.value)} className="input w-full" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá cao nhất (VNĐ)</label>
                            <input type="number" value={form.priceMax} onChange={e => set('priceMax', e.target.value)} className="input w-full" min="0" />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isAvailable} onChange={e => set('isAvailable', e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
                            <span className="text-sm text-gray-700">Đang hoạt động</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Trạng thái duyệt:</label>
                            <select value={form.status} onChange={e => set('status', e.target.value)} className="input py-1 text-sm">
                                <option value="active">Đã duyệt</option>
                                <option value="pending">Chờ duyệt</option>
                                <option value="rejected">Từ chối</option>
                                <option value="suspended">Tạm khóa</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminServicesPage = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [editingService, setEditingService] = useState<any | null>(null);

    useEffect(() => {
        const fetchAllServices = async () => {
            try {
                setLoading(true);
                const response = await getServices({ limit: 200, sortBy: 'newest' });
                setServices(response.data || []);
            } catch (error) {
                console.error('Error fetching services for admin:', error);
                toast.error('Không thể tải danh sách dịch vụ');
            } finally {
                setLoading(false);
            }
        };
        fetchAllServices();
    }, []);

    const filteredServices = useMemo(() => {
        return services.filter((service) => {
            const matchesType = typeFilter === 'all' || service.type === typeFilter;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' ? service.isAvailable : !service.isAvailable);
            const matchesSearch = !searchQuery ||
                service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.district.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesStatus && matchesSearch;
        });
    }, [services, typeFilter, statusFilter, searchQuery]);

    const stats = useMemo(() => ({
        total: services.length,
        transport: services.filter(s => s.type === 'transport').length,
        accommodation: services.filter(s => s.type === 'accommodation').length,
        active: services.filter(s => s.isAvailable).length,
    }), [services]);

    const getTypeBadge = (type: ServiceType) => {
        const map: Record<ServiceType, { label: string; icon: any; cls: string }> = {
            transport: { label: 'Nhà xe', icon: Bus, cls: 'bg-blue-100 text-blue-700' },
            accommodation: { label: 'Nhà trọ', icon: Building2, cls: 'bg-purple-100 text-purple-700' },
            restaurant: { label: 'Quán ăn', icon: Utensils, cls: 'bg-orange-100 text-orange-700' },
        };
        const t = map[type];
        if (!t) return null;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${t.cls}`}>
                <t.icon className="w-3 h-3" />{t.label}
            </span>
        );
    };

    const formatPriceRange = (service: Service) => {
        const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
        if (!service.priceRange?.min && !service.priceRange?.max) return 'Liên hệ';
        if (service.priceRange.min && service.priceRange.max)
            return `${fmt.format(service.priceRange.min)} - ${fmt.format(service.priceRange.max)}`;
        if (service.priceRange.min) return `Từ ${fmt.format(service.priceRange.min)}`;
        return `Đến ${fmt.format(service.priceRange.max)}`;
    };

    const handleSaved = (updated: any) => {
        setServices(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            {editingService && (
                <ServiceEditModal
                    service={editingService}
                    onClose={() => setEditingService(null)}
                    onSaved={handleSaved}
                />
            )}

            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Quản lý dịch vụ</h1>
                <p className="text-gray-500">Theo dõi tất cả dịch vụ nhà xe, nhà trọ, quán ăn trên hệ thống</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng dịch vụ', value: stats.total, color: 'text-gray-900' },
                    { label: 'Nhà xe', value: stats.transport, color: 'text-blue-600' },
                    { label: 'Nhà trọ', value: stats.accommodation, color: 'text-purple-600' },
                    { label: 'Đang hoạt động', value: stats.active, color: 'text-green-600' },
                ].map((s, i) => (
                    <div key={i} className="card p-4">
                        <p className="text-sm text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo tên, thành phố, quận/huyện..." className="input pl-10 w-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className="input w-full sm:w-44">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(['all', 'transport', 'accommodation', 'restaurant'] as const).map(t => (
                        <button key={t} onClick={() => setTypeFilter(t)}
                            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${typeFilter === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {t === 'transport' && <Bus className="w-4 h-4" />}
                            {t === 'accommodation' && <Building2 className="w-4 h-4" />}
                            {t === 'restaurant' && <Utensils className="w-4 h-4" />}
                            {t === 'all' ? 'Tất cả' : t === 'transport' ? 'Nhà xe' : t === 'accommodation' ? 'Nhà trọ' : 'Quán ăn'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Dịch vụ', 'Loại', 'Địa chỉ', 'Giá', 'Đánh giá', 'Trạng thái', ''].map(h => (
                                    <th key={h} className="px-6 py-4 text-left text-sm font-medium text-gray-500">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredServices.length > 0 ? filteredServices.map(service => (
                                <tr key={service.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                {service.images?.[0]
                                                    ? <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover" />
                                                    : <MapPin className="w-6 h-6 text-gray-400 m-auto mt-3" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 line-clamp-1">{service.name}</p>
                                                <p className="text-xs text-gray-400">{service.images?.length || 0} ảnh</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getTypeBadge(service.type)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-start gap-1.5">
                                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="line-clamp-1">{service.address}</p>
                                                <p className="text-xs text-gray-400">{service.district}, {service.city}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatPriceRange(service)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-medium">{service.rating.toFixed(1)}</span>
                                            <span className="text-xs text-gray-400">({service.reviewCount})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {service.isAvailable
                                            ? <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><ToggleRight className="w-3 h-3" />Hoạt động</span>
                                            : <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><ToggleLeft className="w-3 h-3" />Tạm dừng</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => setEditingService(service)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                                            <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Không có dịch vụ nào phù hợp với bộ lọc
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminServicesPage;
