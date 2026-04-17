export default function Button({ children, className = "", variant = "primary", size = "md", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amu-primary/40 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "w-full bg-amu-primary hover:bg-amu-secondary text-white shadow-sm hover:shadow-md",
    ghost:   "bg-transparent hover:bg-amu-primary/8 text-amu-primary border border-amu-primary/30 hover:border-amu-primary",
    danger:  "bg-red-600 hover:bg-red-700 text-white",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2.5 text-[13px]",
    lg: "px-5 py-3 text-[14px]",
  };
  return (
    <button {...props} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}