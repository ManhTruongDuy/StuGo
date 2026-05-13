import { Link, useNavigate } from 'react-router-dom';
import {
    MapPin,
    Phone,
    Mail,
    Facebook,
    Instagram,
    Youtube,
} from 'lucide-react';

const Footer = () => {
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-dark-200 text-gray-300">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-display font-bold text-white">
                                StuGo
                            </span>
                        </Link>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Nền tảng kết nối sinh viên với nhà xe, nhà trọ và quán ăn. Giúp
                            bạn tìm kiếm dịch vụ phù hợp một cách nhanh chóng và tiện lợi.
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary-500 flex items-center justify-center transition-colors"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 flex items-center justify-center transition-colors"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500 flex items-center justify-center transition-colors"
                            >
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links - Services */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Dịch vụ</h3>
                        <ul className="space-y-4">
                            <li>
                                <button
                                    onClick={() => handleNavigation('/services?type=transport')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Nhà xe
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleNavigation('/services?type=accommodation')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Nhà trọ
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleNavigation('/services?type=restaurant')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Quán ăn
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleNavigation('/services')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Tất cả dịch vụ
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Links - Support */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Hỗ trợ</h3>
                        <ul className="space-y-4">
                            <li>
                                <button
                                    onClick={() => handleNavigation('/about')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Giới thiệu
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleNavigation('/faq')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Câu hỏi thường gặp
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleNavigation('/terms')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Điều khoản sử dụng
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleNavigation('/privacy')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Chính sách bảo mật
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleNavigation('/partner')}
                                    className="hover:text-primary-400 transition-colors text-left"
                                >
                                    Trở thành đối tác
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-6">Liên hệ</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                                <span>
                                    Đại học FPT, Khu công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                <a
                                    href="tel:1900xxxx"
                                    className="hover:text-primary-400 transition-colors"
                                >
                                    1900 xxxx
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                <a
                                    href="mailto:support@stugo.vn"
                                    className="hover:text-primary-400 transition-colors"
                                >
                                    support@stugo.vn
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} StuGo. Tất cả quyền được bảo lưu.
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <button
                                onClick={() => handleNavigation('/terms')}
                                className="text-gray-500 hover:text-primary-400 transition-colors"
                            >
                                Điều khoản
                            </button>
                            <button
                                onClick={() => handleNavigation('/privacy')}
                                className="text-gray-500 hover:text-primary-400 transition-colors"
                            >
                                Bảo mật
                            </button>
                            <button
                                onClick={() => handleNavigation('/contact')}
                                className="text-gray-500 hover:text-primary-400 transition-colors"
                            >
                                Liên hệ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
