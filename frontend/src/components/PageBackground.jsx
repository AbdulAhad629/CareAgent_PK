import { motion } from "framer-motion"
import { cn } from "../lib/utils"

export default function PageBackground({ children, className }) {
  return (
    <div className={cn("relative min-h-screen bg-surface", className)}>
      <div className="noise-overlay" />
      <div className="pointer-events-none fixed inset-0 grid-pattern opacity-60" />

      <div className="glow-blob -left-32 top-0 h-[500px] w-[500px] bg-accent-purple/20 animate-pulse-glow" />
      <div className="glow-blob -right-32 top-1/3 h-[400px] w-[400px] bg-accent-indigo/15 animate-float" />
      <div className="glow-blob bottom-0 left-1/3 h-[350px] w-[350px] bg-accent-cyan/10 animate-float-delayed" />

      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function FadeIn({ children, delay = 0, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
