const Input = ({
    label,
    error,
    icon: Icon,
    className = '',
    containerClassName = '',
    ...props
}) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    className={`
            w-full px-4 py-3 border rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200 outline-none
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300'}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-danger-600">{error}</p>
            )}
        </div>
    );
};

export default Input;
