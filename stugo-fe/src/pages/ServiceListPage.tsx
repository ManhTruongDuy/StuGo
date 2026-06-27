import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Bus, Home, UtensilsCrossed, Grid, List, MapPin } from 'lucide-react';
import ServiceCard from '../components/ui/ServiceCard';
import SearchFilter from '../components/ui/SearchFilter';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getServices } from '../services';
import type { Service, ServiceFilter, ServiceType } from '../types';

const ServiceListPage = () => {
    const { type: pathType } = useParams<{ type?: string }>();
    const [searchParams] = useSearchParams();
    const queryType = searchParams.get('type');
    const querySearch = searchParams.get('search');

    // Priority: query param > path param
    const type = queryType || pathType;

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<ServiceFilter>({
        type: type as ServiceType | undefined,
        search: querySearch || undefined,
        sortBy: 'popularity',
    });

    useEffect(() => {
        // Update filters when URL params change
        setFilters((prev) => ({
            ...prev,
            type: type as ServiceType | undefined,
            search: querySearch || undefined,
        }));
    }, [type, querySearch]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                setError(null);

                // Prepare API filters
                const apiFilters = {
                    type: filters.type,
                    city: filters.city,
                    district: filters.district,
                    priceMin: filters.priceMin,
                    priceMax: filters.priceMax,
                    rating: filters.rating,
                    isAvailable: filters.isAvailable,
                    search: filters.search,
                    status: 'active',
                    sortBy: filters.sortBy,
                    page: 1,
                    limit: 20,
                };

                const result = await getServices(apiFilters);
                setServices(result.data || []);
            } catch (err) {
                console.error('Error fetching services:', err);
                setError('Không thể tải dữ liệu dịch vụ');
                setServices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, [filters]);

    const getPageTitle = () => {
        switch (type) {
            case 'transport':
                return 'Nhà xe';
            case 'accommodation':
                return 'Nhà trọ';
            case 'restaurant':
                return 'Quán ăn';
            default:
                return 'Tất cả dịch vụ';
        }
    };

    const getPageIcon = () => {
        switch (type) {
            case 'transport':
                return Bus;
            case 'accommodation':
                return Home;
            case 'restaurant':
                return UtensilsCrossed;
            default:
                return MapPin;
        }
    };

    const PageIcon = getPageIcon();

    return (
        <div className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <PageIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-gray-900">
                                {getPageTitle()}
                            </h1>
                            <p className="text-gray-500">
                                Tìm thấy {services.length} kết quả phù hợp
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter */}
                <SearchFilter
                    filters={filters}
                    onFilterChange={setFilters}
                    onSearch={() => { }}
                />

                {/* View Mode Toggle */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                                ? 'bg-primary-100 text-primary-600'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                                ? 'bg-primary-100 text-primary-600'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Quick filters */}
                    <div className="flex items-center gap-2">
                        {['transport', 'accommodation', 'restaurant', 'carpool'].map((t) => (
                            <button
                                key={t}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        type: prev.type === t ? undefined : (t as ServiceType),
                                    }))
                                }
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filters.type === t
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {t === 'transport'
                                    ? 'Nhà xe'
                                    : t === 'accommodation'
                                        ? 'Nhà trọ'
                                        : t === 'carpool'
                                            ? 'Xe ghép'
                                            : 'Quán ăn'}
                            </button>
                        ))}
                    </div>
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
                        <button
                            onClick={() =>
                                setFilters({ sortBy: 'popularity' })
                            }
                            className="btn-primary"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                ) : services.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPin className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Không tìm thấy kết quả
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                        <button
                            onClick={() =>
                                setFilters({ sortBy: 'popularity' })
                            }
                            className="btn-primary"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                ) : (
                    <div
                        className={
                            viewMode === 'grid'
                                ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                                : 'space-y-4'
                        }
                    >
                        {services.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                )}

                {/* Load More */}
                {services.length > 0 && (
                    <div className="text-center mt-12">
                        <button className="btn-outline">
                            Xem thêm kết quả
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceListPage;
