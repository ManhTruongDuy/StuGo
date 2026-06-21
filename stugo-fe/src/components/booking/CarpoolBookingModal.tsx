import { useState, useEffect } from 'react';
import {
    X,
    Clock,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Loader2,
    Car
} from 'lucide-react';
import type { Carpool } from '../../types';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { createBooking, getAvailableSlots, createTransportPayment } from '../../services';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, isSameDay, isToday, isBefore, isSameMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface CarpoolBookingModalProps {
    service: Carpool;
    onClose: () => void;
}

const CarpoolBookingModal = ({ service, onClose }: CarpoolBookingModalProps) => {
    const { setService, setDate, setTimeSlot, setQuantity } = useBookingStore();
    const { user } = useAuthStore();

    const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [step, setStep] = useState<'date' | 'time' | 'options' | 'confirm'>('date');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [monthOffset, setMonthOffset] = useState(0);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Carpool specific options
    const [bookingType, setBookingType] = useState<'shared' | 'private'>('shared');
    const [passengers, setPassengers] = useState<number>(1);
    const [pickupPoints, setPickupPoints] = useState<number>(1);
    const [isAirport, setIsAirport] = useState<boolean>(false);
    const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
    const [useHighway, setUseHighway] = useState<boolean>(true);
    const [privateSeats, setPrivateSeats] = useState<5 | 7>(5);

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

    // Calculate total price based on options
    const calculatePrice = () => {
        if (!selectedRoute) return 0;
        
        const routeObj = service.carpoolOptions?.routes.find(r => r.name === selectedRoute);
        if (!routeObj) return 0;

        let total = 0;
        if (bookingType === 'shared') {
            const pricing = routeObj.sharedPricing;
            if (passengers === 1) {
                total = pricing.pricePerGuest;
            } else {
                total = pricing.twoGuestsDiscountedPrice || (pricing.pricePerGuest * passengers);
            }
            if (isAirport) {
                total += pricing.airportSurcharge;
            }
            if (pickupPoints > 1) {
                total += pricing.extraPointSurcharge;
            }
        } else {
            const pricing = routeObj.privatePricing;
            if (privateSeats === 5) {
                total = isRoundTrip ? pricing.seats5.twoWayPrice : pricing.seats5.oneWayPrice;
            } else {
                total = isRoundTrip ? pricing.seats7.twoWayPrice : pricing.seats7.oneWayPrice;
            }
        }

        return total;
    };

    const basePrice = calculatePrice();
    const isPremium = user?.plan === 'premium_user';
    const displayUnitPrice = isPremium ? basePrice : Math.round(basePrice * 1.05);
    const totalPrice = displayUnitPrice;
    const finalPaymentAmount = totalPrice;

    // Fetch available slots when date is selected
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedDate || !service) return;

            setIsLoadingSlots(true);
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const result = await getAvailableSlots(service.id, dateStr);
                
                // Fallback to service departure times if backend doesn't return slots
                if (result.slots && result.slots.length > 0) {
                    setAvailableSlots(result.slots);
                } else if (service.departureTime && service.departureTime.length > 0) {
                    const fallbackSlots = service.departureTime.map(time => ({
                        time,
                        route: selectedRoute,
                        available: true,
                        availableSeats: 7
                    }));
                    setAvailableSlots(fallbackSlots);
                }
            } catch (error) {
                console.error('Error fetching slots:', error);
                toast.error('Không thể tải thông tin khả dụng');
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDate, service, selectedRoute]);

    const handleDateSelect = (date: Date) => {
        if (isBefore(date, today) && !isToday(date)) return;
        setSelectedDate(date);
        setSelectedSlot(null);
        setSelectedRoute(null);
        setStep('time');
    };

    const handleConfirm = async () => {
        if (!selectedDate || !selectedRoute || !selectedSlot) {
            toast.error('Vui lòng chọn đầy đủ chuyến và giờ');
            return;
        }

        if (!user) {
            toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');
            return;
        }

        try {
            setIsCreating(true);

            const booking = await createBooking({
                serviceId: service.id,
                date: format(selectedDate, 'yyyy-MM-dd'),
                route: selectedRoute,
                timeSlot: selectedSlot,
                quantity: bookingType === 'shared' ? passengers : privateSeats,
                carpoolDetails: {
                    bookingType,
                    passengers: bookingType === 'shared' ? passengers : privateSeats,
                    isRoundTrip,
                    useHighway,
                    pickupPoints,
                    isAirport
                },
                customerInfo: {
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone,
                },
            });

            if (booking) {
                setService(service);
                setDate(format(selectedDate, 'yyyy-MM-dd'));
                setTimeSlot(selectedSlot);
                setQuantity(bookingType === 'shared' ? passengers : privateSeats);

                try {
                    const payment = await createTransportPayment(booking.id, 'full');
                    if (payment && payment.checkoutUrl) {
                        const accessToken = localStorage.getItem('stugo-token');
                        const userData = localStorage.getItem('user');

                        if (accessToken) sessionStorage.setItem('stugo-token', accessToken);
                        if (userData) sessionStorage.setItem('user', userData);

                        localStorage.setItem('pendingOrderCode', payment.orderCode.toString());
                        toast.success('Đặt chỗ thành công! Đang chuyển đến trang thanh toán...');
                        onClose();

                        const checkoutUrl = new URL(payment.checkoutUrl);
                        checkoutUrl.searchParams.set('orderCode', payment.orderCode.toString());
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

    const renderOptionsStep = () => {
        const routeObj = service.carpoolOptions?.routes.find(r => r.name === selectedRoute);
        
        return (
            <div className="animate-fade-in space-y-6">
                <div className="text-center">
                    <p className="text-gray-500">Tuyến: <span className="font-semibold text-gray-900">{selectedRoute}</span> | Giờ: <span className="font-semibold text-gray-900">{selectedSlot}</span></p>
                    <p className="text-sm text-gray-500 mt-1">Tùy chọn dịch vụ Xe ghép</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <Car className="w-5 h-5 text-primary-500" />
                        <h4 className="font-semibold text-gray-900">Thông tin xe</h4>
                    </div>
                    <p className="text-sm text-gray-600">Loại xe: {service.carpoolOptions?.vehicleInfo.engineType === 'electric' ? 'Xe điện' : 'Xe xăng'}</p>
                    <p className="text-sm text-gray-600">Hãng xe: {service.carpoolOptions?.vehicleInfo.brand} - {service.carpoolOptions?.vehicleInfo.vehicleName}</p>
                </div>

                <div>
                    <h4 className="font-medium text-gray-900 mb-3">Hình thức đặt xe</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setBookingType('shared')}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${bookingType === 'shared' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-200'}`}
                        >
                            Ghép khách (Shared)
                        </button>
                        <button
                            onClick={() => setBookingType('private')}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${bookingType === 'private' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-200'}`}
                        >
                            Bao cả xe (Private)
                        </button>
                    </div>
                </div>

                {bookingType === 'shared' && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Số lượng khách</h4>
                            <div className="flex items-center gap-4">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setPassengers(num)}
                                        className={`w-10 h-10 rounded-full font-medium transition-colors ${passengers === num ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isAirport}
                                    onChange={(e) => setIsAirport(e.target.checked)}
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Đi qua sân bay (Nội Bài)</p>
                                    {routeObj?.sharedPricing?.airportSurcharge ? (
                                        <p className="text-xs text-gray-500">Phụ phí: {formatPrice(routeObj.sharedPricing.airportSurcharge)}</p>
                                    ) : null}
                                </div>
                            </label>
                            
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2 text-sm">Số điểm đón/trả</h4>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPickupPoints(1)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${pickupPoints === 1 ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        1 Điểm
                                    </button>
                                    <button
                                        onClick={() => setPickupPoints(2)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${pickupPoints === 2 ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        2 Điểm
                                    </button>
                                </div>
                                {pickupPoints > 1 && routeObj?.sharedPricing?.extraPointSurcharge ? (
                                    <p className="text-xs text-gray-500 mt-1">Phụ phí nhiều điểm: {formatPrice(routeObj.sharedPricing.extraPointSurcharge)}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}

                {bookingType === 'private' && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Loại xe</h4>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPrivateSeats(5)}
                                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${privateSeats === 5 ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    Xe 5 Chỗ
                                </button>
                                <button
                                    onClick={() => setPrivateSeats(7)}
                                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${privateSeats === 7 ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    Xe 7 Chỗ
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Hành trình</h4>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsRoundTrip(false)}
                                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${!isRoundTrip ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    1 Chiều
                                </button>
                                <button
                                    onClick={() => setIsRoundTrip(true)}
                                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${isRoundTrip ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    2 Chiều (Khứ hồi)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                            type="checkbox"
                            checked={useHighway}
                            onChange={(e) => setUseHighway(e.target.checked)}
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <div>
                            <p className="font-medium text-gray-900 text-sm">Đi cao tốc</p>
                            <p className="text-xs text-gray-500">Tiết kiệm thời gian di chuyển</p>
                        </div>
                    </label>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl max-h-[95vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl animate-scale-in overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {step !== 'date' && (
                            <button
                                onClick={() => {
                                    if (step === 'confirm') setStep('options');
                                    else if (step === 'options') setStep('time');
                                    else setStep('date');
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {step === 'date' && 'Chọn ngày'}
                                {step === 'time' && 'Chọn chuyến & giờ'}
                                {step === 'options' && 'Tùy chọn di chuyển'}
                                {step === 'confirm' && 'Xác nhận đặt xe'}
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
                    {step === 'date' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={() => setMonthOffset(monthOffset - 1)}
                                    disabled={monthOffset === 0}
                                    className={`p-2 rounded-lg transition-colors ${monthOffset === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-medium text-gray-900">
                                    {format(currentMonth, 'MMMM yyyy', { locale: vi })}
                                </span>
                                <button
                                    onClick={() => setMonthOffset(monthOffset + 1)}
                                    disabled={monthOffset >= 11}
                                    className={`p-2 rounded-lg transition-colors ${monthOffset >= 11 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
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
                                            className={`p-3 rounded-xl transition-all ${!isCurrentMonth ? 'text-gray-300 cursor-default' : isPast ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg' : isTodayDate ? 'bg-primary-50 text-primary-600 hover:bg-primary-100' : 'hover:bg-gray-100 text-gray-700'}`}
                                        >
                                            <p className="text-xl font-bold">{format(date, 'd')}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 'time' && selectedDate && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-6">
                                <p className="text-gray-500">Ngày đã chọn</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Chọn tuyến</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {(service.carpoolOptions?.routes || []).map((routeItem) => {
                                        return (
                                            <button
                                                key={routeItem.name}
                                                onClick={() => {
                                                    setSelectedRoute(routeItem.name);
                                                    setSelectedSlot(null);
                                                    setUseHighway(routeItem.isHighwayDefault !== false);
                                                }}
                                                className={`p-4 rounded-xl flex items-center justify-between transition-all border-2 ${selectedRoute === routeItem.name ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                                            >
                                                <p className="font-medium text-gray-900">{routeItem.name}</p>
                                                <p className="text-sm text-gray-500">Từ {formatPrice(routeItem.sharedPricing?.pricePerGuest || 0)}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedRoute && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Chọn giờ khởi hành</h3>
                                    {isLoadingSlots ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-3">
                                            {availableSlots
                                                .filter((slot: any) => !slot.route || slot.route === selectedRoute)
                                                .map((slot: any, idx: number) => {
                                                    const isSelected = selectedSlot === slot.time;
                                                    const isAvailable = slot.available !== false;

                                                    return (
                                                        <button
                                                            key={`${idx}-${slot.time}`}
                                                            onClick={() => {
                                                                if (isAvailable) {
                                                                    setSelectedSlot(slot.time);
                                                                    setStep('options');
                                                                }
                                                            }}
                                                            disabled={!isAvailable}
                                                            className={`p-3 rounded-xl text-center transition-all ${!isAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : isSelected ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
                                                        >
                                                            <Clock className="w-4 h-4 mx-auto mb-1" />
                                                            <p className="font-medium">{slot.time}</p>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'options' && renderOptionsStep()}

                    {step === 'confirm' && (
                        <div className="animate-fade-in">
                            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 mb-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Thông tin chuyến xe ghép</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">Ngày</span><span className="font-medium">{format(selectedDate!, 'dd/MM/yyyy')}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Tuyến</span><span className="font-medium">{selectedRoute}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Giờ đi</span><span className="font-medium">{selectedSlot}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Hình thức</span><span className="font-medium">{bookingType === 'shared' ? 'Ghép khách' : 'Bao xe'}</span></div>
                                    {bookingType === 'shared' ? (
                                        <>
                                            <div className="flex justify-between"><span className="text-gray-600">Số lượng khách</span><span className="font-medium">{passengers} người</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Điểm đón/trả</span><span className="font-medium">{pickupPoints} điểm</span></div>
                                            {isAirport && <div className="flex justify-between"><span className="text-gray-600">Sân bay</span><span className="font-medium">Có (Nội Bài)</span></div>}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between"><span className="text-gray-600">Loại xe</span><span className="font-medium">Xe {privateSeats} chỗ</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Hành trình</span><span className="font-medium">{isRoundTrip ? 'Khứ hồi (2 chiều)' : '1 Chiều'}</span></div>
                                        </>
                                    )}
                                    <div className="flex justify-between"><span className="text-gray-600">Đi cao tốc</span><span className="font-medium">{useHighway ? 'Có' : 'Không'}</span></div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Tạm tính</span>
                                    <span className="font-medium text-gray-900">{formatPrice(basePrice)}</span>
                                </div>
                                {!isPremium && (
                                    <div className="flex items-center justify-between text-gray-600">
                                        <span>Phí dịch vụ (5%)</span>
                                        <span className="font-medium text-gray-900">{formatPrice(totalPrice - basePrice)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between font-semibold text-gray-900 border-t border-dashed pt-2 text-lg">
                                    <span>Tổng thanh toán</span>
                                    <span className="font-bold text-primary-600">{formatPrice(finalPaymentAmount)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <button onClick={onClose} className="btn-ghost flex-1 py-2 sm:py-3 text-sm sm:text-base">Hủy</button>

                        {step === 'options' && (
                            <button onClick={() => setStep('confirm')} className="btn-primary flex-1 py-2 sm:py-3 text-sm sm:text-base shadow-md">
                                Tiếp tục
                            </button>
                        )}

                        {step === 'confirm' && (
                            <button onClick={handleConfirm} disabled={isCreating} className="btn-primary flex-1 py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50">
                                {isCreating ? (
                                    <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />Đang xử lý...</>
                                ) : (
                                    <><CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />Thanh toán</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarpoolBookingModal;
