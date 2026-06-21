import { Search, MapPin, Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ServiceFilter, ServiceType } from '../../types';

interface SearchFilterProps {
    filters: ServiceFilter;
    onFilterChange: (filters: ServiceFilter) => void;
    onSearch: () => void;
}

const SearchFilter = ({ filters, onFilterChange, onSearch }: SearchFilterProps) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [localCity, setLocalCity] = useState(filters.city || '');
    const [localPriceMin, setLocalPriceMin] = useState<number | ''>(filters.priceMin ?? '');
    const [localPriceMax, setLocalPriceMax] = useState<number | ''>(filters.priceMax ?? '');

    const [prevFilters, setPrevFilters] = useState(filters);

    // Sync with parent filter state during render (e.g. on clear filters or URL query change)
    if (
        filters.search !== prevFilters.search ||
        filters.city !== prevFilters.city ||
        filters.priceMin !== prevFilters.priceMin ||
        filters.priceMax !== prevFilters.priceMax
    ) {
        setPrevFilters(filters);
        setLocalSearch(filters.search || '');
        setLocalCity(filters.city || '');
        setLocalPriceMin(filters.priceMin ?? '');
        setLocalPriceMax(filters.priceMax ?? '');
    }

    // Apply filters immediately
    const handleSearch = () => {
        onFilterChange({
            ...filters,
            search: localSearch.trim() || undefined,
            city: localCity.trim() || undefined,
            priceMin: localPriceMin === '' ? undefined : localPriceMin,
            priceMax: localPriceMax === '' ? undefined : localPriceMax,
        });
        onSearch();
    };

    // Debounce typing inputs to not overload server
    useEffect(() => {
        const handler = setTimeout(() => {
            const currentSearch = localSearch.trim() || undefined;
            const currentCity = localCity.trim() || undefined;
            const currentPriceMin = localPriceMin === '' ? undefined : localPriceMin;
            const currentPriceMax = localPriceMax === '' ? undefined : localPriceMax;

            if (
                currentSearch !== filters.search ||
                currentCity !== filters.city ||
                currentPriceMin !== filters.priceMin ||
                currentPriceMax !== filters.priceMax
            ) {
                onFilterChange({
                    ...filters,
                    search: currentSearch,
                    city: currentCity,
                    priceMin: currentPriceMin,
                    priceMax: currentPriceMax,
                });
            }
        }, 600);

        return () => clearTimeout(handler);
    }, [localSearch, localCity, localPriceMin, localPriceMax, filters, onFilterChange]);

    const serviceTypes: { value: ServiceType | ''; label: string }[] = [
        { value: '', label: 'Tất cả' },
        { value: 'transport', label: 'Nhà xe' },
        { value: 'accommodation', label: 'Nhà trọ' },
        { value: 'restaurant', label: 'Quán ăn' },
        { value: 'carpool', label: 'Xe ghép' },
    ];

    const sortOptions = [
        { value: 'popularity', label: 'Phổ biến nhất' },
        { value: 'rating', label: 'Đánh giá cao' },
        { value: 'price_asc', label: 'Giá thấp → cao' },
        { value: 'price_desc', label: 'Giá cao → thấp' },
        { value: 'newest', label: 'Mới nhất' },
    ];

    const handleClearFilters = () => {
        onFilterChange({
            search: '',
            type: undefined,
            sortBy: 'popularity',
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            {/* Main Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={filters.type === 'transport' ? "Tìm nhà xe, tuyến đường, điểm đến..." : "Tìm kiếm dịch vụ..."}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="input pl-12"
                    />
                </div>

                {/* Location Search */}
                <div className="lg:w-64 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Địa điểm (VD: Hà Nội, Đống Đa...)"
                        value={localCity}
                        onChange={(e) => setLocalCity(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="input pl-12"
                    />
                </div>

                {/* Service Type */}
                <div className="lg:w-48">
                    <select
                        value={filters.type || ''}
                        onChange={(e) =>
                            onFilterChange({
                                ...filters,
                                search: localSearch.trim() || undefined,
                                city: localCity.trim() || undefined,
                                priceMin: localPriceMin === '' ? undefined : localPriceMin,
                                priceMax: localPriceMax === '' ? undefined : localPriceMax,
                                type: (e.target.value as ServiceType) || undefined,
                            })
                        }
                        className="input appearance-none cursor-pointer"
                    >
                        {serviceTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search Button */}
                <button onClick={handleSearch} className="btn-primary">
                    <Search className="w-5 h-5" />
                    Tìm kiếm
                </button>

                {/* Advanced Filter Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`btn-ghost ${showAdvanced ? 'bg-gray-100' : ''}`}
                >
                    <Filter className="w-5 h-5" />
                    Bộ lọc
                </button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="mt-6 pt-6 border-t border-gray-100 animate-slide-down">
                    <div className="flex flex-wrap items-center gap-6">
                        {/* Price Range */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700">Giá:</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Từ"
                                    value={localPriceMin}
                                    onChange={(e) =>
                                        setLocalPriceMin(e.target.value ? Number(e.target.value) : '')
                                    }
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="input w-28 py-2"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Đến"
                                    value={localPriceMax}
                                    onChange={(e) =>
                                        setLocalPriceMax(e.target.value ? Number(e.target.value) : '')
                                    }
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="input w-28 py-2"
                                />
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700">
                                Đánh giá:
                            </span>
                            <select
                                value={filters.rating || ''}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        search: localSearch.trim() || undefined,
                                        city: localCity.trim() || undefined,
                                        priceMin: localPriceMin === '' ? undefined : localPriceMin,
                                        priceMax: localPriceMax === '' ? undefined : localPriceMax,
                                        rating: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                }
                                className="input w-36 py-2 appearance-none cursor-pointer"
                            >
                                <option value="">Tất cả</option>
                                <option value="4">4+ sao</option>
                                <option value="3">3+ sao</option>
                                <option value="2">2+ sao</option>
                            </select>
                        </div>

                        {/* Availability */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.isAvailable || false}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        search: localSearch.trim() || undefined,
                                        city: localCity.trim() || undefined,
                                        priceMin: localPriceMin === '' ? undefined : localPriceMin,
                                        priceMax: localPriceMax === '' ? undefined : localPriceMax,
                                        isAvailable: e.target.checked || undefined,
                                    })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">Chỉ hiện còn chỗ</span>
                        </label>

                        {/* Sort */}
                        <div className="flex items-center gap-4 ml-auto">
                            <span className="text-sm font-medium text-gray-700">
                                Sắp xếp:
                            </span>
                            <select
                                value={filters.sortBy || 'popularity'}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        search: localSearch.trim() || undefined,
                                        city: localCity.trim() || undefined,
                                        priceMin: localPriceMin === '' ? undefined : localPriceMin,
                                        priceMax: localPriceMax === '' ? undefined : localPriceMax,
                                        sortBy: e.target.value as ServiceFilter['sortBy'],
                                    })
                                }
                                className="input w-44 py-2 appearance-none cursor-pointer"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <button
                            onClick={handleClearFilters}
                            className="btn-ghost text-red-500 hover:bg-red-50"
                        >
                            <X className="w-4 h-4" />
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchFilter;
