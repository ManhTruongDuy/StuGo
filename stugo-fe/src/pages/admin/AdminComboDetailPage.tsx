import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, ExternalLink, MapPin, Clock3, Package } from 'lucide-react';
import { getComboById } from '../../services/combo.service';
import toast from 'react-hot-toast';

const AdminComboDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [combo, setCombo] = useState<any>(null);

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            setLoading(true);
            try {
                const result = await getComboById(id);
                setCombo(result?.data || null);
            } catch (error) {
                console.error('Error fetching combo detail:', error);
                toast.error('Không thể tải chi tiết combo');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    if (loading) {
        return <div className="py-20 text-center text-gray-500">Đang tải chi tiết combo...</div>;
    }

    if (!combo) {
        return (
            <div className="py-20 text-center">
                <p className="text-gray-500 mb-4">Không tìm thấy combo</p>
                <button onClick={() => navigate('/admin/combos')} className="btn-primary px-4 py-2 rounded-xl">
                    Quay về danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chi tiết Combo</h1>
                        <p className="text-gray-500">Kiểm tra thông tin và dịch vụ liên kết</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/combos/${combo._id || combo.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Xem trang khách
                    </Link>
                    <Link
                        to={`/admin/combos/${combo._id || combo.id}/edit`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
                    >
                        <Pencil className="w-4 h-4" />
                        Chỉnh sửa
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {combo.thumbnail ? (
                                <img src={combo.thumbnail} alt={combo.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-gray-900">{combo.name}</h2>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {combo.destination}</span>
                                <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> {combo.duration}</span>
                            </div>
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                combo.status === 'active' ? 'bg-green-100 text-green-700' :
                                combo.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {combo.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid md:grid-cols-3 gap-4 text-sm">
                    <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-gray-500 mb-1">Giá phục vụ</p>
                        <p className="font-semibold text-gray-900">{Number(combo.pricing?.servedPrice || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-gray-500 mb-1">Giá không phục vụ</p>
                        <p className="font-semibold text-gray-900">{Number(combo.pricing?.unservedPrice || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-gray-500 mb-1">Giá nguyên chuyến</p>
                        <p className="font-semibold text-gray-900">{Number(combo.pricing?.privateRentalPrice || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ liên kết</h3>
                {!combo.linkedServices || combo.linkedServices.length === 0 ? (
                    <p className="text-sm text-gray-500">Combo này chưa có dịch vụ liên kết.</p>
                ) : (
                    <div className="space-y-3">
                        {combo.linkedServices.map((ls: any, index: number) => {
                            const service = ls.serviceId;
                            const supplier = ls.supplierId;
                            return (
                                <div key={`${service?._id || ls.serviceId || index}`} className="rounded-xl border border-gray-100 p-4">
                                    <p className="font-medium text-gray-900">{service?.name || 'Dịch vụ đã xóa/không khả dụng'}</p>
                                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                                        <span>Loại: {service?.type || '-'}</span>
                                        <span>Nhà cung cấp: {supplier?.fullName || ls.supplierId || '-'}</span>
                                        <span>Giá net: {Number(ls.netPriceAtBooking || 0).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminComboDetailPage;
