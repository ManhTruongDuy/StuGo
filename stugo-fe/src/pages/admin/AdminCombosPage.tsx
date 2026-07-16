import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Trash2, Eye, Loader2, FileText, Pencil, X, Save } from 'lucide-react';
import { getCombos, deleteCombo, getComboById, updateCombo, type Combo } from '../../services/combo.service';
import { getServices } from '../../services/service.service';
import type { Service } from '../../types';
import toast from 'react-hot-toast';

interface LinkedServiceRow {
    serviceId: string;
    supplierId: string;
    netPriceAtBooking: number;
}

const ComboViewModal = ({ combo, onClose }: { combo: any; onClose: () => void }) => {
    if (!combo) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900">Chi tiết Combo</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {combo.thumbnail ? (
                                <img src={combo.thumbnail} alt={combo.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">{combo.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{combo.destination} - {combo.duration}</p>
                            <p className="text-sm text-gray-500 mt-1">{combo.linkedServices?.length || 0} dịch vụ liên kết</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-xl border border-gray-100 p-3">
                            <p className="text-gray-500">Giá phục vụ</p>
                            <p className="font-semibold">{Number(combo.pricing?.servedPrice || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 p-3">
                            <p className="text-gray-500">Giá không phục vụ</p>
                            <p className="font-semibold">{Number(combo.pricing?.unservedPrice || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 p-3">
                            <p className="text-gray-500">Giá nguyên chuyến</p>
                            <p className="font-semibold">{Number(combo.pricing?.privateRentalPrice || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                    </div>

                    <div>
                        <h5 className="font-medium text-gray-900 mb-3">Dịch vụ liên kết</h5>
                        {!combo.linkedServices || combo.linkedServices.length === 0 ? (
                            <p className="text-sm text-gray-500">Chưa có dịch vụ liên kết.</p>
                        ) : (
                            <div className="space-y-2">
                                {combo.linkedServices.map((ls: any, index: number) => {
                                    const service = ls.serviceId;
                                    const supplier = ls.supplierId;
                                    return (
                                        <div key={`${service?._id || service?.id || index}`} className="rounded-xl border border-gray-100 p-3">
                                            <p className="font-medium text-gray-900">{service?.name || 'Dịch vụ không còn tồn tại'}</p>
                                            <p className="text-sm text-gray-600">
                                                {service?.type || '-'} | Nhà cung cấp: {supplier?.fullName || supplier || '-'} | Giá net: {Number(ls.netPriceAtBooking || 0).toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComboEditModal = ({
    comboId,
    onClose,
    onSaved,
}: {
    comboId: string;
    onClose: () => void;
    onSaved: () => void;
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        destination: '',
        duration: '',
        accommodationName: '',
        transportType: '',
        status: 'pending',
        pricing: {
            servedPrice: 0,
            unservedPrice: 0,
            privateRentalPrice: 0,
        },
        linkedServices: [{ serviceId: '', supplierId: '', netPriceAtBooking: 0 } as LinkedServiceRow],
    });

    const serviceMap = useMemo(() => {
        return services.reduce<Record<string, Service>>((acc, service) => {
            acc[service.id] = service;
            return acc;
        }, {});
    }, [services]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [comboResult, servicesResult] = await Promise.all([
                    getComboById(comboId),
                    getServices({ status: 'active', limit: 200 }),
                ]);

                const combo = comboResult?.data;
                setServices(servicesResult.data || []);

                const linkedServices = (combo?.linkedServices || []).map((ls: any) => ({
                    serviceId: typeof ls.serviceId === 'object' ? (ls.serviceId?._id || ls.serviceId?.id || '') : (ls.serviceId || ''),
                    supplierId: typeof ls.supplierId === 'object' ? (ls.supplierId?._id || ls.supplierId?.id || '') : (ls.supplierId || ''),
                    netPriceAtBooking: Number(ls.netPriceAtBooking || 0),
                }));

                setFormData({
                    name: combo?.name || '',
                    destination: combo?.destination || '',
                    duration: combo?.duration || '',
                    accommodationName: combo?.accommodationName || '',
                    transportType: combo?.transportType || '',
                    status: combo?.status || 'pending',
                    pricing: {
                        servedPrice: Number(combo?.pricing?.servedPrice || 0),
                        unservedPrice: Number(combo?.pricing?.unservedPrice || 0),
                        privateRentalPrice: Number(combo?.pricing?.privateRentalPrice || 0),
                    },
                    linkedServices: linkedServices.length ? linkedServices : [{ serviceId: '', supplierId: '', netPriceAtBooking: 0 }],
                });
            } catch (error) {
                console.error('Error loading combo edit data:', error);
                toast.error('Không thể tải dữ liệu chỉnh sửa combo');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [comboId]);

    const addLinkedService = () => {
        setFormData((prev) => ({
            ...prev,
            linkedServices: [...prev.linkedServices, { serviceId: '', supplierId: '', netPriceAtBooking: 0 }],
        }));
    };

    const removeLinkedService = (index: number) => {
        setFormData((prev) => {
            const next = prev.linkedServices.filter((_, i) => i !== index);
            return {
                ...prev,
                linkedServices: next.length ? next : [{ serviceId: '', supplierId: '', netPriceAtBooking: 0 }],
            };
        });
    };

    const handleLinkedServiceChange = (index: number, field: keyof LinkedServiceRow, value: string | number) => {
        setFormData((prev) => {
            const next = [...prev.linkedServices];
            const row = { ...next[index] };

            if (field === 'serviceId') {
                const serviceId = String(value);
                const selected = serviceMap[serviceId];
                row.serviceId = serviceId;
                row.supplierId = selected?.ownerId || '';
            } else if (field === 'netPriceAtBooking') {
                row.netPriceAtBooking = Number(value) || 0;
            } else {
                row[field] = String(value) as never;
            }

            next[index] = row;
            return { ...prev, linkedServices: next };
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const linkedServices = formData.linkedServices
                .filter((item) => item.serviceId)
                .map((item) => ({
                    serviceId: item.serviceId,
                    supplierId: item.supplierId,
                    netPriceAtBooking: Number(item.netPriceAtBooking || 0),
                }));

            await updateCombo(comboId, {
                name: formData.name,
                destination: formData.destination,
                duration: formData.duration,
                accommodationName: formData.accommodationName,
                transportType: formData.transportType,
                status: formData.status,
                pricing: formData.pricing,
                linkedServices,
            });

            toast.success('Cập nhật Combo thành công');
            onSaved();
            onClose();
        } catch (error: any) {
            console.error('Error updating combo:', error);
            toast.error(error?.response?.data?.message || 'Không thể cập nhật combo');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa Combo</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Đang tải dữ liệu...
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Combo</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                >
                                    <option value="active">Hoạt động</option>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="inactive">Đã ẩn</option>
                                    <option value="rejected">Từ chối</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
                                <input
                                    value={formData.destination}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lịch trình</label>
                                <input
                                    value={formData.duration}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giá phục vụ</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.servedPrice}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        pricing: { ...prev.pricing, servedPrice: Number(e.target.value) || 0 },
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giá không phục vụ</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.unservedPrice}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        pricing: { ...prev.pricing, unservedPrice: Number(e.target.value) || 0 },
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giá nguyên chuyến</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.pricing.privateRentalPrice}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        pricing: { ...prev.pricing, privateRentalPrice: Number(e.target.value) || 0 },
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Dịch vụ liên kết</h4>
                                <button
                                    type="button"
                                    onClick={addLinkedService}
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    + Thêm dịch vụ
                                </button>
                            </div>

                            <div className="space-y-2">
                                {formData.linkedServices.map((row, index) => {
                                    const selected = row.serviceId ? serviceMap[row.serviceId] : null;
                                    return (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
                                            <div className="md:col-span-6">
                                                <select
                                                    value={row.serviceId}
                                                    onChange={(e) => handleLinkedServiceChange(index, 'serviceId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
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
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={row.netPriceAtBooking}
                                                    onChange={(e) => handleLinkedServiceChange(index, 'netPriceAtBooking', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                                                    placeholder="Giá net"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    disabled
                                                    value={selected?.owner?.fullName || row.supplierId || 'Supplier'}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLinkedService(index)}
                                                    className="w-full p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4 mx-auto" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 inline-flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminCombosPage = () => {
    const [combos, setCombos] = useState<Combo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewingCombo, setViewingCombo] = useState<any | null>(null);
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [editingComboId, setEditingComboId] = useState<string | null>(null);
    
    const fetchCombos = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getCombos({ status: statusFilter === 'all' ? undefined : statusFilter });
            setCombos(data.data);
        } catch (error) {
            console.error('Error fetching combos:', error);
            toast.error('Không thể tải danh sách Combo');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchCombos();
    }, [fetchCombos]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa Combo này không?')) return;
        try {
            await deleteCombo(id);
            toast.success('Xóa Combo thành công');
            fetchCombos();
        } catch (error) {
            console.error('Error deleting combo:', error);
            toast.error('Không thể xóa Combo');
        }
    };

    const handleView = async (id: string) => {
        try {
            setIsViewLoading(true);
            const result = await getComboById(id);
            setViewingCombo(result?.data || null);
        } catch (error) {
            console.error('Error fetching combo detail:', error);
            toast.error('Không thể tải chi tiết combo');
        } finally {
            setIsViewLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Combo</h1>
                    <p className="text-gray-500 mt-1">Quản lý các Tour và Combo trọn gói</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="inactive">Đã ẩn</option>
                    </select>

                    <Link
                        to="/admin/combos/create"
                        className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Tạo Combo mới</span>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Combo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm đến / Lịch trình</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá bán</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
                                    </td>
                                </tr>
                            ) : combos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Không tìm thấy Combo nào
                                    </td>
                                </tr>
                            ) : (
                                combos.map((combo) => (
                                    <tr key={combo.id || combo._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {combo.thumbnail ? (
                                                        <img src={combo.thumbnail} alt={combo.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-6 h-6 m-auto text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 max-w-[200px] truncate" title={combo.name}>{combo.name}</p>
                                                    <p className="text-sm text-gray-500">{combo.linkedServices?.length || 0} dịch vụ liên kết</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{combo.destination}</p>
                                            <p className="text-xs text-gray-500">{combo.duration}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {combo.pricing?.servedPrice > 0 && <p className="text-sm text-gray-900">Phục vụ: {combo.pricing.servedPrice.toLocaleString('vi-VN')}đ</p>}
                                            {combo.pricing?.unservedPrice > 0 && <p className="text-sm text-gray-900">Ko P.vụ: {combo.pricing.unservedPrice.toLocaleString('vi-VN')}đ</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                combo.status === 'active' ? 'bg-green-100 text-green-700' :
                                                combo.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {combo.status === 'active' ? 'Hoạt động' : combo.status === 'pending' ? 'Chờ duyệt' : 'Đã ẩn'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleView((combo.id || combo._id) as string)}
                                                className="inline-flex p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <FileText className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setEditingComboId((combo.id || combo._id) as string)}
                                                className="inline-flex p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <Link
                                                to={`/combos/${combo.id || combo._id}`}
                                                target="_blank"
                                                className="inline-flex p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Xem trên trang khách"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete((combo.id || combo._id) as string)}
                                                className="inline-flex p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isViewLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl px-6 py-5 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                        <p className="text-sm text-gray-600">Đang tải chi tiết...</p>
                    </div>
                </div>
            )}

            {viewingCombo && <ComboViewModal combo={viewingCombo} onClose={() => setViewingCombo(null)} />}

            {editingComboId && (
                <ComboEditModal
                    comboId={editingComboId}
                    onClose={() => setEditingComboId(null)}
                    onSaved={fetchCombos}
                />
            )}
        </div>
    );
};

export default AdminCombosPage;
