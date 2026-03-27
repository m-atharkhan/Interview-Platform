export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`w-full bg-amu-primary hover:bg-amu-secondary
      text-white font-medium py-2 rounded-lg transition ${className}`}
    >
      {children}
    </button>
  );
}