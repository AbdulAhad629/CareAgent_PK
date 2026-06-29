import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Menu, Stethoscope, TrendingUp, X } from "lucide-react"
import { cn } from "../lib/utils"

const links = [
  { to: "/#features", label: "Features" },
  { to: "/#how-it-works", label: "How It Works" },
  { to: "/#agents", label: "AI Agents" },
  { to: "/#doctors", label: "Doctors" },
]

export default function Navbar({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === "/"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !transparent
          ? "glass-nav shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <nav className="section-container flex h-16 items-center justify-between lg:h-[72px]">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent shadow-glow-sm transition-transform group-hover:scale-105">
            <Stethoscope className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white lg:text-lg">
              CareAgent<span className="text-accent-cyan"> PK</span>
            </span>
            <p className="hidden text-[11px] text-slate-400 sm:block">AI Smart Hospital Platform</p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {isLanding &&
            links.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </a>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/queue"
            className="hidden items-center gap-2 rounded-btn border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-accent-purple/30 hover:bg-white/[0.08] hover:text-white sm:flex"
          >
            <Activity className="h-4 w-4 text-accent-cyan" />
            Live Queue
          </Link>
          <Link
            to="/doctors"
            className="hidden items-center gap-2 rounded-btn border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-accent-purple/30 hover:bg-white/[0.08] hover:text-white sm:flex"
          >
            <Stethoscope className="h-4 w-4 text-accent-purple" />
            Doctors
          </Link>
          <Link
            to="/analytics"
            className="hidden items-center gap-2 rounded-btn border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-accent-purple/30 hover:bg-white/[0.08] hover:text-white sm:flex"
          >
            <TrendingUp className="h-4 w-4 text-accent-cyan" />
            Analytics
          </Link>
          <Link
            to="/register"
            className="btn-gradient hidden rounded-btn px-5 py-2.5 text-sm font-semibold text-white sm:inline-flex"
          >
            Register Patient
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-nav border-t border-white/[0.06] md:hidden"
          >
            <div className="section-container flex flex-col gap-1 py-4">
              {isLanding &&
                links.map((link) => (
                  <a
                    key={link.to}
                    href={link.to}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06]"
                  >
                    {link.label}
                  </a>
                ))}
              <Link to="/queue" className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">
                Live Queue
              </Link>
              <Link to="/doctors" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">
                <Stethoscope className="h-4 w-4 text-accent-purple" />
                Doctors
              </Link>
              <Link to="/analytics" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06]">
                <TrendingUp className="h-4 w-4 text-accent-cyan" />
                Analytics
              </Link>
              <Link to="/register" className="btn-gradient mt-2 rounded-btn px-4 py-3 text-center text-sm font-semibold text-white">
                Register Patient
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}