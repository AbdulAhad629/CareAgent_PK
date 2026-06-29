import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { cn } from "../lib/utils"

export default function GradientButton({
  children,
  className,
  to,
  href,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}) {
  const sizes = {
    sm: "px-4 py-2.5 text-sm",
    md: "px-6 py-3.5 text-sm",
    lg: "px-8 py-4 text-base",
  }

  const variants = {
    primary: "btn-gradient text-white font-semibold shadow-glow-sm",
    secondary:
      "border border-white/[0.12] bg-white/[0.04] text-white font-medium hover:bg-white/[0.08] hover:border-white/[0.2]",
    ghost: "text-slate-400 hover:text-white hover:bg-white/[0.06]",
  }

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-btn transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    sizes[size],
    variants[variant],
    className
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
