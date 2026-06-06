import { useState, useEffect } from 'react';
import { FileText, Download, ShieldCheck, Clock, ExternalLink, User, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getUserProfile } from '../../services/user.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ManagerContractPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [partnerProfile, setPartnerProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const response = await getUserProfile(user.id);
                if (response.success) {
                    setPartnerProfile(response.data);
                } else {
                    toast.error('Không thể tải thông tin hợp đồng');
                }
            } catch (error) {
                console.error('Error fetching partner profile:', error);
                toast.error('Có lỗi xảy ra khi tải thông tin hợp đồng');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    const contracts = partnerProfile?.contracts || [];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-7 h-7 text-primary-500" />
                    Hợp đồng của tôi
                </h1>
                <p className="text-gray-500">
                    Xem và tải xuống các tài liệu hợp đồng hợp tác đã ký với StuGo.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Contract Status & Metadata */}
                <div className="space-y-6">
                    <div className="card p-6 bg-gradient-to-br from-dark-100 to-dark-200 text-white shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Trạng thái hồ sơ</span>
                            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/30">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Đã xác minh
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2 font-display">{partnerProfile?.fullName}</h3>
                        <p className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            Tham gia từ {partnerProfile?.createdAt ? new Date(partnerProfile.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </p>

                        <div className="space-y-4 border-t border-white/10 pt-6">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Mail className="w-4.5 h-4.5 text-teal-400 flex-shrink-0" />
                                <span className="truncate">{partnerProfile?.email}</span>
                            </div>
                            {partnerProfile?.phone && (
                                <div className="flex items-center gap-3 text-sm text-gray-300">
                                    <Phone className="w-4.5 h-4.5 text-teal-400 flex-shrink-0" />
                                    <span>{partnerProfile.phone}</span>
                                </div>
                            )}
                            <div className="flex items-start gap-3 text-sm text-gray-300">
                                <User className="w-4.5 h-4.5 text-teal-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Vai trò trên hệ thống</p>
                                    <p className="font-medium">Đối tác chính thức (Partner)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 border border-gray-100 bg-white">
                        <h4 className="font-semibold text-gray-900 mb-3">Lưu ý pháp lý</h4>
                        <ul className="space-y-2.5 text-sm text-gray-500 list-disc pl-4">
                            <li>Hợp đồng là văn bản thỏa thuận pháp lý có hiệu lực giữa bạn và ban quản trị StuGo.</li>
                            <li>Nghiêm cấm chỉnh sửa, tẩy xóa hoặc giả mạo hình ảnh hợp đồng.</li>
                            <li>Nếu có bất kỳ sai sót thông tin nào, vui lòng liên hệ admin qua email <span className="text-primary-600 font-medium">support@stugo.com</span> để cập nhật lại.</li>
                        </ul>
                    </div>
                </div>

                {/* Contract Document Viewer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6 bg-white border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-500" />
                            Tài liệu hợp đồng ({contracts.length} trang)
                        </h3>

                        {contracts.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-6">
                                {contracts.map((img: string, index: number) => (
                                    <div key={index} className="group relative border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 shadow-sm hover:shadow-md transition-all">
                                        <div className="aspect-[3/4] overflow-hidden bg-white flex items-center justify-center">
                                            <img 
                                                src={img} 
                                                alt={`Trang hợp đồng ${index + 1}`} 
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                                                loading="lazy"
                                            />
                                        </div>
                                        
                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <div className="flex gap-2">
                                                <a 
                                                    href={img} 
                                                    download={`hop-dong-stugo-trang-${index + 1}.png`}
                                                    className="flex-1 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Tải xuống
                                                </a>
                                                <a 
                                                    href={img} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shadow transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Mở tab mới"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>

                                        {/* Badge Indicator */}
                                        <div className="absolute top-3 left-3 bg-dark-200/80 backdrop-blur-sm text-[11px] font-semibold text-white px-2.5 py-1 rounded-lg">
                                            Trang {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-lg font-semibold text-gray-700 mb-1">Chưa có hợp đồng nào</p>
                                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                                    Tài khoản đối tác của bạn được khởi tạo trên hệ thống cũ. Vui lòng liên hệ ban quản trị để ký bổ sung hợp đồng.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerContractPage;
