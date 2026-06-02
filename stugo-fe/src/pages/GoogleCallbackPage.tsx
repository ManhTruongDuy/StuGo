import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getCurrentUser } from '../services/auth.service';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            toast.error('Đăng nhập Google thất bại');
            navigate('/login');
            return;
        }

        const finish = async () => {
            try {
                localStorage.setItem('stugo-token', token);
                const res = await getCurrentUser();
                if (res.success && res.data) {
                    const u = res.data;
                    login({
                        id: u.id,
                        email: u.email,
                        fullName: u.fullName,
                        avatar: u.avatar,
                        phone: u.phone,
                        role: u.role,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }, token);
                    toast.success(`Chào mừng ${u.fullName}!`);
                    if (u.role === 'admin') navigate('/admin');
                    else if (u.role === 'partner') navigate('/manager');
                    else navigate('/');
                } else {
                    throw new Error('Không lấy được thông tin người dùng');
                }
            } catch {
                localStorage.removeItem('stugo-token');
                toast.error('Đăng nhập Google thất bại');
                navigate('/login');
            }
        };

        finish();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-3" />
                <p className="text-gray-600">Đang xử lý đăng nhập Google...</p>
            </div>
        </div>
    );
};

export default GoogleCallbackPage;
