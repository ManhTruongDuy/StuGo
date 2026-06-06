import { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Users,
    CreditCard,
    Loader2,
    Truck,
    ShoppingBag
} from 'lucide-react';
import type { Restaurant } from '../../types';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { createBooking, getAvailableSlots, createRestaurantPayment } from '../../services';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, isSameDay, isToday, isBefore, isSameMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface RestaurantBookingModalProps {
    service: Restaurant;
    onClose: () => void;
}

const RestaurantBookingModal = ({ service, onClose }: RestaurantBookingModalProps) => {
    const { setService, setDate, setTimeSlot, setQuantity } = useBookingStore();
    const { user } = useAuthStore();

    const [bookingType, setBookingType] = useState<'reservation' | 'order'>('reservation');
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [orderItems, setOrderItems] = useState<Array<{
        menuItemId: string;
        name: string;
        price: number;
        quantity: number;
    }>>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [quantity, setLocalQuantity] = useState(1);
    const [monthOffset, setMonthOffset] = useState(0);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');

    const today = new Date();
    const currentMonth = addMonths(today, monthOffset);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
        calendarDays.push(day);
        day = addDays(day, 1);
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Fetch available slots when date is selected (for reservation)
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedDate || !service || bookingType !== 'reservation') return;

            setIsLoadingSlots(true);
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const result = await getAvailableSlots(service.id, dateStr);
                setAvailableSlots(result.slots || []);
            } catch (error) {
                console.error('Error fetching slots:', error);
                toast.error('Không thể tải thông tin khả dụng');
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDate, service, bookingType]);

    const handleDateSelect = (date: Date) => {
        if (isBefore(date, today) && !isToday(date)) return;
        setSelectedDate(date);
        setSelectedSlot(null);
        setOrderItems([]);
        setStep('time');
    };

    const handleConfirm = async () => {
        if (!selectedDate) return;

        if (bookingType === 'reservation' && !selectedSlot) {
            toast.error('Vui lòng chọn khung giờ');
            return;
        }
        if (bookingType === 'order' && orderItems.length === 0) {
            toast.error('Vui lòng chọn món');
            return;
        }

        if (!user) {
            toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');
            return;
        }

        try {
            setIsCreating(true);

            const bookingData: any = {
                serviceId: service.id,
                date: format(selectedDate, 'yyyy-MM-dd'),
                bookingType: bookingType,
                customerInfo: {
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone,
                },
            };

            if (bookingType === 'reservation') {
                bookingData.timeSlot = selectedSlot;
                bookingData.quantity = quantity;
            } else {
                bookingData.orderItems = orderItems.map(item => ({
                    menuItemId: item.menuItemId,
                    name: item.name,
                    price: isPremium ? item.price : Math.round(item.price * 1.05),
                    quantity: item.quantity
                }));
                bookingData.quantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
                bookingData.orderType = orderType;
            }

            const booking = await createBooking(bookingData);

            if (booking) {
                setService(service);
                setDate(format(selectedDate, 'yyyy-MM-dd'));
                if (selectedSlot) setTimeSlot(selectedSlot);
                setQuantity(quantity);

                // Create payment link
                try {
                    const payment = await createRestaurantPayment(booking.id, paymentType);
                    if (payment && payment.checkoutUrl) {
                        // ✅ Lưu token và user vào sessionStorage trước khi redirect
                        const accessToken = localStorage.getItem('token');
                        const userData = localStorage.getItem('user');

                        if (accessToken) {
                            sessionStorage.setItem('token', accessToken);
                        }
                        if (userData) {
                            sessionStorage.setItem('user', userData);
                        }

                        // Lưu orderCode
                        localStorage.setItem('pendingOrderCode', payment.orderCode.toString());

                        toast.success('Đặt chỗ thành công! Đang chuyển đến trang thanh toán...');
                        onClose();

                        // Thêm orderCode vào URL
                        const checkoutUrl = new URL(payment.checkoutUrl);
                        checkoutUrl.searchParams.set('orderCode', payment.orderCode.toString());

                        // Redirect to PayOS checkout page
                        window.location.href = checkoutUrl.toString();
                    } else {
                        toast.error('Không thể tạo link thanh toán. Vui lòng thử lại.');
                    }
                } catch (paymentError: any) {
                    console.error('Error creating payment:', paymentError);
                    toast.error(paymentError.message || 'Không thể tạo link thanh toán');
                }
            } else {
                toast.error('Không thể tạo đặt chỗ. Vui lòng thử lại.');
            }
        } catch (error: any) {
            console.error('Error creating booking:', error);
            toast.error(error.message || 'Không thể tạo đặt chỗ. Vui lòng thử lại.');
        } finally {
            setIsCreating(false);
        }
    };

    const isPremium = user?.plan === 'premium_user';

    const getTotalPrice = () => {
        if (bookingType === 'order') {
            return orderItems.reduce((sum, item) => {
                const displayPrice = isPremium ? item.price : Math.round(item.price * 1.05);
                return sum + (displayPrice * item.quantity);
            }, 0);
        }
        const basePrice = service.priceRange.min;
        const displayPrice = isPremium ? basePrice : Math.round(basePrice * 1.05);
        return displayPrice * quantity;
    };

    const totalPrice = getTotalPrice();
    const depositPrice = Math.round(totalPrice * 0.3);
    const finalPaymentAmount = paymentType === 'full' ? totalPrice : depositPrice;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl max-h-[95vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl animate-scale-in overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {step !== 'date' && (
                            <button
                                onClick={() => setStep(step === 'confirm' ? 'time' : 'date')}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {step === 'date' && 'Chọn ngày'}
                                {step === 'time' && (bookingType === 'reservation' ? 'Chọn khung giờ' : 'Chọn món')}
                                {step === 'confirm' && 'Xác nhận đặt chỗ'}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[200px] sm:max-w-none">{service.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                    {/* Step 1: Date Selection */}
                    {step === 'date' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={() => setMonthOffset(monthOffset - 1)}
                                    disabled={monthOffset === 0}
                                    className={`p-2 rounded-lg transition-colors ${monthOffset === 0
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-medium text-gray-900">
                                    {format(currentMonth, 'MMMM yyyy', { locale: vi })}
                                </span>
                                <button
                                    onClick={() => setMonthOffset(monthOffset + 1)}
                                    disabled={monthOffset >= 11}
                                    className={`p-2 rounded-lg transition-colors ${monthOffset >= 11
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                    <div
                                        key={day}
                                        className="text-center text-sm font-medium text-gray-500 py-2"
                                    >
                                        {day}
                                    </div>
                                ))}

                                {calendarDays.map((date, index) => {
                                    const isPast = isBefore(date, today) && !isToday(date);
                                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                                    const isTodayDate = isToday(date);
                                    const isCurrentMonth = isSameMonth(date, currentMonth);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleDateSelect(date)}
                                            disabled={isPast || !isCurrentMonth}
                                            className={`p-3 rounded-xl transition-all ${!isCurrentMonth
                                                ? 'text-gray-300 cursor-default'
                                                : isPast
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg'
                                                        : isTodayDate
                                                            ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                                            : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            <p className="text-xl font-bold">{format(date, 'd')}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Chọn ngày bạn muốn đặt chỗ
                            </p>
                        </div>
                    )}

                    {/* Step 2: Booking Type + Selection */}
                    {step === 'time' && selectedDate && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-6">
                                <p className="text-gray-500">Ngày đã chọn</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                                </p>
                            </div>

                            {/* Booking Type Selection */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Chọn loại đặt chỗ</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {service.hasReservation && (
                                        <button
                                            onClick={() => {
                                                setBookingType('reservation');
                                                setSelectedSlot(null);
                                                setOrderItems([]);
                                                setOrderType('delivery');
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${bookingType === 'reservation'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <p className="font-semibold text-gray-900">Đặt bàn</p>
                                            <p className="text-sm text-gray-500 mt-1">Đặt chỗ trước</p>
                                        </button>
                                    )}
                                    {service.hasDelivery && (
                                        <button
                                            onClick={() => {
                                                setBookingType('order');
                                                setSelectedSlot(null);
                                                setOrderItems([]);
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${bookingType === 'order'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <p className="font-semibold text-gray-900">Đặt món</p>
                                            <p className="text-sm text-gray-500 mt-1">Giao hàng</p>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Time Slot Selection for Reservation */}
                            {bookingType === 'reservation' && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Chọn khung giờ</h3>
                                    {isLoadingSlots ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-3">
                                            {availableSlots.map((slot: any) => {
                                                const isSelected = selectedSlot === slot.time;
                                                const isAvailable = slot.available;

                                                return (
                                                    <button
                                                        key={slot.time}
                                                        onClick={() => {
                                                            if (isAvailable) {
                                                                setSelectedSlot(slot.time);
                                                                setStep('confirm');
                                                            } else {
                                                                toast.error('Khung giờ này đã hết bàn');
                                                            }
                                                        }}
                                                        disabled={!isAvailable}
                                                        className={`p-3 rounded-xl text-center transition-all ${!isAvailable
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg'
                                                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                            }`}
                                                    >
                                                        <Clock className="w-4 h-4 mx-auto mb-1" />
                                                        <p className="font-medium">{slot.time}</p>
                                                        <p className="text-xs mt-1">
                                                            {slot.availableTables} bàn
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Menu Selection for Order */}
                            {bookingType === 'order' && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-4">Chọn món</h3>

                                    {/* Delivery / Pickup Toggle */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <button
                                            onClick={() => setOrderType('delivery')}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${orderType === 'delivery'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <Truck className="w-4 h-4" />
                                            <span className="font-medium text-gray-900">Giao hàng</span>
                                        </button>
                                        <button
                                            onClick={() => setOrderType('pickup')}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${orderType === 'pickup'
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300'
                                                }`}
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            <span className="font-medium text-gray-900">Tự lấy</span>
                                        </button>
                                    </div>

                                    {(() => {
                                        const menuItems = service.menuItems || [];
                                        const categories = [...new Set(menuItems.map(item => item.category))];

                                        return (
                                            <div className="space-y-6">
                                                {categories.map((category) => {
                                                    const itemsInCategory = menuItems.filter(item => item.category === category);

                                                    return (
                                                        <div key={category}>
                                                            <h4 className="font-medium text-gray-700 mb-3">{category}</h4>
                                                            <div className="space-y-3">
                                                                {itemsInCategory.map((item) => {
                                                                    const orderItem = orderItems.find(oi => oi.menuItemId === item.id);
                                                                    const itemQuantity = orderItem?.quantity || 0;

                                                                    return (
                                                                        <div
                                                                            key={item.id}
                                                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                                                {item.description && (
                                                                                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                                                                )}
                                                                                <p className="text-lg font-bold text-primary-600 mt-2">
                                                                                    {formatPrice(isPremium ? item.price : Math.round(item.price * 1.05))}
                                                                                </p>
                                                                                {!isPremium && (
                                                                                    <p className="text-xs text-orange-600 font-normal mt-0.5">
                                                                                        ({formatPrice(item.price)} đối với Student Premium)
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 ml-4">
                                                                                {itemQuantity > 0 && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            if (itemQuantity === 1) {
                                                                                                setOrderItems(orderItems.filter(oi => oi.menuItemId !== item.id));
                                                                                            } else {
                                                                                                setOrderItems(orderItems.map(oi =>
                                                                                                    oi.menuItemId === item.id
                                                                                                        ? { ...oi, quantity: oi.quantity - 1 }
                                                                                                        : oi
                                                                                                ));
                                                                                            }
                                                                                        }}
                                                                                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                                                                    >
                                                                                        <Minus className="w-4 h-4" />
                                                                                    </button>
                                                                                )}
                                                                                {itemQuantity > 0 && (
                                                                                    <span className="w-8 text-center font-semibold text-gray-900">
                                                                                        {itemQuantity}
                                                                                    </span>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const existingItem = orderItems.find(oi => oi.menuItemId === item.id);
                                                                                        if (existingItem) {
                                                                                            setOrderItems(orderItems.map(oi =>
                                                                                                oi.menuItemId === item.id
                                                                                                    ? { ...oi, quantity: oi.quantity + 1 }
                                                                                                    : oi
                                                                                            ));
                                                                                        } else {
                                                                                            setOrderItems([...orderItems, {
                                                                                                menuItemId: item.id,
                                                                                                name: item.name,
                                                                                                price: item.price,
                                                                                                quantity: 1
                                                                                            }]);
                                                                                        }
                                                                                    }}
                                                                                    className="w-8 h-8 rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors"
                                                                                >
                                                                                    <Plus className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Order Summary */}
                                                {orderItems.length > 0 && (
                                                    <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="font-semibold text-gray-900">Tổng đơn hàng:</span>
                                                            <span className="text-xl font-bold text-primary-600">
                                                                {formatPrice(orderItems.reduce((sum, item) => {
                                                                    const displayPrice = isPremium ? item.price : Math.round(item.price * 1.05);
                                                                    return sum + (displayPrice * item.quantity);
                                                                }, 0))}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {orderItems.reduce((sum, item) => sum + item.quantity, 0)} món đã chọn
                                                        </div>
                                                        <button
                                                            onClick={() => setStep('confirm')}
                                                            className="btn-primary w-full mt-4"
                                                        >
                                                            Tiếp tục
                                                        </button>
                                                    </div>
                                                )}

                                                {orderItems.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <p>Chưa có món nào được chọn</p>
                                                        <p className="text-sm mt-2">Nhấn nút + để thêm món vào giỏ</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 'confirm' && selectedDate && (
                        <div className="animate-fade-in">
                            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 mb-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Thông tin đặt chỗ</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Dịch vụ</span>
                                        <span className="font-medium text-gray-900">{service.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Ngày</span>
                                        <span className="font-medium text-gray-900">
                                            {format(selectedDate, 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Loại đặt chỗ</span>
                                        <span className="font-medium text-gray-900">
                                            {bookingType === 'reservation' ? 'Đặt bàn' : 'Đặt món'}
                                        </span>
                                    </div>
                                    {bookingType === 'reservation' && selectedSlot && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Khung giờ</span>
                                            <span className="font-medium text-gray-900">{selectedSlot}</span>
                                        </div>
                                    )}
                                    {bookingType === 'order' && orderItems.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Danh sách món:</p>
                                            <div className="space-y-2">
                                                {orderItems.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {item.name} × {item.quantity}
                                                        </span>
                                                        <span className="font-medium text-gray-900">
                                                            {formatPrice((isPremium ? item.price : Math.round(item.price * 1.05)) * item.quantity)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quantity - Only show for reservation */}
                            {bookingType === 'reservation' && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-gray-500" />
                                        <span className="font-medium text-gray-900">Số lượng người</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setLocalQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setLocalQuantity(Math.min(10, quantity + 1))}
                                            className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Payment Type Selection */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Chọn phương thức thanh toán</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentType('deposit')}
                                        className={`p-4 rounded-xl border-2 transition-all ${paymentType === 'deposit'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <p className="font-semibold text-gray-900">Đặt cọc 30%</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatPrice(depositPrice)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Thanh toán phần còn lại khi sử dụng
                                        </p>
                                    </button>
                                    <button
                                        onClick={() => setPaymentType('full')}
                                        className={`p-4 rounded-xl border-2 transition-all ${paymentType === 'full'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <p className="font-semibold text-gray-900">Thanh toán toàn bộ</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatPrice(totalPrice)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Thanh toán một lần, không cần thanh toán thêm
                                        </p>
                                    </button>
                                </div>

                                {(() => {
                                    const getBaseTotalPrice = () => {
                                        if (bookingType === 'order') {
                                            return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                        }
                                        return service.priceRange.min * quantity;
                                    };
                                    const baseTotalPrice = getBaseTotalPrice();
                                    const savings = totalPrice - baseTotalPrice;

                                    return !isPremium && savings > 0 ? (
                                        <div className="mt-4 text-xs text-orange-600 bg-orange-50 p-2.5 rounded-xl border border-orange-100 flex items-center justify-between">
                                            <span>Bạn đang thanh toán giá Freemium</span>
                                            <span className="font-semibold text-right">💡 Chỉ {formatPrice(baseTotalPrice)} khi premium</span>
                                        </div>
                                    ) : null;
                                })()}
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 mb-6">
                                {bookingType === 'order' ? (
                                    <>
                                        {orderItems.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-gray-600">
                                                    {item.name} × {item.quantity}
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {formatPrice((isPremium ? item.price : Math.round(item.price * 1.05)) * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">
                                            {isPremium ? 'Đơn giá' : 'Đơn giá (gồm 5% phí dịch vụ)'} × {quantity}
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {formatPrice(totalPrice)}
                                        </span>
                                    </div>
                                )}
                                {paymentType === 'deposit' && (
                                    <div className="flex items-center justify-between text-green-600">
                                        <span>Đặt cọc (30%)</span>
                                        <span className="font-medium">{formatPrice(depositPrice)}</span>
                                    </div>
                                )}
                                {paymentType === 'full' && (
                                    <div className="flex items-center justify-between text-blue-600">
                                        <span>Giảm giá thanh toán sớm</span>
                                        <span className="font-medium">-{formatPrice(depositPrice)}</span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-200"></div>
                                <div className="flex items-center justify-between text-lg">
                                    <span className="font-semibold text-gray-900">Tổng thanh toán</span>
                                    <span className="font-bold text-primary-600">
                                        {formatPrice(finalPaymentAmount)}
                                    </span>
                                </div>
                            </div>

                            {paymentType === 'deposit' && (
                                <div className="p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm mb-6">
                                    <p>
                                        💡 Bạn chỉ cần thanh toán <strong>30% đặt cọc</strong> trước.
                                        Phần còn lại thanh toán khi sử dụng dịch vụ.
                                    </p>
                                </div>
                            )}
                            {paymentType === 'full' && (
                                <div className="p-4 bg-green-50 rounded-xl text-green-800 text-sm mb-6">
                                    <p>
                                        ✅ Bạn sẽ không cần thanh toán thêm khi sử dụng dịch vụ.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <button
                            onClick={onClose}
                            className="btn-ghost flex-1 py-2 sm:py-3 text-sm sm:text-base"
                        >
                            Hủy
                        </button>

                        {step === 'confirm' && (
                            <button
                                onClick={handleConfirm}
                                disabled={isCreating}
                                className="btn-primary flex-1 py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                        <span className="hidden sm:inline">Đang xử lý...</span>
                                        <span className="sm:hidden">Xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:inline">Tiến hành thanh toán</span>
                                        <span className="sm:hidden">Thanh toán</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantBookingModal;
