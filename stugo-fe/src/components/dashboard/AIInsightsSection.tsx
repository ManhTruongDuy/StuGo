import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertCircle, TrendingDown, Lock, Zap, Megaphone } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

const AIInsightsSection = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const isPremium = user?.plan === 'business_premium';

    useEffect(() => {
        if (isPremium) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const res = await api.get('/dashboard/premium/route-analytics');
                    if (res.data.success) {
                        setData(res.data.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch AI insights', error);
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI Insights & Marketing</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        Khám phá tuyến xe tiềm năng và nhận gợi ý chiến dịch marketing. Đặc quyền dành riêng cho đối tác Business Premium.
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

    const getGapBadge = (gap: string) => {
        if (gap === 'high') return <span className="badge badge-success flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Cao</span>;
        if (gap === 'medium') return <span className="badge badge-warning flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Vừa</span>;
        return <span className="badge badge-error flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Thấp</span>;
    };

    return (
        <div className="card p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">AI Insights & Marketing</h2>
                    <p className="text-xs text-gray-500">Phân tích tiềm năng & Hỗ trợ tăng trưởng</p>
                </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* AI Insights Messages */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">Gợi ý từ AI</h3>
                    {data.aiInsights.map((insight: string, idx: number) => (
                        <div key={idx} className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p>{insight}</p>
                        </div>
                    ))}
                </div>

                {/* Hot Routes */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">Tuyến xe tiềm năng</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 rounded-l-lg">Tuyến</th>
                                    <th className="px-3 py-2 text-center">Tìm kiếm</th>
                                    <th className="px-3 py-2 text-center">Nhu cầu</th>
                                    <th className="px-3 py-2 rounded-r-lg">Gợi ý</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.hotRoutes.map((route: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-50 last:border-0">
                                        <td className="px-3 py-2 font-medium text-gray-900">{route.route}</td>
                                        <td className="px-3 py-2 text-center font-mono">{route.searchVolume}</td>
                                        <td className="px-3 py-2 text-center">{getGapBadge(route.supplyDemandGap)}</td>
                                        <td className="px-3 py-2 text-gray-600 text-xs">{route.suggestion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Marketing Campaigns */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">Chiến dịch Marketing</h3>
                    <div className="space-y-2">
                        {data.marketingCampaigns.map((camp: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Megaphone className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{camp.name}</p>
                                        <p className="text-xs text-gray-500">{camp.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-green-600">ROI {camp.expectedROI}</p>
                                    <p className="text-[10px] text-gray-400">Xem chi tiết</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AIInsightsSection;
