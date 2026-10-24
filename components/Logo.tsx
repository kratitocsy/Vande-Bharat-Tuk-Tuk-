export function LogoMark({ light = false }: { light?: boolean }) {
  const body = light ? "#ffc53d" : "#ffc53d";
  const wheel = light ? "#ffc53d" : "#0b2f27";
  const hub = light ? "#0b0f0d" : "#ffc53d";
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className="h-[30px] w-[30px]">
      <path d="M7 24c0-5 4-8 9-8h8c5 0 9 3 9 8v4H7v-4Z" fill={body} />
      <path d="M12 16c0-4 3-7 7-7h2c4 0 7 3 7 7H12Z" fill={body} />
      <circle cx="13" cy="30" r="4" fill={wheel} />
      <circle cx="27" cy="30" r="4" fill={wheel} />
      <circle cx="13" cy="30" r="1.6" fill={hub} />
      <circle cx="27" cy="30" r="1.6" fill={hub} />
    </svg>
  );
}
