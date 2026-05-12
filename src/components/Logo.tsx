interface LogoProps {
  size?: number
  className?: string
}

/**
 * Image-based logo for Mokadmi Law Firm.
 */
export default function Logo({ size = 160, className = '' }: LogoProps) {
  return (
    <img
      src="/logo_processed.png"
      alt="Mokadmi · Law Firm"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  )
}
