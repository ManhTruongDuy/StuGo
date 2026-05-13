import { useState } from 'react';
import { Bus, Home, UtensilsCrossed, Info } from 'lucide-react';
import CreateTransportForm from '../../components/service/CreateTransportForm';
import CreateAccommodationForm from '../../components/service/CreateAccommodationForm';
import CreateRestaurantForm from '../../components/service/CreateRestaurantForm';

type ServiceType = 'transport' | 'accommodation' | 'restaurant';

const CreateServicePage = () => {
    const [selectedType, setSelectedType] = useState<ServiceType>('transport');

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Tạo dịch vụ mới
                </h1>
                <p className="text-gray-500">
                    Chọn loại dịch vụ và điền thông tin chi tiết
                </p>
            </div>

            {/* Commission Notice */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-yellow-800">Thông báo về hoa hồng</p>
                    <p className="text-sm text-yellow-700">
                        Nền tảng sẽ thu 30% hoa hồng trên mỗi đặt chỗ thành công.
                    </p>
                </div>
            </div>

            {/* Service Type Selection - Always visible */}
            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    {
                        type: 'transport' as const,
                        icon: Bus,
                        label: 'Nhà xe',
                        color: 'blue',
                    },
                    {
                        type: 'accommodation' as const,
                        icon: Home,
                        label: 'Nhà trọ',
                        color: 'purple',
                    },
                    {
                        type: 'restaurant' as const,
                        icon: UtensilsCrossed,
                        label: 'Quán ăn',
                        color: 'orange',
                    },
                ].map((item) => (
                    <button
                        key={item.type}
                        onClick={() => setSelectedType(item.type)}
                        className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${selectedType === item.type
                                ? `border-${item.color}-500 bg-${item.color}-50`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center ${selectedType === item.type
                                    ? `bg-${item.color}-500 text-white`
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            <item.icon className="w-7 h-7" />
                        </div>
                        <span
                            className={`font-medium ${selectedType === item.type ? 'text-gray-900' : 'text-gray-600'
                                }`}
                        >
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Forms - Show based on selection */}
            {selectedType === 'transport' && <CreateTransportForm />}
            {selectedType === 'accommodation' && <CreateAccommodationForm />}
            {selectedType === 'restaurant' && <CreateRestaurantForm />}
        </div>
    );
};

export default CreateServicePage;
