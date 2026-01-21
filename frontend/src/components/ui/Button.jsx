const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className = '',
    ...props
}) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-xl transform hover:-translate-y-0.5 shadow-lg',
        secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 transform hover:-translate-y-0.5',
        outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
        danger: 'bg-gradient-to-r from-danger-600 to-danger-700 text-white hover:shadow-xl transform hover:-translate-y-0.5 shadow-lg',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const disabledStyles = 'opacity-50 cursor-not-allowed hover:transform-none';

    return (
        <button
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${(disabled || loading) ? disabledStyles : ''}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && <Icon className="w-5 h-5" />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
