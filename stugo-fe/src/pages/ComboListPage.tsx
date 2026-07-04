import { useState, useEffect } from 'react';
import { Package, Search, MapPin } from 'lucide-react';
import ComboCard from '../components/ui/ComboCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getCombos, type Combo } from '../services/combo.service';

const ComboListPage = () => {
    const [combos, setCombos] = useState<Combo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchCombos = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await getCombos({ status: 'active', search: searchQuery });
                setCombos(result.data || []);
            } catch (err) {
                console.error('Error fetching combos:', err);
                setError('Không thể tải danh sách Combo');
                setCombos([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchCombos, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    return (
        <div className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <Package className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-gray-900">
                                Combos / Tours
                            </h1>
                            <p className="text-gray-500">
                                Khám phá các gói dịch vụ trọn gói tiết kiệm và tiện lợi
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8 relative max-w-xl">
                    <input
                        type="text"
                        placeholder="Tìm kiếm combo theo tên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 shadow-sm"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size="lg" text="Đang tải dữ liệu..." />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPin className="w-10 h-10 text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {error}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Đang hiển thị dữ liệu mẫu. Vui lòng thử lại sau.
                        </p>
                    </div>
                ) : combos.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Không tìm thấy Combo nào
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Thử thay đổi từ khóa tìm kiếm
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {combos.map((combo) => (
                            <ComboCard key={combo._id || combo.id} combo={combo} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComboListPage;
