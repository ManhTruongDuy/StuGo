import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import ManagerLayout from './components/manager/ManagerLayout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import ServiceListPage from './pages/ServiceListPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import AccountPage from './pages/AccountPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SubscriptionPaymentPage from './pages/SubscriptionPaymentPage';
import SnapMapPage from './pages/SnapMapPage';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerBookingsPage from './pages/manager/ManagerBookingsPage';
import MyServicesPage from './pages/manager/MyServicesPage';
import EditServicePage from './pages/manager/EditServicePage';
import RevenueDetailsPage from './pages/manager/RevenueDetailsPage';
import CreateServicePage from './pages/manager/CreateServicePage';
import WithdrawalHistoryPage from './pages/manager/WithdrawalHistoryPage';

import PartnerRegisterPage from './pages/PartnerRegisterPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersListPage from './pages/admin/UsersListPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminPartnersPage from './pages/admin/AdminPartnersPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';

function App() {
  return (
    <>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              padding: '16px',
              borderRadius: '12px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="services" element={<ServiceListPage />} />
            <Route path="services/:type" element={<ServiceListPage />} />
            <Route path="service/:id" element={<ServiceDetailPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="payment/success" element={<PaymentSuccessPage />} />
            <Route path="payment/cancel" element={<PaymentCancelPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="bookings" element={<BookingHistoryPage />} />
            <Route path="favorites" element={<ServiceListPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="subscription/payment" element={<SubscriptionPaymentPage />} />
            <Route path="snap-map" element={<SnapMapPage />} />
          </Route>

          {/* Auth Routes (No Layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/partner" element={<PartnerRegisterPage />} />
          <Route path="/partner/register" element={<PartnerRegisterPage />} />
          <Route path="/auth/google/success" element={<GoogleCallbackPage />} />

          {/* Manager Routes */}
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="bookings" element={<ManagerBookingsPage />} />
            <Route path="services" element={<MyServicesPage />} />
            <Route path="services/:id/edit" element={<EditServicePage />} />
            <Route path="revenue" element={<RevenueDetailsPage />} />
            <Route path="create" element={<CreateServicePage />} />
            <Route path="withdrawals" element={<WithdrawalHistoryPage />} />
            <Route path="settings" element={<AccountPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="revenue" element={<RevenueDetailsPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="withdrawals" element={<WithdrawalHistoryPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="users" element={<UsersListPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="complaints" element={<AdminComplaintsPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
