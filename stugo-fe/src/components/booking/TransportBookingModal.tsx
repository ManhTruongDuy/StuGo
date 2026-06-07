import { useState, useEffect, useMemo } from 'react';
import {
    X,
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    Users,
    CreditCard,
    Loader2
} from 'lucide-react';
import type { Transport } from '../../types';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { createBooking, getAvailableSlots, createTransportPayment } from '../../services';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, isSameDay, isToday, isBefore, isSameMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface TransportBookingModalProps {
    service: Transport;
    onClose: () => void;
}

const TransportBookingModal = ({ service, onClose }: TransportBookingModalProps) => {
    const { setService, setDate, setTimeSlot, setQuantity } = useBookingStore();
    const { user } = useAuthStore();

    const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [step, setStep] = useState<'date' | 'time' | 'seats' | 'confirm'>('date');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
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

    // Seeded random number generator
    const getSeededRandom = (seed: string) => {
        let h = 0;
        for (let i = 0; i < seed.length; i++) {
            h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
        }
        return function () {
            let t = h += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    };

    // Seeded random occupied seats generator
    const getOccupiedSeats = (
        serviceId: string,
        dateStr: string,
        timeSlot: string,
        route: string,
        totalSeats: number,
        bookedSeatsList: string[]
    ) => {
        const seed = `${serviceId}-${dateStr}-${timeSlot}-${route}`;
        const random = getSeededRandom(seed);

        // Occupy between 30% and 60% of the seats randomly
        const percentage = 0.3 + random() * 0.3;
        const numRandomOccupied = Math.floor(totalSeats * percentage);

        // Generate all seat IDs
        const allSeatIds: string[] = [];
        const isSleeper = service.vehicleType?.toLowerCase().includes('giường') || 
                          service.vehicleType?.toLowerCase().includes('nằm') || 
                          totalSeats >= 20;

        if (isSleeper) {
            const half = Math.ceil(totalSeats / 2);
            for (let i = 1; i <= half; i++) {
                allSeatIds.push(`A${i.toString().padStart(2, '0')}`);
            }
            const otherHalf = totalSeats - half;
            for (let i = 1; i <= otherHalf; i++) {
                allSeatIds.push(`B${i.toString().padStart(2, '0')}`);
            }
        } else {
            for (let i = 1; i <= totalSeats; i++) {
                allSeatIds.push(`A${i.toString().padStart(2, '0')}`);
            }
        }

        const occupiedSet = new Set<string>(bookedSeatsList);
        const candidateSeats = allSeatIds.filter(seat => !occupiedSet.has(seat));

        const shuffledCandidates = [...candidateSeats].sort(() => random() - 0.5);
        const toOccupyCount = Math.min(numRandomOccupied, shuffledCandidates.length);
        for (let i = 0; i < toOccupyCount; i++) {
            occupiedSet.add(shuffledCandidates[i]);
        }

        return Array.from(occupiedSet);
    };

    const totalSeats = service.seats || 24;
    const isSleeper = service.vehicleType?.toLowerCase().includes('giường') || 
                      service.vehicleType?.toLowerCase().includes('nằm') || 
                      totalSeats >= 20;

    // Generate all seat IDs
    const allSeats = useMemo(() => {
        const seatsList: string[] = [];
        if (isSleeper) {
            const half = Math.ceil(totalSeats / 2);
            for (let i = 1; i <= half; i++) {
                seatsList.push(`A${i.toString().padStart(2, '0')}`);
            }
            const otherHalf = totalSeats - half;
            for (let i = 1; i <= otherHalf; i++) {
                seatsList.push(`B${i.toString().padStart(2, '0')}`);
            }
        } else {
            for (let i = 1; i <= totalSeats; i++) {
                seatsList.push(`A${i.toString().padStart(2, '0')}`);
            }
        }
        return seatsList;
    }, [totalSeats, isSleeper]);

    const occupiedSeats = useMemo(() => {
        if (!selectedDate || !selectedRoute || !selectedSlot) return [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const currentSlot = availableSlots.find(
            (slot: any) => slot.route === selectedRoute && slot.time === selectedSlot
        );
        const bookedList = currentSlot?.bookedSeatsList || [];
        return getOccupiedSeats(service.id, dateStr, selectedSlot, selectedRoute, totalSeats, bookedList);
    }, [selectedDate, selectedRoute, selectedSlot, availableSlots, service.id, totalSeats]);

    const lowerDeckSeats = useMemo(() => allSeats.filter(s => s.startsWith('A')), [allSeats]);
    const upperDeckSeats = useMemo(() => allSeats.filter(s => s.startsWith('B')), [allSeats]);

    // Fetch available slots when date is selected
    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedDate || !service) return;

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
    }, [selectedDate, service]);

    const handleDateSelect = (date: Date) => {
        if (isBefore(date, today) && !isToday(date)) return;
        setSelectedDate(date);
        setSelectedSlot(null);
        setSelectedRoute(null);
        setSelectedSeats([]);
        setStep('time');
    };

    const handleConfirm = async () => {
        if (!selectedDate || !selectedRoute || !selectedSlot || selectedSeats.length === 0) {
            toast.error('Vui lòng chọn đầy đủ chuyến, giờ và chỗ ngồi');
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
                quantity: selectedSeats.length,
                seats: selectedSeats,
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
                setQuantity(selectedSeats.length);

                // Create payment link
                try {
                    const payment = await createTransportPayment(booking.id, paymentType);
                    if (payment && payment.checkoutUrl) {
                        // ✅ Lưu token và user vào sessionStorage trước khi redirect đến PayOS
                        // Điều này đảm bảo token không bị mất khi redirect về từ PayOS
                        const accessToken = localStorage.getItem('token');
                        const userData = localStorage.getItem('user');

                        if (accessToken) {
                            sessionStorage.setItem('token', accessToken);
                        }
                        if (userData) {
                            sessionStorage.setItem('user', userData);
                        }

                        // Lưu orderCode để xử lý sau khi thanh toán
                        localStorage.setItem('pendingOrderCode', payment.orderCode.toString());

                        toast.success('Đặt chỗ thành công! Đang chuyển đến trang thanh toán...');
                        onClose();

                        // Thêm orderCode vào URL để fallback nếu localStorage mất
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

    const quantityToUse = selectedSeats.length || 1;
    const isPremium = user?.plan === 'premium_user';
    const selectedRouteObj = service.routes?.find(r => (typeof r === 'string' ? r === selectedRoute : r.name === selectedRoute));
    const basePrice = selectedRouteObj && typeof selectedRouteObj !== 'string' ? selectedRouteObj.price : service.priceRange.min;
    const displayUnitPrice = isPremium ? basePrice : Math.round(basePrice * 1.05);
    const totalPrice = displayUnitPrice * quantityToUse;
    const depositPrice = totalPrice * 0.3;
    const finalPaymentAmount = paymentType === 'full' ? totalPrice : depositPrice;

    const renderSeat = (seatId: string) => {
        const isOccupied = occupiedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        let seatClass = "";
        let pillowClass = "";

        if (isOccupied) {
            seatClass = "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed";
            pillowClass = "bg-gray-200 border-gray-300";
        } else if (isSelected) {
            seatClass = "bg-primary-500 border-primary-600 text-white shadow-md scale-95";
            pillowClass = "bg-primary-600 border-primary-700";
        } else {
            seatClass = "bg-white border-primary-500 text-primary-600 hover:bg-primary-50 hover:scale-105 active:scale-95";
            pillowClass = "bg-primary-50 border-primary-100";
        }

        return (
            <button
                key={seatId}
                disabled={isOccupied}
                onClick={() => {
                    if (isSelected) {
                        setSelectedSeats(selectedSeats.filter(s => s !== seatId));
                    } else {
                        setSelectedSeats([...selectedSeats, seatId]);
                    }
                }}
                className={`w-12 h-16 border rounded-xl flex flex-col justify-between items-center p-1.5 transition-all duration-200 relative ${seatClass}`}
            >
                {isOccupied ? (
                    <span className="text-gray-300 font-bold text-sm select-none">✕</span>
                ) : (
                    <span className="text-xs font-bold font-mono tracking-tight">{seatId}</span>
                )}
                {/* Pillow/headrest at the bottom */}
                <div className={`h-2.5 rounded-md border w-full transition-colors duration-200 ${pillowClass}`}></div>
            </button>
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
                                    if (step === 'confirm') setStep('seats');
                                    else if (step === 'seats') setStep('time');
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
                                {step === 'seats' && 'Chọn chỗ ngồi'}
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

                    {/* Step 2: Route + Time Selection */}
                    {step === 'time' && selectedDate && (
                        <div className="animate-fade-in">
                            <div className="text-center mb-6">
                                <p className="text-gray-500">Ngày đã chọn</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                                </p>
                            </div>

                            {/* Route Selection */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Chọn tuyến</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {(service.routes || []).map((routeItem) => {
                                        const routeName = typeof routeItem === 'string' ? routeItem : routeItem.name;
                                        const routePrice = typeof routeItem === 'string' ? service.priceRange.min : routeItem.price;
                                        const routeUnitPrice = isPremium ? routePrice : Math.round(routePrice * 1.05);
                                        return (
                                            <button
                                                key={routeName}
                                                onClick={() => {
                                                    setSelectedRoute(routeName);
                                                    setSelectedSlot(null);
                                                    setSelectedSeats([]);
                                                }}
                                                className={`p-4 rounded-xl flex items-center justify-between transition-all border-2 ${selectedRoute === routeName
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-primary-300'
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{routeName}</p>
                                                    {!isPremium && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatPrice(routePrice)} khi Premium
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-primary-600">
                                                    {formatPrice(routeUnitPrice)}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Departure Time Selection */}
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
                                                .filter((slot: any) => slot.route === selectedRoute)
                                                .map((slot: any) => {
                                                    const isSelected = selectedSlot === slot.time;
                                                    const isAvailable = slot.available && slot.availableSeats >= 1;

                                                    return (
                                                        <button
                                                            key={`${slot.route}-${slot.time}`}
                                                            onClick={() => {
                                                                if (isAvailable) {
                                                                    setSelectedSlot(slot.time);
                                                                    setStep('seats');
                                                                } else {
                                                                    toast.error(`Không còn ghế trống`);
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
                                                                {slot.availableSeats} ghế
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Seat Selection */}
                    {step === 'seats' && selectedDate && selectedRoute && selectedSlot && (
                        <div className="animate-fade-in flex flex-col items-center">
                            <div className="text-center mb-6">
                                <p className="text-gray-500">Tuyến: <span className="font-semibold text-gray-900">{selectedRoute}</span> | Giờ: <span className="font-semibold text-gray-900">{selectedSlot}</span></p>
                                <p className="text-sm text-gray-500 mt-1">Vui lòng chọn chỗ ngồi (Chọn tối đa theo số ghế trống)</p>
                            </div>

                            {/* Decks/Grid */}
                            <div className="w-full mb-6">
                                {isSleeper ? (
                                    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                                        {/* Tầng dưới */}
                                        <div className="flex flex-col items-center">
                                            <h4 className="text-sm font-semibold text-gray-600 mb-2">Tầng dưới</h4>
                                            <div className="w-full bg-gray-55 rounded-3xl p-4 flex flex-col gap-4 border border-gray-200/80">
                                                {/* Driver Section */}
                                                <div className="flex justify-between items-center px-1">
                                                    <div className="p-1.5 rounded-full bg-gray-200 text-gray-500">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <circle cx="12" cy="12" r="3" />
                                                            <line x1="12" y1="2" x2="12" y2="9" />
                                                            <line x1="2" y1="12" x2="9" y2="12" />
                                                            <line x1="15" y1="12" x2="22" y2="12" />
                                                        </svg>
                                                    </div>
                                                    <div className="w-6 h-6"></div>
                                                </div>
                                                {/* Seats Grid */}
                                                <div className="grid grid-cols-2 gap-3 justify-items-center">
                                                    {lowerDeckSeats.map(seat => renderSeat(seat))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tầng trên */}
                                        <div className="flex flex-col items-center">
                                            <h4 className="text-sm font-semibold text-gray-600 mb-2">Tầng trên</h4>
                                            <div className="w-full bg-gray-55 rounded-3xl p-4 flex flex-col gap-4 border border-gray-200/80">
                                                <div className="h-9"></div>
                                                {/* Seats Grid */}
                                                <div className="grid grid-cols-2 gap-3 justify-items-center">
                                                    {upperDeckSeats.map(seat => renderSeat(seat))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center max-w-[200px] mx-auto">
                                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Sơ đồ ghế</h4>
                                        <div className="w-full bg-gray-55 rounded-3xl p-4 flex flex-col gap-4 border border-gray-200/80">
                                            {/* Driver Section */}
                                            <div className="flex justify-between items-center px-1">
                                                <div className="p-1.5 rounded-full bg-gray-200 text-gray-500">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <circle cx="12" cy="12" r="3" />
                                                        <line x1="12" y1="2" x2="12" y2="9" />
                                                        <line x1="2" y1="12" x2="9" y2="12" />
                                                        <line x1="15" y1="12" x2="22" y2="12" />
                                                    </svg>
                                                </div>
                                                <div className="w-6 h-6"></div>
                                            </div>
                                            {/* Seats Grid */}
                                            <div className="grid grid-cols-2 gap-3 justify-items-center">
                                                {allSeats.map(seat => renderSeat(seat))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="flex justify-center gap-6 text-xs text-gray-650 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-5 border border-gray-200 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-300">✕</div>
                                    <span>Đã đặt</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-5 border border-primary-500 bg-white rounded"></div>
                                    <span>Trống</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-5 bg-primary-500 border border-primary-600 rounded"></div>
                                    <span>Đang chọn</span>
                                </div>
                            </div>

                            {/* Selection summary */}
                            <div className="w-full bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Ghế đã chọn</p>
                                    <p className="font-semibold text-primary-700">
                                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setStep('confirm')}
                                    disabled={selectedSeats.length === 0}
                                    className="px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-200"
                                >
                                    Tiếp tục
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 'confirm' && selectedDate && selectedRoute && selectedSlot && (
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
                                        <span className="text-gray-600">Tuyến</span>
                                        <span className="font-medium text-gray-900">{selectedRoute}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Giờ khởi hành</span>
                                        <span className="font-medium text-gray-900">{selectedSlot}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium text-gray-900">Chỗ ngồi đã chọn</p>
                                        <p className="text-xs text-gray-500">Danh sách ghế ngồi đặt giữ chỗ</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-lg">{selectedSeats.join(', ')}</p>
                                    <p className="text-xs text-gray-500">({selectedSeats.length} ghế)</p>
                                </div>
                            </div>

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
                                        className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${paymentType === 'full'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900">Thanh toán toàn bộ</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 text-left">
                                            {formatPrice(totalPrice)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2 text-left">
                                            Thanh toán một lần, không cần thanh toán thêm
                                        </p>
                                    </button>
                                </div>

                                {!isPremium && (
                                    <div className="mt-4 text-xs text-orange-600 bg-orange-50 p-2.5 rounded-xl border border-orange-100 flex items-center justify-between font-medium">
                                        <span>Bạn đang thanh toán với giá Freemium (gồm 5% phí dịch vụ)</span>
                                        <span className="font-semibold text-right"> {formatPrice(basePrice * quantityToUse)} khi Premium</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        Đơn giá × {quantityToUse}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(basePrice * quantityToUse)}
                                    </span>
                                </div>
                                {!isPremium && (
                                    <div className="flex items-center justify-between text-gray-600">
                                        <span>Phí dịch vụ (5%)</span>
                                        <span className="font-medium text-gray-900">
                                            {formatPrice(totalPrice - (basePrice * quantityToUse))}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between font-semibold text-gray-900 border-t border-dashed pt-2">
                                    <span>Tổng tiền</span>
                                    <span>
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                                {paymentType === 'deposit' && (
                                    <div className="flex items-center justify-between text-green-600">
                                        <span>Đặt cọc (30%)</span>
                                        <span className="font-medium">{formatPrice(depositPrice)}</span>
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
                                        Bạn chỉ cần thanh toán <strong>30% đặt cọc</strong> trước.
                                        Phần còn lại thanh toán khi sử dụng dịch vụ.
                                    </p>
                                </div>
                            )}
                            {paymentType === 'full' && (
                                <div className="p-4 bg-green-50 rounded-xl text-green-800 text-sm mb-6">
                                    <p>
                                        Bạn sẽ không cần thanh toán thêm khi sử dụng dịch vụ.
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

export default TransportBookingModal;
