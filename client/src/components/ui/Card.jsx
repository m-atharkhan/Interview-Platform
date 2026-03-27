export default function Card({ children }) {
  return (
    <div
      className="
      w-full max-w-md
      bg-white dark:bg-dark-card
      border border-light-border dark:border-dark-border
      shadow-xl
      rounded-2xl
      p-8
      "
    >
      {children}
    </div>
  );
}