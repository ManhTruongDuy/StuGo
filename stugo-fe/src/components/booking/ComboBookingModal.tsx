import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar as CalendarIcon, Package, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { createBooking } from '../../services/booking.service';
import type { Combo } from '../../services/combo.service';
import toast from 'react-hot-toast';

interface ComboBookingModalProps {
    combo: Combo;
    onClose: () => void;
}

const ComboBookingModal = ({ combo, onClose }: ComboBookingModalProps) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [date, setDate] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [serviceType, setServiceType] = useState<'served' | 'unserved' | 'private'>('served');
    
    const [customerInfo, setCustomerInfo] = useState({
        name: user?.fullName || '',
        phone: user?.phone || '',
        email: user?.email || '',
        notes: '',
    });

    const [loading, setLoading] = useState(false);

    const basePrice = 
        serviceType === 'served' ? combo.pricing.servedPrice :
        serviceType === 'unserved' ? combo.pricing.unservedPrice :
        combo.pricing.privateRentalPrice;

    const totalAmount = basePrice * quantity;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date) {
            toast.error('Vui lòng chọn ngày sử dụng');
            return;
        }

        try {
            setLoading(true);
            const bookingData = {
                comboId: combo.id || combo._id,
                date,
                quantity,
                tourOptions: {
                    serviceType,
                },
                customerInfo
            };

            const result = await createBooking(bookingData);
            
            if (result && result.id) {
                toast.success('Đặt Combo thành công!');
                onClose();
                navigate('/bookings');
            }
        } catch (error: any) {
            console.error('Booking error:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo đặt chỗ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Đặt Combo</h2>
                        <p className="text-gray-500 mt-1">{combo.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <form id="combo-booking-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Option Selection */}
                        <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary-600" />
                                Chọn loại hình phục vụ
                            </h3>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {combo.pricing.servedPrice > 0 && (
                                    <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${serviceType === 'served' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-200'}`}>
                                        <input
                                            type="radio"
                                            name="serviceType"
                                            value="served"
                                            checked={serviceType === 'served'}
                                            onChange={() => setServiceType('served')}
                                            className="hidden"
                                        />
                                        <div className="font-medium text-gray-900 mb-1">Có phục vụ</div>
                                        <div className="text-primary-600 font-bold">{combo.pricing.servedPrice.toLocaleString('vi-VN')}đ</div>
                                    </label>
                                )}
                                {combo.pricing.unservedPrice > 0 && (
                                    <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${serviceType === 'unserved' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-200'}`}>
                                        <input
                                            type="radio"
                                            name="serviceType"
                                            value="unserved"
                                            checked={serviceType === 'unserved'}
                                            onChange={() => setServiceType('unserved')}
                                            className="hidden"
                                        />
                                        <div className="font-medium text-gray-900 mb-1">Không phục vụ</div>
                                        <div className="text-primary-600 font-bold">{combo.pricing.unservedPrice.toLocaleString('vi-VN')}đ</div>
                                    </label>
                                )}
                                {combo.pricing.privateRentalPrice > 0 && (
                                    <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${serviceType === 'private' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-200'}`}>
                                        <input
                                            type="radio"
                                            name="serviceType"
                                            value="private"
                                            checked={serviceType === 'private'}
                                            onChange={() => setServiceType('private')}
                                            className="hidden"
                                        />
                                        <div className="font-medium text-gray-900 mb-1">Thuê nguyên chuyến</div>
                                        <div className="text-primary-600 font-bold">{combo.pricing.privateRentalPrice.toLocaleString('vi-VN')}đ</div>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Date and Quantity */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Ngày sử dụng</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Số lượng người</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Thông tin liên hệ</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    required
                                    placeholder="Họ và tên"
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                />
                                <input
                                    type="tel"
                                    required
                                    placeholder="Số điện thoại"
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={customerInfo.email}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                            />
                            <textarea
                                placeholder="Ghi chú thêm (tùy chọn)..."
                                value={customerInfo.notes}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                rows={3}
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between sticky bottom-0 z-10">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Tổng tiền thanh toán</p>
                        <p className="text-2xl font-bold text-primary-600">
                            {totalAmount.toLocaleString('vi-VN')}đ
                        </p>
                    </div>
                    <button
                        type="submit"
                        form="combo-booking-form"
                        disabled={loading}
                        className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận đặt Combo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComboBookingModal;
