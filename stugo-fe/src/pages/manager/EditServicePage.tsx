import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { getServiceById, updateService } from '../../services/service.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const EditServicePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [service, setService] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        openTime: '',
        closeTime: '',
        isAvailable: true,
    });

    useEffect(() => {
        if (id) {
            fetchService();
        }
    }, [id]);

    const fetchService = async () => {
        try {
            setLoading(true);
            const data = await getServiceById(id!);
            if (data) {
                setService(data);
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    address: data.address || '',
                    city: data.city || '',
                    district: data.district || '',
                    ward: data.ward || '',
                    openTime: data.openTime || '00:00',
                    closeTime: data.closeTime || '23:59',
                    isAvailable: data.isAvailable !== false,
                });
            } else {
                toast.error('Không tìm thấy dịch vụ');
                navigate('/manager/services');
            }
        } catch (error) {
            toast.error('Không thể tải thông tin dịch vụ');
            navigate('/manager/services');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.address) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setSaving(true);
            await updateService(id!, formData);
            toast.success('Cập nhật dịch vụ thành công');
            navigate('/manager/services');
        } catch (error: any) {
            toast.error(error.message || 'Không thể cập nhật dịch vụ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!service) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/manager/services')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">
                        Chỉnh sửa dịch vụ
                    </h1>
                    <p className="text-gray-500">
                        Cập nhật thông tin dịch vụ của bạn
                    </p>
                </div>
            </div>

            {/* Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-700">
                    <strong>Lưu ý:</strong> Hiện tại chỉ có thể chỉnh sửa thông tin cơ bản.
                    Để thay đổi tuyến đường, loại phòng hoặc thực đơn, vui lòng liên hệ hỗ trợ.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                {/* Basic Info */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên dịch vụ <span className="text-red-500">*</span>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input w-full min-h-[120px]"
                                rows={5}
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Địa chỉ</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thành phố
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="input w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quận/Huyện
                            </label>
                            <input
                                type="text"
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="input w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phường/Xã
                            </label>
                            <input
                                type="text"
                                value={formData.ward}
                                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                                className="input w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Operating Hours */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Giờ hoạt động</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giờ mở cửa
                            </label>
                            <input
                                type="time"
                                value={formData.openTime}
                                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                                className="input w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giờ đóng cửa
                            </label>
                            <input
                                type="time"
                                value={formData.closeTime}
                                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                                className="input w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Trạng thái</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isAvailable}
                            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                            className="w-5 h-5 text-primary-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                            Dịch vụ đang hoạt động và có thể nhận đặt chỗ
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate('/manager/services')}
                        className="btn btn-secondary flex-1"
                        disabled={saving}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary flex-1"
                        disabled={saving}
                    >
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
            </form>
        </div>
    );
};

export default EditServicePage;
