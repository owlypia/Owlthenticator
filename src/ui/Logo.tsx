type LogoProps = {
  size?: number;
};

export function Logo({ size = 56 }: LogoProps) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#181f29" />
      <path
        d="M18 28c0-8 6.2-14.5 14-14.5S46 20 46 28c0 10.5-8.4 18-14 22-5.6-4-14-11.5-14-22Z"
        fill="#0b0e12"
        stroke="#e4b86a"
        strokeWidth="1.6"
      />
      <circle cx="26.5" cy="29" r="5.2" fill="#f3ead8" />
      <circle cx="37.5" cy="29" r="5.2" fill="#f3ead8" />
      <circle cx="26.5" cy="29.2" r="2.2" fill="#0b0e12" />
      <circle cx="37.5" cy="29.2" r="2.2" fill="#0b0e12" />
      <path d="M32 33.5 28.8 37.2h6.4L32 33.5Z" fill="#e4b86a" />
    </svg>
  );
}
