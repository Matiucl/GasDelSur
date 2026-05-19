interface IconProps {
  name: string
  filled?: boolean
  className?: string
  size?: number
}

export function Icon({ name, filled = false, className = '', size }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size ?? 24}`,
        fontSize: size ? `${size}px` : undefined,
      }}
    >
      {name}
    </span>
  )
}
