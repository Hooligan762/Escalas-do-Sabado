export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="15" y="15" width="70" height="70" rx="8" fill="currentColor" />
      <rect x="25" y="10" width="10" height="20" rx="5" fill="hsl(var(--card))" />
      <rect x="65" y="10" width="10" height="20" rx="5" fill="hsl(var(--card))" />
      <path
        d="M30 40H70"
        stroke="hsl(var(--card))"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M30 55H70"
        stroke="hsl(var(--card))"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M30 70H50"
        stroke="hsl(var(--card))"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
