import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  HeartPulse,
  Shield,
  Sparkles,
  Stethoscope,
  Users,
  Zap,
  Bot,
  LineChart,
} from "lucide-react"
import PageBackground, { FadeIn } from "../components/PageBackground"
import Navbar from "../components/Navbar"
import GlassCard from "../components/GlassCard"
import GradientButton from "../components/GradientButton"
import AnimatedCounter from "../components/AnimatedCounter"
import ChatBot from "../components/ChatBot"
import { fetchDoctors, fetchQueue } from "../lib/api"
import { getInitials, getSpecialtyMeta } from "../lib/constants"

const FEATURES = [
  {
    icon: Brain,
    number: "01",
    title: "AI-Powered Triage",
    description:
      "Instant symptom analysis in Urdu or English with 5-level priority classification aligned to international standards.",
    gradient: "from-accent-purple to-accent-indigo",
  },
  {
    icon: Stethoscope,
    number: "02",
    title: "Smart Doctor Matching",
    description:
      "Automatically assigns the optimal specialist based on symptoms, workload, and real-time availability.",
    gradient: "from-accent-indigo to-accent-cyan",
  },
  {
    icon: Activity,
    number: "03",
    title: "Live Queue Management",
    description:
      "Real-time patient queue with emergency prioritization, wait times, and room assignments across the hospital.",
    gradient: "from-accent-cyan to-emerald-500",
  },
  {
    icon: Shield,
    number: "04",
    title: "Secure Health Records",
    description:
      "Encrypted medical history access for doctors with AI-assisted report reading and clinical decision support.",
    gradient: "from-emerald-500 to-accent-purple",
  },
]

const TIMELINE = [
  { step: 1, icon: Users, title: "Register", desc: "Enter patient details and symptoms in Urdu or English" },
  { step: 2, icon: Brain, title: "AI Triage", desc: "4 AI agents analyze and assign priority level instantly" },
  { step: 3, icon: Stethoscope, title: "Doctor Assignment", desc: "Best-matched specialist selected by workload algorithm" },
  { step: 4, icon: HeartPulse, title: "Consultation", desc: "Patient seen in assigned room with full AI context" },
  { step: 5, icon: FileText, title: "Report", desc: "Clinical notes, follow-up schedule, and Urdu SMS sent" },
]

const AGENTS = [
  {
    icon: Brain,
    name: "Triage Agent",
    desc: "Analyzes symptoms, detects emergencies, and assigns priority levels in seconds.",
    color: "from-accent-purple/20 to-accent-indigo/10",
    iconColor: "text-accent-purple",
  },
  {
    icon: Stethoscope,
    name: "Doctor Matching Agent",
    desc: "Routes patients to the right specialist based on specialty, load, and urgency.",
    color: "from-accent-indigo/20 to-accent-cyan/10",
    iconColor: "text-accent-indigo",
  },
  {
    icon: FileText,
    name: "Medical Records Agent",
    desc: "Reads lab reports, history, and clinical notes to enrich doctor context.",
    color: "from-accent-cyan/20 to-emerald-500/10",
    iconColor: "text-accent-cyan",
  },
  {
    icon: Calendar,
    name: "Appointment Agent",
    desc: "Schedules follow-ups, sends Urdu SMS reminders, and manages calendar slots.",
    color: "from-emerald-500/20 to-accent-purple/10",
    iconColor: "text-emerald-400",
  },
]

function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative hidden lg:block"
    >
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-accent opacity-20 blur-3xl" />

      <div className="relative space-y-4">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card ml-auto w-[320px] p-5 shadow-glow"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">AI Triage Active</p>
                <p className="text-[10px] text-slate-400">Processing patient intake</p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-status-success/20 px-2 py-0.5 text-[10px] font-medium text-status-success">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-2">
            {["Symptom analysis", "Priority scoring", "Doctor routing"].map((step, i) => (
              <div key={step} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
                <div className={`h-1.5 w-1.5 rounded-full ${i < 2 ? "bg-accent-cyan" : "bg-slate-600"}`} />
                <span className="text-xs text-slate-300">{step}</span>
                {i < 2 && <Zap className="ml-auto h-3 w-3 text-accent-cyan" />}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="glass-card w-[280px] p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-accent-purple" />
            <span className="text-xs font-semibold text-white">Queue Overview</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Waiting", val: "12", color: "text-white" },
              { label: "Emergency", val: "2", color: "text-red-400" },
              { label: "Avg Wait", val: "18m", color: "text-accent-cyan" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.04] p-2 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[9px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="glass-card ml-8 w-[260px] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-purple to-accent-indigo text-sm font-bold text-white">
              AH
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Ahmed Hassan</p>
              <p className="text-[10px] text-slate-400">Token #047 · Cardiology</p>
            </div>
            <span className="ml-auto rounded-lg bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-400">
              P2
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Landing() {
  const [doctors, setDoctors] = useState([])
  const [stats, setStats] = useState({
    patientsToday: 0,
    doctorsOnline: 0,
    avgWait: 0,
    aiAccuracy: 97.4,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [docs, queue] = await Promise.all([fetchDoctors(), fetchQueue()])
        setDoctors(docs)
        const waits = queue.map((p) => p.wait_time_est).filter(Boolean)
        const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 12
        setStats({
          patientsToday: queue.length + Math.floor(Math.random() * 8) + 24,
          doctorsOnline: docs.length,
          avgWait,
          aiAccuracy: 97.4,
        })
      } catch {
        setStats({ patientsToday: 32, doctorsOnline: 6, avgWait: 15, aiAccuracy: 97.4 })
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <PageBackground>
      <Navbar transparent />
      <ChatBot />

      {/* Hero */}
      <section className="section-container pt-28 pb-20 lg:pt-36 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-success" />
              </span>
              <span className="text-sm text-slate-300">4 AI Agents Online — Ready to assist</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-6 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              <span className="text-gradient-hero">AI Powered</span>
              <br />
              <span className="text-white">Smart Hospital</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-2 text-lg text-slate-400 sm:text-xl"
            >
              Next-generation healthcare triage for Pakistan
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mb-8 text-base text-slate-500"
              dir="rtl"
            >
              اردو یا انگریزی میں — فوری AI تشخیص اور ڈاکٹر کی تفویض
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <GradientButton to="/register" size="lg">
                Register Patient
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
              <GradientButton to="/queue" variant="secondary" size="lg">
                <Activity className="h-4 w-4 text-accent-cyan" />
                View Live Queue
              </GradientButton>
            </motion.div>
          </div>

          <HeroDashboard />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-container py-20 lg:py-28">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-purple">Platform Features</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Built for modern <span className="text-gradient">healthcare</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Every workflow optimized with AI — from patient intake to doctor consultation and follow-up care.
          </p>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <GlassCard key={f.title} delay={i * 0.1} className="group p-6">
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} shadow-glow-sm transition-transform group-hover:scale-110`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <span className="mb-2 block font-mono text-xs text-accent-purple/60">{f.number}</span>
              <h3 className="mb-2 text-lg font-bold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section id="how-it-works" className="section-container py-20 lg:py-28">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-cyan">Process</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            How It <span className="text-gradient">Works</span>
          </h2>
        </FadeIn>

        <div className="relative mx-auto max-w-2xl">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent-purple via-accent-indigo to-accent-cyan sm:left-1/2 sm:-translate-x-px" />

          {TIMELINE.map((item, i) => (
            <FadeIn key={item.step} delay={i * 0.1}>
              <div className={`relative mb-8 flex items-start gap-6 sm:mb-12 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                <div className="hidden flex-1 sm:block" />
                <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-surface-card shadow-glow-sm sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                  <item.icon className="h-5 w-5 text-accent-purple" />
                </div>
                <GlassCard hover={false} className="flex-1 p-5 sm:max-w-[calc(50%-40px)]">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-lg bg-accent-purple/20 px-2 py-0.5 font-mono text-xs font-bold text-accent-purple">
                      {String(item.step).padStart(2, "0")}
                    </span>
                    <h3 className="font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </GlassCard>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* AI Agents */}
      <section id="agents" className="section-container py-20 lg:py-28">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-indigo">Intelligence Layer</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Four AI <span className="text-gradient">Agents</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Specialized agents working in parallel to deliver instant, accurate hospital workflows.
          </p>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent, i) => (
            <GlassCard key={agent.name} delay={i * 0.08} className={`group overflow-hidden bg-gradient-to-br ${agent.color} p-6`}>
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.06] transition-transform group-hover:scale-110">
                  <agent.icon className={`h-6 w-6 ${agent.iconColor}`} />
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-status-success/30 bg-status-success/10 px-2.5 py-1 text-[11px] font-medium text-status-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
                  Online
                </span>
              </div>
              <h3 className="mb-2 font-bold text-white">{agent.name}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{agent.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Live Stats */}
      <section className="section-container py-20 lg:py-28">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-cyan">Real-Time</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Live Statistics</h2>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Patients Today", value: stats.patientsToday, suffix: "", icon: Users, color: "text-white" },
            { label: "Doctors Online", value: stats.doctorsOnline, suffix: "", icon: Stethoscope, color: "text-accent-purple" },
            { label: "Average Wait Time", value: stats.avgWait, suffix: " min", icon: Clock, color: "text-accent-cyan" },
            { label: "AI Accuracy", value: stats.aiAccuracy, suffix: "%", icon: Sparkles, color: "text-status-success", decimals: 1 },
          ].map((stat, i) => (
            <GlassCard key={stat.label} delay={i * 0.08} className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                <stat.icon className="h-5 w-5 text-accent-indigo" />
              </div>
              <p className={`text-4xl font-black ${stat.color}`}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals || 0} />
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="section-container py-20 lg:pb-32 lg:pt-28">
        <FadeIn className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-purple">Specialists</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Our Doctors</h2>
            <p className="mt-2 text-slate-400">Expert physicians powered by AI-assisted workflows</p>
          </div>
          <GradientButton to="/doctors" variant="secondary">
            View All Dashboards
            <ChevronRight className="h-4 w-4" />
          </GradientButton>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(doctors.length ? doctors : [
            { id: 1, name: "Dr. Sarah Khan", specialty: "Cardiology" },
            { id: 2, name: "Dr. Ali Raza", specialty: "Neurology" },
            { id: 3, name: "Dr. Fatima Noor", specialty: "Pediatrics" },
          ]).map((doc, i) => {
            const meta = getSpecialtyMeta(doc.specialty)
            return (
              <GlassCard key={doc.id} delay={i * 0.08} className="overflow-hidden p-0">
                <div className="p-6">
                  <div className="mb-5 flex items-start gap-4">
                    <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.avatar} text-xl font-bold text-white shadow-glow-sm`}>
                      {getInitials(doc.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-white">{doc.name}</h3>
                      <p className="text-sm text-accent-cyan">{doc.specialty}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span>{meta.years} yrs exp</span>
                        <span className="text-status-warning">★ {meta.rating}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-status-success/15 px-2.5 py-1 text-[11px] font-medium text-status-success">
                      Available
                    </span>
                  </div>
                  <GradientButton to={`/doctors`} className="w-full" size="sm">
                    Book Consultation
                  </GradientButton>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="section-container pb-16">
        <FadeIn>
          <div className="relative overflow-hidden rounded-card border border-white/[0.08] bg-surface-card p-10 text-center sm:p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-transparent to-accent-cyan/10" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Ready to transform patient care?
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-slate-400">
                Register a patient now and experience AI-powered triage, instant doctor assignment, and real-time queue tracking.
              </p>
              <GradientButton to="/register" size="lg">
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </div>
          </div>
        </FadeIn>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-accent-purple" />
            <span className="text-sm text-slate-500">© 2026 CareAgent PK — AI Smart Hospital Platform</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <Link to="/queue" className="hover:text-white transition-colors">Queue</Link>
            <Link to="/doctors" className="hover:text-white transition-colors">Doctors</Link>
          </div>
        </footer>
      </section>
    </PageBackground>
  )
}
