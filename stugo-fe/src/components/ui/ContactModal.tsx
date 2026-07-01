import { Phone, Mail, MessageCircle } from 'lucide-react';
import Modal from './Modal';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName: string;
    serviceType: string;
    phone?: string;
    email?: string;
}

const ContactModal = ({ isOpen, onClose, serviceName, phone, email: propsEmail }: ContactModalProps) => {
    const phoneNumber = phone || '0962758608'; // Default demo phone number if not provided
    const email = propsEmail || 'stugo.service@gmail.com';
    const zaloLink = `https://zalo.me/${phoneNumber}`;

    const handleCall = () => {
        window.location.href = `tel:${phoneNumber}`;
    };

    const handleEmail = () => {
        window.location.href = `mailto:${email}?subject=Liên hệ về ${serviceName}`;
    };

    const handleZalo = () => {
        window.open(zaloLink, '_blank');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="relative">

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Liên hệ với chúng tôi</h2>
                    <p className="text-gray-600">
                        Chọn phương thức liên hệ phù hợp với bạn
                    </p>
                </div>

                <div className="space-y-3">
                    {/* Phone Call */}
                    <button
                        onClick={handleCall}
                        className="w-full flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-colors">
                            <Phone className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">Gọi điện thoại</p>
                            <p className="text-sm text-gray-500">{phoneNumber}</p>
                        </div>
                    </button>

                    {/* Zalo */}
                    <button
                        onClick={handleZalo}
                        className="w-full flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                            <MessageCircle className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">Chat qua Zalo</p>
                            <p className="text-sm text-gray-500">Nhắn tin trực tiếp</p>
                        </div>
                    </button>

                    {/* Email */}
                    <button
                        onClick={handleEmail}
                        className="w-full flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                            <Mail className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900">Gửi email</p>
                            <p className="text-sm text-gray-500">{email}</p>
                        </div>
                    </button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 text-center">
                        <span className="font-medium">Giờ làm việc:</span> 8:00 - 22:00 hàng ngày
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ContactModal;
