export const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
    };

    return (
        <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]} ${className}`}></div>
    );
};

export const LoadingScreen = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600 text-lg">{message}</p>
        </div>
    );
};

export const SkeletonCard = () => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
    );
};

export const SkeletonTable = ({ rows = 5 }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex gap-4 mb-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                </div>
            ))}
        </div>
    );
};
