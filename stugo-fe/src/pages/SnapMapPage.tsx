import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Zap, Bus, Loader2, ChevronLeft } from 'lucide-react';
import { getNearbyServices } from '../services/service.service';

// Fix default icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const COLORS = {
  restaurant: '#f97316',
  accommodation: '#8b5cf6',
  transport: '#3b82f6',
  flashDeal: '#ef4444',
  liveVehicle: '#10b981',
};

const formatPrice = (p: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const SnapMapPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ services: 0, flashDeals: 0, liveVehicles: 0 });

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([21.0285, 105.8542], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;

    const loadData = async (lat: number, lng: number) => {
      setLoading(true);
      try {
        const { services, flashDeals, liveVehicles } = await getNearbyServices({
          latitude: lat,
          longitude: lng,
          maxDistance: 5000,
        });

        setCounts({ services: services.length, flashDeals: flashDeals.length, liveVehicles: liveVehicles.length });

        // Service pins
        services.forEach((s: any) => {
          const coords = s.location?.coordinates;
          if (!coords || coords[0] === 0) return;
          const color = COLORS[s.type as keyof typeof COLORS] ?? '#6b7280';
          L.marker([coords[1], coords[0]], { icon: makeIcon(color) })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:180px;padding:4px">
                <strong style="font-size:14px">${s.name}</strong>
                <p style="margin:4px 0;font-size:12px;color:#6b7280">${s.address ?? ''}</p>
                <p style="margin:0;font-size:12px">Từ ${formatPrice(s.priceRange?.min ?? 0)}</p>
                ${s.rating ? `<p style="margin:4px 0;font-size:12px">⭐ ${s.rating.toFixed(1)}</p>` : ''}
              </div>
            `);
        });

        // Flash deal pins (red, on top)
        flashDeals.forEach((d: any) => {
          const coords = d.location?.coordinates;
          if (!coords || coords[0] === 0) return;
          L.marker([coords[1], coords[0]], { icon: makeIcon(COLORS.flashDeal), zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:180px;padding:4px">
                <span style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:11px">FLASH DEAL</span>
                <strong style="display:block;margin-top:6px;font-size:14px">${d.serviceName}</strong>
                <p style="margin:4px 0;font-size:13px;color:#ef4444;font-weight:600">${formatPrice(d.dealPrice)}</p>
                <p style="margin:0;font-size:12px;text-decoration:line-through;color:#9ca3af">${formatPrice(d.originalPrice)}</p>
                <p style="margin:4px 0;font-size:12px">Giảm ${d.discountPercent}%</p>
                <p style="margin:0;font-size:11px;color:#6b7280">Hết hạn: ${new Date(d.expiresAt).toLocaleString('vi-VN')}</p>
              </div>
            `);
        });

        // Live vehicle pins (green)
        liveVehicles.forEach((v: any) => {
          const coords = v.currentLocation?.coordinates;
          if (!coords || coords[0] === 0) return;
          L.marker([coords[1], coords[0]], { icon: makeIcon(COLORS.liveVehicle), zIndexOffset: 2000 })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:160px;padding:4px">
                <span style="background:#10b981;color:white;padding:2px 6px;border-radius:4px;font-size:11px">ĐANG CHẠY</span>
                <strong style="display:block;margin-top:6px;font-size:14px">${v.serviceName ?? 'Xe của bạn'}</strong>
                <p style="margin:4px 0;font-size:12px">Tuyến: ${v.route ?? '—'}</p>
                <p style="margin:0;font-size:12px">Giờ: ${v.timeSlot ?? '—'}</p>
              </div>
            `);
        });
      } catch {
        setError('Không thể tải dữ liệu bản đồ');
      } finally {
        setLoading(false);
      }
    };

    // Try geolocation, fallback to Hanoi center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 14);
          loadData(latitude, longitude);
        },
        () => loadData(21.0285, 105.8542)
      );
    } else {
      loadData(21.0285, 105.8542);
    }

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-white rounded-xl shadow-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Quay lại
      </button>

      {/* Legend */}
      <div className="absolute top-4 left-28 z-[1000] bg-white rounded-xl shadow-lg p-3 space-y-2 text-sm">
        <p className="font-semibold text-gray-800 mb-1">Snap Map</p>
        {[
          { color: COLORS.restaurant, label: 'Nhà hàng' },
          { color: COLORS.accommodation, label: 'Phòng trọ' },
          { color: COLORS.transport, label: 'Vận chuyển' },
          { color: COLORS.flashDeal, label: 'Flash Deal' },
          { color: COLORS.liveVehicle, label: 'Xe đang chạy' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg p-3 space-y-1 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4" /> <span>{counts.services} dịch vụ</span>
        </div>
        <div className="flex items-center gap-2 text-red-500">
          <Zap className="w-4 h-4" /> <span>{counts.flashDeals} flash deal</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <Bus className="w-4 h-4" /> <span>{counts.liveVehicles} xe đang chạy</span>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/60">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default SnapMapPage;
