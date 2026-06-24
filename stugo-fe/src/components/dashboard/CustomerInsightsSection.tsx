import { useState, useEffect } from 'react';
import { PieChart, Users, Clock, MapPin, Lock, Zap } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

const CustomerInsightsSection = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const isPremium = user?.plan === 'business_premium';

    useEffect(() => {
        if (isPremium) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const res = await api.get('/dashboard/premium/customer-insights');
                    if (res.data.success) {
                        setData(res.data.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch insights', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isPremium]);

    if (!isPremium) {
        return (
            <div className="card p-8 bg-gray-50 border border-gray-100 relative overflow-hidden group h-full flex flex-col justify-center items-center text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-gray-100/50 backdrop-blur-sm z-0"></div>
                <div className="relative z-10 max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Insights</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        Thấu hiểu hành vi khách hàng với các báo cáo chuyên sâu. Đặc quyền dành riêng cho đối tác Business Premium.
                    </p>
                    <Link to="/subscription?type=partner" className="btn-primary py-2.5 px-6 shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Nâng cấp ngay
                    </Link>
                </div>
            </div>
        );
    }

    if (loading || !data) {
        return (
            <div className="card p-6 h-full flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="card p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Customer Insights</h2>
                    <p className="text-xs text-gray-500">Phân tích hành vi & nhân khẩu học</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Retention */}
                <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Khách hàng</span>
                        <span className="text-gray-900 font-bold">100%</span>
                    </div>
                    <div className="h-4 rounded-full flex overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${data.retention.newCustomers}%` }}></div>
                        <div className="bg-cyan-400 h-full" style={{ width: `${data.retention.returningCustomers}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Khách mới ({data.retention.newCustomers}%)</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400"></div> Quay lại ({data.retention.returningCustomers}%)</span>
                    </div>
                </div>

                {/* Booking Hours */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500"/> Giờ đặt vé phổ biến</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {data.bookingHours.labels.map((label: string, idx: number) => (
                            <div key={label} className="flex flex-col items-center">
                                <div className="w-full bg-orange-50 rounded-t-md flex items-end justify-center p-1" style={{ height: '60px' }}>
                                    <div className="w-full bg-orange-400 rounded-sm transition-all" style={{ height: `${data.bookingHours.series[idx]}%` }}></div>
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Locations */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500"/> Khu vực tập trung</h3>
                    <div className="space-y-2">
                        {data.topLocations.slice(0,3).map((loc: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="w-4 text-gray-400 font-mono text-xs">{idx+1}</span>
                                <span className="flex-1 text-gray-700">{loc.name}</span>
                                <span className="font-semibold text-emerald-600">{loc.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerInsightsSection;
