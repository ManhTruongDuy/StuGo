import type { Service } from '../../types';
import TransportBookingModal from './TransportBookingModal';
import AccommodationBookingModal from './AccommodationBookingModal';
import RestaurantBookingModal from './RestaurantBookingModal';

interface BookingModalProps {
    service: Service;
    onClose: () => void;
}

const BookingModal = ({ service, onClose }: BookingModalProps) => {
    // Route to appropriate modal based on service type
    switch (service.type) {
        case 'transport':
            return <TransportBookingModal service={service as any} onClose={onClose} />;
        case 'accommodation':
            return <AccommodationBookingModal service={service as any} onClose={onClose} />;
        case 'restaurant':
            return <RestaurantBookingModal service={service as any} onClose={onClose} />;
        default:
            return null;
    }
};

export default BookingModal;
