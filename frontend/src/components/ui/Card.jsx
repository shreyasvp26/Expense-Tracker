const Card = ({
    children,
    className = '',
    hover = true,
    gradient = false,
    ...props
}) => {
    const baseStyles = 'bg-white rounded-xl shadow-lg p-6 transition-all duration-300';
    const hoverStyles = hover ? 'hover:shadow-2xl hover:-translate-y-1' : '';
    const gradientStyles = gradient ? 'bg-gradient-to-br' : '';

    return (
        <div
            className={`${baseStyles} ${hoverStyles} ${gradientStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
