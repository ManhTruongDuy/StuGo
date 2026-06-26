import { useEffect, useState } from 'react';
import {
    Search,
    Eye,
    Ban,
    Check,
    MapPin,
    Phone,
    Mail,
    Store,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Users,
    Plus,
    Upload,
    X,
    Lock,
    User as UserIcon,
    FileText,
    Edit2,
} from 'lucide-react';
import { getPartners, updateUserStatus, createPartner } from '../../services/admin.service';
import { updateUserProfile } from '../../services/user.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'active' | 'banned';

const cities = [
    { code: 'hanoi', name: 'Hà Nội' },
    { code: 'hcm', name: 'TP. Hồ Chí Minh' },
    { code: 'danang', name: 'Đà Nẵng' },
];

const districts: Record<string, { code: string; name: string }[]> = {
    'Hà Nội': [
        { code: 'hk', name: 'Hoàn Kiếm' },
        { code: 'cg', name: 'Cầu Giấy' },
        { code: 'tx', name: 'Thanh Xuân' },
        { code: 'hd', name: 'Hai Bà Trưng' },
        { code: 'dd', name: 'Đống Đa' },
        { code: 'ba', name: 'Ba Đình' },
    ],
    'TP. Hồ Chí Minh': [
        { code: 'q1', name: 'Quận 1' },
        { code: 'q3', name: 'Quận 3' },
        { code: 'q5', name: 'Quận 5' },
        { code: 'q7', name: 'Quận 7' },
        { code: 'bt', name: 'Bình Thạnh' },
    ],
    'Đà Nẵng': [
        { code: 'hc', name: 'Hải Châu' },
        { code: 'tn', name: 'Thanh Khê' },
        { code: 'sn', name: 'Sơn Trà' },
        { code: 'nhs', name: 'Ngũ Hành Sơn' },
        { code: 'lc', name: 'Liên Chiểu' },
        { code: 'cv', name: 'Cẩm Lệ' },
    ],
};

const AdminPartnersPage = () => {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [planFilter, setPlanFilter] = useState<'all' | 'premium' | 'free'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Modals & form state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [editingPartner, setEditingPartner] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Drag and Drop state
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedContracts, setUploadedContracts] = useState<string[]>([]);

    // Form fields
    const [formFields, setFormFields] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        district: '',
        ward: '',
        address: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const tempErrors: Record<string, string> = {};
        if (!formFields.fullName.trim()) tempErrors.fullName = 'Họ tên là bắt buộc';
        if (!formFields.email.trim()) {
            tempErrors.email = 'Email là bắt buộc';
        } else if (!/\S+@\S+\.\S+/.test(formFields.email)) {
            tempErrors.email = 'Email không hợp lệ';
        }
        if (!formFields.password) {
            tempErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formFields.password.length < 6) {
            tempErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        if (uploadedContracts.length === 0) {
            tempErrors.contracts = 'Bạn phải tải lên ít nhất 1 ảnh hợp đồng';
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleFieldChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormFields((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'city') {
                updated.district = '';
                updated.ward = '';
            }
            return updated;
        });
        if (errors[name]) {
            setErrors((prev) => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
        }
    };

    const processFiles = (files: FileList) => {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            toast.error('Vui lòng chỉ tải lên tệp ảnh (PNG, JPG, JPEG, WEBP)');
            return;
        }

        imageFiles.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`Tệp ${file.name} vượt quá giới hạn 5MB`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedContracts(prev => [...prev, reader.result as string]);
                setErrors(prev => {
                    const copy = { ...prev };
                    delete copy.contracts;
                    return copy;
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveContract = (index: number) => {
        setUploadedContracts(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Vui lòng kiểm tra lại thông tin nhập');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formFields,
                contracts: uploadedContracts
            };
            const result = await createPartner(payload);
            if (result.success) {
                toast.success('Thêm đối tác mới thành công');
                setIsCreateOpen(false);
                setFormFields({
                    fullName: '',
                    email: '',
                    password: '',
                    phone: '',
                    city: '',
                    district: '',
                    ward: '',
                    address: ''
                });
                setUploadedContracts([]);
                setErrors({});
                fetchPartners();
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo đối tác';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const tempErrors: Record<string, string> = {};
        if (!formFields.fullName.trim()) tempErrors.fullName = 'Họ tên là bắt buộc';
        if (uploadedContracts.length === 0) {
            tempErrors.contracts = 'Bạn phải tải lên ít nhất 1 ảnh hợp đồng';
        }
        setErrors(tempErrors);
        
        if (Object.keys(tempErrors).length > 0) {
            toast.error('Vui lòng kiểm tra lại thông tin nhập');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                fullName: formFields.fullName,
                phone: formFields.phone,
                city: formFields.city,
                district: formFields.district,
                ward: formFields.ward,
                address: formFields.address,
                contracts: uploadedContracts
            };
            const result = await updateUserProfile(editingPartner.id, payload);
            if (result.success) {
                toast.success('Cập nhật đối tác thành công');
                setIsEditOpen(false);
                setEditingPartner(null);
                fetchPartners();
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đối tác';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Debounce searchQuery
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const params: any = { page: currentPage, limit: 20 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (planFilter !== 'all') params.plan = planFilter;
            if (debouncedSearchQuery) params.search = debouncedSearchQuery;

            const result = await getPartners(params);
            setPartners(result.data);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Error fetching partners:', error);
            toast.error('Không thể tải danh sách đối tác');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, [statusFilter, planFilter, currentPage, debouncedSearchQuery]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, statusFilter, planFilter]);

    const handleStatusChange = async (partnerId: string, newStatus: 'active' | 'banned') => {
        try {
            await updateUserStatus(partnerId, newStatus);
            toast.success(newStatus === 'banned' ? 'Đã khóa đối tác' : 'Đã kích hoạt đối tác');
            setActionMenuId(null);
            fetchPartners();
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            banned: 'bg-red-100 text-red-700',
            pending: 'bg-yellow-100 text-yellow-700',
        };
        const labels: Record<string, string> = {
            active: 'Hoạt động',
            banned: 'Đã khóa',
            pending: 'Chờ duyệt',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">
                        Danh sách đối tác
                    </h1>
                    <p className="text-gray-500">
                        Quản lý các chủ nhà hàng, nhà trọ, nhà xe trên hệ thống
                    </p>
                </div>
                <button
                    onClick={() => {
                        setFormFields({
                            fullName: '',
                            email: '',
                            password: '',
                            phone: '',
                            city: '',
                            district: '',
                            ward: '',
                            address: ''
                        });
                        setUploadedContracts([]);
                        setErrors({});
                        setIsCreateOpen(true);
                    }}
                    className="btn-primary flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus className="w-5 h-5" />
                    Thêm đối tác
                </button>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng đối tác</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {pagination?.total || partners.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {partners.filter((p) => p.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <Ban className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đã khóa</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {partners.filter((p) => p.status === 'banned').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, số điện thoại..."
                            className="input pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="input w-40"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    >
                        <option value="all">Trạng thái: Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="banned">Đã khóa</option>
                    </select>

                    <select
                        className="input w-40"
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value as any)}
                    >
                        <option value="all">Loại: Tất cả</option>
                        <option value="premium">Premium</option>
                        <option value="free">Thường</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Đối tác
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Liên hệ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Địa chỉ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Dịch vụ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Doanh thu
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partners.length > 0 ? (
                                    partners.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium">
                                                        {partner.avatar ? (
                                                            <img
                                                                src={partner.avatar}
                                                                alt={partner.fullName}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            partner.fullName?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                            {partner.fullName}
                                                            {(partner.plan && partner.plan !== 'free') ? (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                                    {partner.plan === 'business_premium' ? 'PREMIUM' : partner.plan === 'business_basic' ? 'BASIC' : 'PREMIUM'}
                                                                </span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                                    THƯỜNG
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Tham gia {new Date(partner.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Mail className="w-4 h-4" />
                                                        {partner.email}
                                                    </div>
                                                    {partner.phone && (
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                            <Phone className="w-4 h-4" />
                                                            {partner.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {partner.city && (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        {partner.district && `${partner.district}, `}
                                                        {partner.city}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Store className="w-4 h-4 text-primary-600" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {partner.servicesCount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-medium text-green-600">
                                                        {formatPrice(partner.totalRevenue)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(partner.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPartner(partner);
                                                            setIsDetailOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary-600"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingPartner(partner);
                                                            setFormFields({
                                                                fullName: partner.fullName || '',
                                                                email: partner.email || '',
                                                                password: '',
                                                                phone: partner.phone || '',
                                                                city: partner.city || '',
                                                                district: partner.district || '',
                                                                ward: partner.ward || '',
                                                                address: partner.address || ''
                                                            });
                                                            setUploadedContracts(partner.contracts || []);
                                                            setErrors({});
                                                            setIsEditOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-teal-600"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {partner.status === 'active' ? (
                                                        <button
                                                            onClick={() => handleStatusChange(partner.id, 'banned')}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                                                            title="Khóa tài khoản"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStatusChange(partner.id, 'active')}
                                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors text-gray-500 hover:text-green-600"
                                                            title="Kích hoạt"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            Không có đối tác nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Hiển thị {partners.length} / {pagination.total} đối tác
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium text-gray-700">
                            Trang {currentPage} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close menu */}
            {actionMenuId && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setActionMenuId(null)}
                />
            )}

            {/* Create Partner Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Thêm đối tác mới"
                size="lg"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formFields.fullName}
                                    onChange={handleFieldChange}
                                    className={`input pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formFields.email}
                                    onChange={handleFieldChange}
                                    className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="email@example.com"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formFields.password}
                                    onChange={handleFieldChange}
                                    className={`input pl-10 ${errors.password ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Số điện thoại
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="phone"
                                    value={formFields.phone}
                                    onChange={handleFieldChange}
                                    className="input pl-10"
                                    placeholder="0901234567"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Địa chỉ</h4>
                        <div className="grid sm:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh / Thành</label>
                                <select
                                    name="city"
                                    value={formFields.city}
                                    onChange={handleFieldChange}
                                    className="input"
                                >
                                    <option value="">Chọn tỉnh/thành</option>
                                    {cities.map((city) => (
                                        <option key={city.code} value={city.name}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quận / Huyện</label>
                                <select
                                    name="district"
                                    value={formFields.district}
                                    onChange={handleFieldChange}
                                    className="input"
                                    disabled={!formFields.city}
                                >
                                    <option value="">Chọn quận/huyện</option>
                                    {formFields.city && districts[formFields.city]?.map((d) => (
                                        <option key={d.code} value={d.name}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phường / Xã</label>
                                <input
                                    type="text"
                                    name="ward"
                                    value={formFields.ward}
                                    onChange={handleFieldChange}
                                    className="input"
                                    placeholder="Phường/Xã"
                                    disabled={!formFields.district}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                            <input
                                type="text"
                                name="address"
                                value={formFields.address}
                                onChange={handleFieldChange}
                                className="input"
                                placeholder="Số nhà, tên đường..."
                            />
                        </div>
                    </div>

                    {/* Contract Upload */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Hợp đồng đối tác (Ảnh chụp) <span className="text-red-500">*</span>
                        </label>
                        
                        {/* Drag and Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                                isDragging 
                                    ? 'border-primary-500 bg-primary-50' 
                                    : errors.contracts 
                                        ? 'border-red-300 hover:border-red-400 bg-red-50/10'
                                        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50/50'
                            }`}
                            onClick={() => document.getElementById('contract-file-input')?.click()}
                        >
                            <Upload className={`w-10 h-10 mb-2 ${errors.contracts ? 'text-red-400' : 'text-gray-400'}`} />
                            <p className="text-sm text-gray-600 font-medium">
                                Kéo thả ảnh hợp đồng vào đây hoặc <span className="text-primary-600 hover:underline">chọn tệp</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Hỗ trợ PNG, JPG, JPEG, WEBP tối đa 5MB</p>
                            <input
                                id="contract-file-input"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                        {errors.contracts && <p className="text-red-500 text-xs mt-1">{errors.contracts}</p>}

                        {/* Upload Previews */}
                        {uploadedContracts.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                {uploadedContracts.map((img, idx) => (
                                    <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-gray-200">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveContract(idx);
                                            }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/55 text-[10px] text-white py-1 px-2 truncate">
                                            Hợp đồng #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            className="btn-ghost"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang tạo...' : 'Tạo đối tác'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Partner Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => {
                    setIsEditOpen(false);
                    setEditingPartner(null);
                }}
                title="Chỉnh sửa thông tin đối tác"
                size="lg"
            >
                <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formFields.fullName}
                                    onChange={handleFieldChange}
                                    className={`input pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formFields.email}
                                    className="input pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                                    disabled
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Số điện thoại
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="phone"
                                    value={formFields.phone}
                                    onChange={handleFieldChange}
                                    className="input pl-10"
                                    placeholder="0901234567"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Địa chỉ</h4>
                        <div className="grid sm:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh / Thành</label>
                                <select
                                    name="city"
                                    value={formFields.city}
                                    onChange={handleFieldChange}
                                    className="input"
                                >
                                    <option value="">Chọn tỉnh/thành</option>
                                    {cities.map((city) => (
                                        <option key={city.code} value={city.name}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quận / Huyện</label>
                                <select
                                    name="district"
                                    value={formFields.district}
                                    onChange={handleFieldChange}
                                    className="input"
                                    disabled={!formFields.city}
                                >
                                    <option value="">Chọn quận/huyện</option>
                                    {formFields.city && districts[formFields.city]?.map((d) => (
                                        <option key={d.code} value={d.name}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phường / Xã</label>
                                <input
                                    type="text"
                                    name="ward"
                                    value={formFields.ward}
                                    onChange={handleFieldChange}
                                    className="input"
                                    placeholder="Phường/Xã"
                                    disabled={!formFields.district}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                            <input
                                type="text"
                                name="address"
                                value={formFields.address}
                                onChange={handleFieldChange}
                                className="input"
                                placeholder="Số nhà, tên đường..."
                            />
                        </div>
                    </div>

                    {/* Contract Upload */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Hợp đồng đối tác (Ảnh chụp) <span className="text-red-500">*</span>
                        </label>
                        
                        {/* Drag and Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                                isDragging 
                                    ? 'border-primary-500 bg-primary-50' 
                                    : errors.contracts 
                                        ? 'border-red-300 hover:border-red-400 bg-red-50/10'
                                        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50/50'
                            }`}
                            onClick={() => document.getElementById('edit-contract-file-input')?.click()}
                        >
                            <Upload className={`w-10 h-10 mb-2 ${errors.contracts ? 'text-red-400' : 'text-gray-400'}`} />
                            <p className="text-sm text-gray-600 font-medium">
                                Kéo thả ảnh hợp đồng vào đây hoặc <span className="text-primary-600 hover:underline">chọn tệp</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Hỗ trợ PNG, JPG, JPEG, WEBP tối đa 5MB</p>
                            <input
                                id="edit-contract-file-input"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                        {errors.contracts && <p className="text-red-500 text-xs mt-1">{errors.contracts}</p>}

                        {/* Upload Previews */}
                        {uploadedContracts.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                {uploadedContracts.map((img, idx) => (
                                    <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-gray-200">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveContract(idx);
                                            }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/55 text-[10px] text-white py-1 px-2 truncate">
                                            Hợp đồng #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditOpen(false);
                                setEditingPartner(null);
                            }}
                            className="btn-ghost"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Partner Details Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedPartner(null);
                }}
                title="Thông tin chi tiết đối tác"
                size="lg"
            >
                {selectedPartner && (
                    <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                                {selectedPartner.avatar ? (
                                    <img
                                        src={selectedPartner.avatar}
                                        alt={selectedPartner.fullName}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    selectedPartner.fullName?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">
                                    {selectedPartner.fullName}
                                    {(selectedPartner.plan && selectedPartner.plan !== 'free') ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                            {selectedPartner.plan === 'business_premium' ? 'PREMIUM' : selectedPartner.plan === 'business_basic' ? 'BASIC' : 'PREMIUM'}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                            THƯỜNG
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Mã đối tác: #{selectedPartner.id?.slice(-8).toUpperCase()}
                                </p>
                            </div>
                            <div className="text-right">
                                {getStatusBadge(selectedPartner.status)}
                            </div>
                        </div>

                        {/* General Info */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400">Email</p>
                                    <p className="font-medium text-gray-800">{selectedPartner.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400">Số điện thoại</p>
                                    <p className="font-medium text-gray-800">{selectedPartner.phone || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-gray-600 sm:col-span-2">
                                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400">Địa chỉ</p>
                                    <p className="font-medium text-gray-800">
                                        {[
                                            selectedPartner.address,
                                            selectedPartner.ward,
                                            selectedPartner.district,
                                            selectedPartner.city
                                        ].filter(Boolean).join(', ') || '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contract Gallery */}
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-primary-500" />
                                Ảnh hợp đồng đối tác
                            </h4>
                            
                            {selectedPartner.contracts && selectedPartner.contracts.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {selectedPartner.contracts.map((img: string, idx: number) => (
                                        <a
                                            key={idx}
                                            href={img}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-gray-200 shadow-sm block hover:shadow-md transition-shadow"
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="bg-white/95 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-gray-800 shadow">
                                                    Xem ảnh lớn
                                                </span>
                                            </div>
                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white py-1 px-2">
                                                Ảnh hợp đồng #{idx + 1}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                    <p className="text-sm text-gray-500 font-medium">Chưa có hợp đồng đối tác</p>
                                    <p className="text-xs text-gray-400">Đối tác này được tạo trước khi hệ thống cập nhật hợp đồng</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDetailOpen(false);
                                    setSelectedPartner(null);
                                }}
                                className="btn-ghost"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminPartnersPage;
