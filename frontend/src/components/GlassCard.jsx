import { motion } from "framer-motion"
import { cn } from "../lib/utils"

export default function GlassCard({ children, className, hover = true, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "glass-card shadow-card transition-shadow duration-300",
        hover && "hover:shadow-card-hover",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function GradientCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn("gradient-border overflow-hidden", className)}
    >
      <div className="relative h-full rounded-card p-6">{children}</div>
    </motion.div>
  )
}
