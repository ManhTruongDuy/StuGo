import { create } from 'zustand';
import type { Booking, Service } from '../types';

interface BookingState {
  currentBooking: {
    service: Service | null;
    date: string | null;
    timeSlot: string | null;
    quantity: number;
    totalAmount: number;
    depositAmount: number;
    hasInsurance: boolean;
  };
  bookings: Booking[];
  setService: (service: Service) => void;
  setDate: (date: string) => void;
  setTimeSlot: (timeSlot: string) => void;
  setQuantity: (quantity: number) => void;
  setHasInsurance: (hasInsurance: boolean) => void;
  calculateTotal: () => void;
  resetBooking: () => void;
  setBookings: (bookings: Booking[]) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  currentBooking: {
    service: null,
    date: null,
    timeSlot: null,
    quantity: 1,
    totalAmount: 0,
    depositAmount: 0,
    hasInsurance: false,
  },
  bookings: [],
  
  setService: (service) =>
    set((state) => ({
      currentBooking: {
        ...state.currentBooking,
        service,
      },
    })),
    
  setDate: (date) =>
    set((state) => ({
      currentBooking: {
        ...state.currentBooking,
        date,
      },
    })),
    
  setTimeSlot: (timeSlot) =>
    set((state) => ({
      currentBooking: {
        ...state.currentBooking,
        timeSlot,
      },
    })),
    
  setQuantity: (quantity) => {
    set((state) => ({
      currentBooking: {
        ...state.currentBooking,
        quantity,
      },
    }));
    get().calculateTotal();
  },
  
  setHasInsurance: (hasInsurance) => {
    set((state) => ({
      currentBooking: {
        ...state.currentBooking,
        hasInsurance,
      },
    }));
    get().calculateTotal();
  },

  calculateTotal: () => {
    const { service, quantity, hasInsurance } = get().currentBooking;
    if (service) {
      const price = service.priceRange.min;
      let totalAmount = price * quantity;
      
      // Calculate insurance per ticket if applicable
      if (service.type === 'transport' && hasInsurance) {
        totalAmount += 20000 * quantity;
      }
      
      const depositAmount = totalAmount; // No deposit, pay in full
      set((state) => ({
        currentBooking: {
          ...state.currentBooking,
          totalAmount,
          depositAmount,
        },
      }));
    }
  },
  
  resetBooking: () =>
    set({
      currentBooking: {
        service: null,
        date: null,
        timeSlot: null,
        quantity: 1,
        totalAmount: 0,
        depositAmount: 0,
        hasInsurance: false,
      },
    }),
    
  setBookings: (bookings) => set({ bookings }),
}));
