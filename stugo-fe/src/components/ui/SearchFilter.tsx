import { Search, MapPin, Filter, X } from 'lucide-react';
import { useState } from 'react';
import type { ServiceFilter, ServiceType } from '../../types';

interface SearchFilterProps {
    filters: ServiceFilter;
    onFilterChange: (filters: ServiceFilter) => void;
    onSearch: () => void;
}

const SearchFilter = ({ filters, onFilterChange, onSearch }: SearchFilterProps) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const serviceTypes: { value: ServiceType | ''; label: string }[] = [
        { value: '', label: 'Tất cả' },
        { value: 'transport', label: 'Nhà xe' },
        { value: 'accommodation', label: 'Nhà trọ' },
        { value: 'restaurant', label: 'Quán ăn' },
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
                        placeholder="Tìm kiếm dịch vụ..."
                        value={filters.search || ''}
                        onChange={(e) =>
                            onFilterChange({ ...filters, search: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                        className="input pl-12"
                    />
                </div>

                {/* Location Search */}
                <div className="lg:w-64 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Địa điểm (VD: Hà Nội, Đống Đa...)"
                        value={filters.city || ''}
                        onChange={(e) =>
                            onFilterChange({ ...filters, city: e.target.value || undefined })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
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
                <button onClick={onSearch} className="btn-primary">
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
                                    value={filters.priceMin || ''}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            priceMin: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    className="input w-28 py-2"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Đến"
                                    value={filters.priceMax || ''}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...filters,
                                            priceMax: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        })
                                    }
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
