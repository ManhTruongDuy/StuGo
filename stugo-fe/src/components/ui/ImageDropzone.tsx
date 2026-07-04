import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageDropzoneProps {
    value: string;
    onChange: (base64: string) => void;
    label?: string;
}

const ImageDropzone = ({ value, onChange, label = 'Tải ảnh lên' }: ImageDropzoneProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }
        
        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước ảnh tối đa là 5MB');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            onChange(reader.result as string);
        };
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            
            {value ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                            title="Thay đổi ảnh"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Xóa ảnh"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }`}
                >
                    <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                        Kéo thả ảnh vào đây hoặc click để chọn
                    </p>
                    <p className="text-xs text-gray-500">
                        Hỗ trợ PNG, JPG, JPEG (Tối đa 5MB)
                    </p>
                </div>
            )}
            
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFile(e.target.files[0]);
                    }
                }}
            />
        </div>
    );
};

export default ImageDropzone;
