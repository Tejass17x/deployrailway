const Loader = ({
  size = 'md', // 'sm', 'md', 'lg'
  color = 'primary', // 'primary', 'white'
  fullPage = false,
  className = '',
  label = '' // New Feature: Optional text label
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    primary: 'border-primary/20 border-t-primary text-primary',
    white: 'border-white/20 border-t-white text-white'
  };

  const loaderElement = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label={label || "Loading..."}
      />
      {label && <span className={`text-sm font-medium ${colorClasses[color].split(' ').pop()}`}>{label}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/80 backdrop-blur-xs">
        {loaderElement}
      </div>
    );
  }

  return <div className="flex items-center justify-center">{loaderElement}</div>;
};

export default Loader;
