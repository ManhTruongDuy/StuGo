import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Trash2, Eye, Loader2, FileText, Pencil } from 'lucide-react';
import { getCombos, deleteCombo, type Combo } from '../../services/combo.service';
import toast from 'react-hot-toast';

const AdminCombosPage = () => {
    const [combos, setCombos] = useState<Combo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    
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
                                            <Link
                                                to={`/admin/combos/${combo.id || combo._id}`}
                                                className="inline-flex p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <FileText className="w-5 h-5" />
                                            </Link>
                                            <Link
                                                to={`/admin/combos/${combo.id || combo._id}/edit`}
                                                className="inline-flex p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </Link>
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
        </div>
    );
};

export default AdminCombosPage;
