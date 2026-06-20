import { useEffect, useState, useMemo } from 'react';
import {
    Search, Filter, MapPin, Star, ToggleLeft, ToggleRight,
    Bus, Building2, Utensils, Pencil, Plus, X,
    Loader2, Upload, Link as LinkIcon, Save, Eye, EyeOff
} from 'lucide-react';
import { getServices, updateServiceStatus } from '../../services/service.service';
import { getPartners } from '../../services/admin.service';
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
    const [partners, setPartners] = useState<any[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(false);

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
        ownerId: service.ownerId || '',
        type: service.type || 'transport',

        // Transport specific
        vehicleType: service.vehicleType || '',
        seats: service.seats || 0,
        routes: service.routes && service.routes.length > 0 
            ? service.routes.map((r: any) => typeof r === 'string' ? { name: r, price: service.priceRange?.min || 0 } : { name: r.name, price: r.price }) 
            : [{ name: '', price: 0 }],
        departureTime: service.departureTime && service.departureTime.length > 0 ? service.departureTime : [''],

        // Accommodation specific
        roomTypes: service.roomTypes && service.roomTypes.length > 0
            ? service.roomTypes.map((rt: any) => ({ name: rt.name, price: rt.price, capacity: rt.capacity || 2, available: rt.available || 1 }))
            : [{ name: '', price: 0, capacity: 2, available: 1 }],
        amenities: service.amenities && service.amenities.length > 0 ? service.amenities : [''],
        rules: service.rules && service.rules.length > 0 ? service.rules : [''],

        // Restaurant specific
        cuisine: service.cuisine && service.cuisine.length > 0 ? service.cuisine : [''],
        menuItems: service.menuItems && service.menuItems.length > 0
            ? service.menuItems.map((mi: any) => ({ name: mi.name, price: mi.price, description: mi.description || '', category: mi.category || '' }))
            : [{ name: '', price: 0, description: '', category: '' }],
        hasDelivery: service.hasDelivery === true,
        hasReservation: service.hasReservation === true,
    });

    useEffect(() => {
        const fetchPartnersList = async () => {
            try {
                setLoadingPartners(true);
                const result = await getPartners({ limit: 200 });
                setPartners(result.data || []);
            } catch (error) {
                console.error('Error fetching partners:', error);
            } finally {
                setLoadingPartners(false);
            }
        };
        fetchPartnersList();
    }, []);

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

    // Transport Helpers
    const addRoute = () => {
        setForm(f => ({ ...f, routes: [...f.routes, { name: '', price: 0 }] }));
    };
    const removeRoute = (index: number) => {
        const newRoutes = form.routes.filter((_: any, i: number) => i !== index);
        setForm(f => ({ ...f, routes: newRoutes.length > 0 ? newRoutes : [{ name: '', price: 0 }] }));
    };
    const updateRoute = (index: number, field: 'name' | 'price', value: any) => {
        const newRoutes = [...form.routes];
        newRoutes[index] = { ...newRoutes[index], [field]: value };
        setForm(f => ({ ...f, routes: newRoutes }));
    };

    const addDepartureTime = () => {
        setForm(f => ({ ...f, departureTime: [...f.departureTime, ''] }));
    };
    const removeDepartureTime = (index: number) => {
        const newTimes = form.departureTime.filter((_: any, i: number) => i !== index);
        setForm(f => ({ ...f, departureTime: newTimes.length > 0 ? newTimes : [''] }));
    };
    const updateDepartureTime = (index: number, value: string) => {
        const newTimes = [...form.departureTime];
        newTimes[index] = value;
        setForm(f => ({ ...f, departureTime: newTimes }));
    };

    // Accommodation Helpers
    const addRoomType = () => {
        setForm(f => ({ ...f, roomTypes: [...f.roomTypes, { name: '', price: 0, capacity: 2, available: 1 }] }));
    };
    const removeRoomType = (index: number) => {
        const newRoomTypes = form.roomTypes.filter((_: any, i: number) => i !== index);
        setForm(f => ({ ...f, roomTypes: newRoomTypes.length > 0 ? newRoomTypes : [{ name: '', price: 0, capacity: 2, available: 1 }] }));
    };
    const updateRoomType = (index: number, field: string, value: any) => {
        const newRoomTypes = [...form.roomTypes];
        newRoomTypes[index] = { ...newRoomTypes[index], [field]: value };
        setForm(f => ({ ...f, roomTypes: newRoomTypes }));
    };

    const addAmenity = () => setForm(f => ({ ...f, amenities: [...f.amenities, ''] }));
    const removeAmenity = (index: number) => {
        const newAmenities = form.amenities.filter((_: any, i: number) => i !== index);
        setForm(f => ({ ...f, amenities: newAmenities.length > 0 ? newAmenities : [''] }));
    };
    const updateAmenity = (index: number, value: string) => {
        const newAmenities = [...form.amenities];
        newAmenities[index] = value;
        setForm(f => ({ ...f, amenities: newAmenities }));
    };

    const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, ''] }));
    const removeRule = (index: number) => {
        const newRules = form.rules.filter((_: any, i: number) => i !== index);
        setForm(f => ({ ...f, rules: newRules.length > 0 ? newRules : [''] }));
    };
    const updateRule = (index: number, value: string) => {
        const newRules = [...form.rules];
        newRules[index] = value;
        setForm(f => ({ ...f, rules: newRules }));
    };

    // Restaurant Helpers
    const addCuisine = () => setForm(f => ({ ...f, cuisine: [...f.cuisine, ''] }));
    const removeCuisine = (index: number) => {
        const newCuisine = form.cuisine.filter((_: any, i: number) => i !== index);
        setForm(f => ({ ...f, cuisine: newCuisine.length > 0 ? newCuisine : [''] }));
    };
    const updateCuisine = (index: number, value: string) => {
        const newCuisine = [...form.cuisine];
        newCuisine[index] = value;
        setForm(f => ({ ...f, cuisine: newCuisine }));
    };

    const addMenuItem = () => {
        setForm(f => ({ ...f, menuItems: [...f.menuItems, { name: '', price: 0, description: '', category: '' }] }));
    };
    const removeMenuItem = (index: number) => {
        const newMenuItems = form.menuItems.filter((_: any, i: number) => i !== index);
        setForm(f => ({ ...f, menuItems: newMenuItems.length > 0 ? newMenuItems : [{ name: '', price: 0, description: '', category: '' }] }));
    };
    const updateMenuItem = (index: number, field: string, value: any) => {
        const newMenuItems = [...form.menuItems];
        newMenuItems[index] = { ...newMenuItems[index], [field]: value };
        setForm(f => ({ ...f, menuItems: newMenuItems }));
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.address.trim()) {
            toast.error('Tên và địa chỉ là bắt buộc');
            return;
        }
        if (!form.ownerId) {
            toast.error('Vui lòng chọn đối tác sở hữu dịch vụ');
            return;
        }
        try {
            setSaving(true);
            const payload: any = {
                name: form.name,
                type: form.type,
                description: form.description,
                address: form.address,
                city: form.city,
                district: form.district,
                ward: form.ward,
                openTime: form.openTime,
                closeTime: form.closeTime,
                isAvailable: form.isAvailable,
                status: form.status,
                latitude: parseFloat(form.latitude) || 0,
                longitude: parseFloat(form.longitude) || 0,
                images,
                ownerId: form.ownerId,
            };

            if (form.type === 'transport') {
                const cleanRoutes = form.routes
                    .filter((r: any) => r.name && r.name.trim())
                    .map((r: any) => ({ name: r.name.trim(), price: Number(r.price) }));
                
                payload.vehicleType = form.vehicleType;
                payload.seats = Number(form.seats) || 0;
                payload.routes = cleanRoutes;
                payload.departureTime = form.departureTime.filter((t: string) => t.trim());

                if (cleanRoutes.length > 0) {
                    const prices = cleanRoutes.map((r: any) => r.price);
                    payload.priceRange = {
                        min: Math.min(...prices),
                        max: Math.max(...prices)
                    };
                } else {
                    payload.priceRange = { min: 0, max: 0 };
                }
            } else if (form.type === 'accommodation') {
                const cleanRoomTypes = form.roomTypes
                    .filter((rt: any) => rt.name && rt.name.trim())
                    .map((rt: any) => ({
                        name: rt.name.trim(),
                        price: Number(rt.price),
                        capacity: Number(rt.capacity) || 2,
                        available: Number(rt.available) || 1,
                        images: rt.images || [],
                    }));
                payload.roomTypes = cleanRoomTypes;
                payload.amenities = form.amenities.filter((a: string) => a.trim());
                payload.rules = form.rules.filter((r: string) => r.trim());

                if (cleanRoomTypes.length > 0) {
                    const prices = cleanRoomTypes.map((rt: any) => rt.price);
                    payload.priceRange = {
                        min: Math.min(...prices),
                        max: Math.max(...prices)
                    };
                } else {
                    payload.priceRange = { min: 0, max: 0 };
                }
            } else if (form.type === 'restaurant') {
                const cleanMenuItems = form.menuItems
                    .filter((item: any) => item.name && item.name.trim())
                    .map((item: any) => ({
                        name: item.name.trim(),
                        price: Number(item.price),
                        description: item.description || '',
                        category: item.category || '',
                        image: item.image || '',
                    }));
                payload.menuItems = cleanMenuItems;
                payload.cuisine = form.cuisine.filter((c: string) => c.trim());
                payload.hasDelivery = form.hasDelivery;
                payload.hasReservation = form.hasReservation;

                if (cleanMenuItems.length > 0) {
                    const prices = cleanMenuItems.map((item: any) => item.price);
                    payload.priceRange = {
                        min: Math.min(...prices),
                        max: Math.max(...prices)
                    };
                } else {
                    payload.priceRange = {
                        min: parseInt(form.priceMin) || 0,
                        max: parseInt(form.priceMax) || 0,
                    };
                }
            }

            if (service.isNew) {
                const response = await api.post('/services', payload);
                if (response.data.success) {
                    toast.success('Đã tạo dịch vụ thành công');
                    onSaved({ ...response.data.data, id: response.data.data._id || response.data.data.id });
                    onClose();
                } else {
                    toast.error(response.data.message || 'Không thể tạo dịch vụ');
                }
            } else {
                await api.put(`/services/${service.id}`, payload);
                toast.success('Đã cập nhật dịch vụ');
                onSaved({ ...service, ...payload, id: service.id });
                onClose();
            }
        } catch (error: any) {
            console.error('Error saving service:', error);
            toast.error(error.response?.data?.message || 'Không thể lưu dịch vụ');
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
                        <h3 className="font-bold text-gray-900 text-lg">
                            {service.isNew ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}
                        </h3>
                        {!service.isNew && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{service.name}</p>
                        )}
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

                    {/* Service Type & Partner */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại dịch vụ</label>
                            <select
                                value={form.type}
                                onChange={e => set('type', e.target.value)}
                                disabled={!service.isNew}
                                className="input w-full bg-gray-55 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                <option value="transport">Nhà xe (Transport)</option>
                                <option value="accommodation">Nhà trọ (Accommodation)</option>
                                <option value="restaurant">Quán ăn (Restaurant)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                Đối tác sở hữu <span className="text-red-500">*</span>
                                {loadingPartners && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-450" />}
                            </label>
                            <select
                                value={form.ownerId}
                                onChange={e => set('ownerId', e.target.value)}
                                className="input w-full"
                            >
                                <option value="">-- Chọn đối tác sở hữu --</option>
                                {partners.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                        {p.fullName} ({p.email})
                                    </option>
                                ))}
                            </select>
                        </div>
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
                        {form.type !== 'transport' && form.type !== 'accommodation' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá thấp nhất (VNĐ)</label>
                                    <input type="number" value={form.priceMin} onChange={e => set('priceMin', e.target.value)} className="input w-full" min="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá cao nhất (VNĐ)</label>
                                    <input type="number" value={form.priceMax} onChange={e => set('priceMax', e.target.value)} className="input w-full" min="0" />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Transport Specific fields */}
                    {form.type === 'transport' && (
                        <>
                            <div className="border-t border-gray-100 pt-4 space-y-4">
                                <label className="block text-sm font-semibold text-gray-700">Thông tin xe & Giờ khởi hành</label>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại xe</label>
                                        <input value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className="input w-full" placeholder="VD: Xe giường nằm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số ghế</label>
                                        <input type="number" value={form.seats} onChange={e => set('seats', parseInt(e.target.value) || 0)} className="input w-full" min="0" />
                                    </div>
                                </div>
                            </div>

                            {/* Routes */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Tuyến đường & Giá vé</label>
                                    <button type="button" onClick={addRoute} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Thêm tuyến
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {form.routes.map((route: any, index: number) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={route.name}
                                                onChange={(e) => updateRoute(index, 'name', e.target.value)}
                                                className="input flex-1"
                                                placeholder="VD: Hòa Lạc - Nội thành"
                                            />
                                            <input
                                                type="number"
                                                value={route.price || 0}
                                                onChange={(e) => updateRoute(index, 'price', parseInt(e.target.value) || 0)}
                                                className="input w-36"
                                                placeholder="Giá vé"
                                                min="0"
                                            />
                                            {form.routes.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoute(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Departure Times */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Giờ khởi hành</label>
                                    <button type="button" onClick={addDepartureTime} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Thêm giờ
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {form.departureTime.map((time: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="time"
                                                value={time}
                                                onChange={(e) => updateDepartureTime(index, e.target.value)}
                                                className="input flex-1"
                                            />
                                            {form.departureTime.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeDepartureTime(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Accommodation Specific fields */}
                    {form.type === 'accommodation' && (
                        <>
                            {/* Room Types */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Các loại phòng</label>
                                    <button type="button" onClick={addRoomType} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Thêm loại phòng
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {form.roomTypes.map((room: any, index: number) => (
                                        <div key={index} className="border border-gray-150 rounded-xl p-3 space-y-3 bg-gray-50/50">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={room.name}
                                                    onChange={(e) => updateRoomType(index, 'name', e.target.value)}
                                                    className="input flex-1"
                                                    placeholder="Tên loại phòng (VD: Phòng đơn Standard)"
                                                />
                                                {form.roomTypes.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRoomType(index)}
                                                        className="p-2 text-red-500 hover:bg-red-55 rounded-lg"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Giá (VNĐ)</label>
                                                    <input
                                                        type="number"
                                                        value={room.price || 0}
                                                        onChange={(e) => updateRoomType(index, 'price', parseInt(e.target.value) || 0)}
                                                        className="input w-full text-sm"
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Sức chứa (Người)</label>
                                                    <input
                                                        type="number"
                                                        value={room.capacity || 2}
                                                        onChange={(e) => updateRoomType(index, 'capacity', parseInt(e.target.value) || 2)}
                                                        className="input w-full text-sm"
                                                        min="1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Số phòng trống</label>
                                                    <input
                                                        type="number"
                                                        value={room.available || 1}
                                                        onChange={(e) => updateRoomType(index, 'available', parseInt(e.target.value) || 1)}
                                                        className="input w-full text-sm"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Tiện ích</label>
                                    <button type="button" onClick={addAmenity} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Thêm tiện ích
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {form.amenities.map((amenity: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={amenity}
                                                onChange={(e) => updateAmenity(index, e.target.value)}
                                                className="input flex-1"
                                                placeholder="VD: Wifi miễn phí"
                                            />
                                            {form.amenities.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeAmenity(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rules */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Nội quy</label>
                                    <button type="button" onClick={addRule} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Thêm nội quy
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {form.rules.map((rule: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={rule}
                                                onChange={(e) => updateRule(index, e.target.value)}
                                                className="input flex-1"
                                                placeholder="VD: Không làm ồn sau 22:00"
                                            />
                                            {form.rules.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRule(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Restaurant Specific fields */}
                    {form.type === 'restaurant' && (
                        <>
                            {/* Cuisine */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Ẩm thực</label>
                                    <button type="button" onClick={addCuisine} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Thêm ẩm thực
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {form.cuisine.map((cuisine: string, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={cuisine}
                                                onChange={(e) => updateCuisine(index, e.target.value)}
                                                className="input flex-1"
                                                placeholder="VD: Đồ uống / Đồ nướng"
                                            />
                                            {form.cuisine.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCuisine(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">Danh sách món ăn (Menu)</label>
                                    <button type="button" onClick={addMenuItem} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Thêm món ăn
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {form.menuItems.map((item: any, index: number) => (
                                        <div key={index} className="border border-gray-150 rounded-xl p-3 space-y-3 bg-gray-50/50">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                                                    className="input flex-1"
                                                    placeholder="Tên món ăn (VD: Lẩu Thái)"
                                                />
                                                {form.menuItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMenuItem(index)}
                                                        className="p-2 text-red-500 hover:bg-red-55 rounded-lg"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Giá tiền (VNĐ)</label>
                                                    <input
                                                        type="number"
                                                        value={item.price || 0}
                                                        onChange={(e) => updateMenuItem(index, 'price', parseInt(e.target.value) || 0)}
                                                        className="input w-full text-sm"
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Phân loại món</label>
                                                    <input
                                                        type="text"
                                                        value={item.category}
                                                        onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                                                        className="input w-full text-sm"
                                                        placeholder="VD: Món chính"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Mô tả món ăn</label>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                                                        className="input w-full text-sm"
                                                        placeholder="VD: Nhiều topping đặc biệt..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="border-t border-gray-100 pt-4 flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.hasDelivery} onChange={e => set('hasDelivery', e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
                                    <span className="text-sm text-gray-700">Có giao hàng</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.hasReservation} onChange={e => set('hasReservation', e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
                                    <span className="text-sm text-gray-700">Cho đặt bàn trước</span>
                                </label>
                            </div>
                        </>
                    )}

                    {/* Status */}
                    <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4">
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
                        {service.isNew ? 'Tạo mới dịch vụ' : 'Lưu thay đổi'}
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

    const handleSaved = (saved: any) => {
        setServices(prev => {
            const exists = prev.some(s => s.id === saved.id);
            if (exists) {
                return prev.map(s => s.id === saved.id ? { ...s, ...saved } : s);
            }
            return [saved, ...prev];
        });
    };

    const handleStatusChange = async (serviceId: string, isAvailable: boolean) => {
        try {
            const newStatus = isAvailable ? 'suspended' : 'active';
            const success = await updateServiceStatus(serviceId, newStatus);
            if (success) {
                toast.success('Đã ẩn dịch vụ khỏi danh sách');
                setServices(prev => prev.filter(s => s.id !== serviceId));
            }
        } catch (error: any) {
            toast.error(error.message || 'Không thể cập nhật trạng thái dịch vụ');
        }
    };

    const handleAddClick = () => {
        setEditingService({
            isNew: true,
            type: 'transport',
            name: '',
            description: '',
            address: '',
            city: '',
            district: '',
            ward: '',
            images: [],
            openTime: '08:00',
            closeTime: '22:00',
            priceRange: { min: 0, max: 0 },
            isAvailable: true,
            status: 'pending',
            ownerId: '',
            vehicleType: '',
            seats: 0,
            routes: [{ name: '', price: 0 }],
            departureTime: [''],
            roomTypes: [{ name: '', price: 0, capacity: 2, available: 1 }],
            amenities: [''],
            rules: [''],
            cuisine: [''],
            menuItems: [{ name: '', price: 0, description: '', category: '' }],
            hasDelivery: false,
            hasReservation: false,
        });
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">Quản lý dịch vụ</h1>
                    <p className="text-gray-500">Theo dõi tất cả dịch vụ nhà xe, nhà trọ, quán ăn trên hệ thống</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="self-start sm:self-auto px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-md shadow-primary-200"
                >
                    <Plus className="w-4 h-4" /> Thêm dịch vụ
                </button>
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
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingService(service)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                                                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange(service.id, true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-red-600 bg-red-50 hover:bg-red-100"
                                                title="Ẩn dịch vụ khỏi danh sách"
                                            >
                                                <EyeOff className="w-3.5 h-3.5" /> Ẩn
                                            </button>
                                        </div>
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
