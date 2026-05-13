import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

const LoadingSpinner = ({
    size = 'md',
    text,
    fullScreen = false,
}: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <Loader2
                className={`${sizeClasses[size]} text-primary-500 animate-spin`}
            />
            {text && <p className="text-gray-500 text-sm animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
