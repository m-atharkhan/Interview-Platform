export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2 rounded-lg border
      border-light-border dark:border-dark-border
      bg-white dark:bg-dark-card
      text-light-text dark:text-dark-text
      placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-amu-primary
      transition ${className}`}
    />
  );
}