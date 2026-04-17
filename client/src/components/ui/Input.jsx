export default function Input({ className = "", label, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-[12px] font-medium text-light-muted dark:text-dark-muted mb-1.5">{label}</label>}
      <input
        {...props}
        className={`
          w-full px-4 py-2.5 rounded-lg text-[13px]
          border border-light-border dark:border-dark-border
          bg-light-bg dark:bg-dark-bg
          text-light-text dark:text-dark-text
          placeholder:text-light-muted/50 dark:placeholder:text-dark-muted/50
          focus:outline-none focus:ring-2 focus:ring-amu-primary/30 focus:border-amu-primary
          transition-all duration-200
          ${className}
        `}
      />
    </div>
  );
}