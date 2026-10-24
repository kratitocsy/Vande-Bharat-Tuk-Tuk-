/** The Indo Tuk Tuk mark: a yellow location pin with a search handle, on a black tile. */
export function LogoMark({ className = "h-9 w-9 sm:h-10 sm:w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={`shrink-0 ${className}`}>
      <rect width="64" height="64" rx="16" fill="#111111" />
      <path d="M32 13C24.3 13 18 19.3 18 27C18 37 32 51 32 51C32 51 46 37 46 27C46 19.3 39.7 13 32 13Z" fill="#FFC928" />
      <circle cx="32" cy="27" r="6" fill="#111111" />
      <path d="M49 44L55 50" stroke="#FFC928" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
