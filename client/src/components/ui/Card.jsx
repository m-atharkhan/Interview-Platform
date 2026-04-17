export default function Card({ children, className = "" }) {
  return (
    <div className={`
      w-full max-w-md
      bg-light-card dark:bg-dark-card
      border border-light-border dark:border-dark-border
      rounded-2xl p-8 shadow-lg
      ${className}
    `}>
      {children}
    </div>
  );
}