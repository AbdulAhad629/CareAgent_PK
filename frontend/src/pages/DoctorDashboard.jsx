import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  Stethoscope,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  MapPin,
  ChevronRight,
  Zap,
} from "lucide-react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const TC = {
  1: { color: "#EF4444", light: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   label: "IMMEDIATE",   emoji: "🔴" },
  2: { color: "#F97316", light: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.3)",  label: "EMERGENCY",   emoji: "🟠" },
  3: { color: "#EAB308", light: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.3)",   label: "URGENT",      emoji: "🟡" },
  4: { color: "#22C55E", light: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   label: "SEMI-URGENT", emoji: "🟢" },
  5: { color: "#94A3B8", light: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)", label: "NON-URGENT",  emoji: "⚪" },
}

function StatCard({ label, value, icon, color, sub, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5"
      style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black mb-1" style={{ color }}>{value}</p>
      {sub && <p className="text-white/30 text-xs">{sub}</p>}
    </motion.div>
  )
}

export default function DoctorDashboard() {
  const [doctorId,   setDoctorId]   = useState(1)
  const [dashboard,  setDashboard]  = useState(null)
  const [allDoctors, setAllDoctors] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [updating,   setUpdating]   = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/v1/doctors/`)
      .then(r => r.json())
      .then(setAllDoctors)
      .catch(console.error)
  }, [])

  const fetchDashboard = async (id, manual = false) => {
    if (manual) setRefreshing(true)
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/doctors/${id}/dashboard`)
      setDashboard(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchDashboard(doctorId) }, [doctorId])

  const updateStatus = async (visitId, status) => {
    setUpdating(visitId)
    await fetch(`${API}/api/v1/doctors/visits/${visitId}/status?status=${status}`, { method: "PATCH" })
    await fetchDashboard(doctorId)
    setUpdating(null)
  }

  const loadPct = dashboard
    ? Math.round((dashboard.current_load / dashboard.max_load) * 100)
    : 0

  return (
    <div className="min-h-screen grid-bg" style={{ background: "#0B1120" }}>

      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-1/3 w-96 h-96 rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full animate-pulse-glow"
          style={{
            background: "radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* NAV */}
      <nav
        className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-white/5"
        style={{ background: "rgba(11,17,32,0.9)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}
          >
            <Stethoscope size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">Doctor Dashboard</span>
            {dashboard && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-medium">
                  {dashboard.doctor_name} · {dashboard.specialty} · {dashboard.room}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Doctor Selector */}
          <select
            className="px-4 py-2 rounded-xl text-white text-sm font-medium focus:outline-none cursor-pointer transition-all"
            style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}
            value={doctorId}
            onChange={e => setDoctorId(Number(e.target.value))}
          >
            {allDoctors.map(d => (
              <option key={d.id} value={d.id} style={{ background: "#111827" }}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchDashboard(doctorId, true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium transition-all glass glass-hover"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}
          >
            <Plus size={14} /> New Patient
          </a>
        </div>
      </nav>

      <div className="relative z-10 px-8 py-8">

        {/* Stats */}
        {dashboard && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Patients in Queue"
              value={dashboard.current_load}
              icon={<User size={14} />}
              color="#7C3AED"
              sub={`${loadPct}% capacity`}
              delay={0}
            />
            <StatCard
              label="Slots Available"
              value={dashboard.max_load - dashboard.current_load}
              icon={<CheckCircle size={14} />}
              color="#22C55E"
              sub={`Max ${dashboard.max_load} patients`}
              delay={0.1}
            />
            <StatCard
              label="Emergency Cases"
              value={dashboard.patients.filter(p => p.triage_level <= 2).length}
              icon={<AlertTriangle size={14} />}
              color="#EF4444"
              sub="Levels 1 & 2"
              delay={0.2}
            />
            <StatCard
              label="In Progress"
              value={dashboard.patients.filter(p => p.status === "in_progress").length}
              icon={<Activity size={14} />}
              color="#06B6D4"
              sub="Currently consulting"
              delay={0.3}
            />
          </div>
        )}

        {/* Capacity Bar */}
        {dashboard && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-5 mb-8 flex items-center gap-6"
            style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex-shrink-0">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Queue Capacity</p>
              <p className="text-white font-bold">{dashboard.current_load} / {dashboard.max_load} patients</p>
            </div>
            <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${loadPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                className="h-full rounded-full"
                style={{
                  background:
                    loadPct > 80
                      ? "linear-gradient(90deg,#EF4444,#F97316)"
                      : loadPct > 50
                      ? "linear-gradient(90deg,#EAB308,#F97316)"
                      : "linear-gradient(90deg,#7C3AED,#06B6D4)",
                }}
              />
            </div>
            <span className="text-white font-bold text-lg flex-shrink-0">{loadPct}%</span>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40">Loading patients...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && dashboard?.patients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 rounded-3xl"
            style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <p className="text-white text-2xl font-bold mb-2">No Patients in Queue</p>
            <p className="text-white/30 text-sm mb-6">Your queue is clear</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}
            >
              <Plus size={14} /> Register New Patient
            </a>
          </motion.div>
        )}

        {/* Patient Cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {dashboard?.patients.map((p, i) => {
              const t = TC[p.triage_level] || TC[5]
              const isInProgress = p.status === "in_progress"

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "#111827",
                    border: `1px solid ${
                      isInProgress
                        ? "rgba(6,182,212,0.3)"
                        : p.triage_level <= 2
                        ? `${t.color}30`
                        : "rgba(255,255,255,0.06)"
                    }`,
                  }}
                >
                  {/* Top Bar */}
                  <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Priority bar */}
                      <div
                        className="w-1 h-12 rounded-full flex-shrink-0"
                        style={{ background: t.color }}
                      />

                      {/* Token + badges */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-black text-xl">
                            {p.token_number}
                          </span>

                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                            style={{
                              background: `${t.color}15`,
                              color: t.color,
                              border: `1px solid ${t.color}25`,
                            }}
                          >
                            {t.emoji} {t.label}
                          </span>

                          {isInProgress && (
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                              style={{
                                background: "rgba(6,182,212,0.15)",
                                color: "#06B6D4",
                                border: "1px solid rgba(6,182,212,0.25)",
                              }}
                            >
                              <Activity size={10} className="animate-pulse" />
                              IN PROGRESS
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-white/30" />
                            <span className="text-white font-semibold">
                              {p.patient_name}
                            </span>
                          </div>
                          {p.patient_age && (
                            <span className="text-white/30 text-sm">
                              {p.patient_age} yrs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      {p.status === "waiting" && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus(p.visit_id, "in_progress")}
                          disabled={updating === p.visit_id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
                          style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}
                        >
                          {updating === p.visit_id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Zap size={14} />
                              Start
                              <ChevronRight size={14} />
                            </>
                          )}
                        </motion.button>
                      )}

                      {isInProgress && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus(p.visit_id, "completed")}
                          disabled={updating === p.visit_id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
                          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
                        >
                          {updating === p.visit_id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Complete
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="px-6 pb-5 grid grid-cols-2 gap-3">
                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <p className="text-white/25 text-xs uppercase tracking-wider mb-1.5">
                        🤒 Symptoms
                      </p>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {p.symptoms || "—"}
                      </p>
                    </div>

                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <p className="text-white/25 text-xs uppercase tracking-wider mb-1.5">
                        🧠 AI Assessment
                      </p>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {p.triage_reason || "—"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Nav Links */}
        <div className="flex gap-3 mt-8">
          {[
            { href: "/",      icon: <Plus size={14} />,     label: "Register Patient" },
            { href: "/queue", icon: <Activity size={14} />, label: "Live Queue" },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white/50 hover:text-white text-sm font-medium transition-all glass glass-hover"
            >
              {l.icon} {l.label}
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}