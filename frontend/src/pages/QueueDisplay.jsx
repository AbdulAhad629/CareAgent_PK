import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Clock, User, Stethoscope, MapPin, AlertTriangle, CheckCircle, RefreshCw, Plus } from "lucide-react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const TC = {
  1: { color: "#EF4444", light: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  label: "IMMEDIATE",   emoji: "🔴" },
  2: { color: "#F97316", light: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", label: "EMERGENCY",   emoji: "🟠" },
  3: { color: "#EAB308", light: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)",  label: "URGENT",      emoji: "🟡" },
  4: { color: "#22C55E", light: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)",  label: "SEMI-URGENT", emoji: "🟢" },
  5: { color: "#94A3B8", light: "rgba(148,163,184,0.1)",border: "rgba(148,163,184,0.3)",label: "NON-URGENT",  emoji: "⚪" },
}

function StatCard({ label, value, icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5"
      style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black" style={{ color }}>{value}</p>
    </motion.div>
  )
}

export default function QueueDisplay() {
  const [queue, setQueue]     = useState([])
  const [loading, setLoading] = useState(true)
  const [time, setTime]       = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const fetchQueue = async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch(`${API}/api/v1/patients/queue`)
      setQueue(await res.json())
    } catch(e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => {
    fetchQueue()
    const q = setInterval(fetchQueue, 15000)
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(q); clearInterval(t) }
  }, [])

  const emergency = queue.filter(p => p.triage_level <= 2)
  const normal    = queue.filter(p => p.triage_level > 2)

  return (
    <div className="min-h-screen grid-bg" style={{ background: "#0B1120" }}>

      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)", animationDelay: "2s" }} />
      </div>

      {/* NAV */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-white/5"
        style={{ background: "rgba(11,17,32,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">CareAgent PK</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Live Queue</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 rounded-xl">
            <span className="text-white font-mono font-bold text-lg">
              {time.toLocaleTimeString("en-PK")}
            </span>
          </div>
          <button onClick={() => fetchQueue(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium transition-all glass glass-hover">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <a href="/" className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
            <Plus size={14} /> New Patient
          </a>
        </div>
      </nav>

      <div className="relative z-10 px-8 py-8">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Waiting"  value={queue.length}                               icon={<User size={14}/>}         color="#7C3AED" delay={0}   />
          <StatCard label="Emergency"      value={queue.filter(p=>p.triage_level<=2).length}  icon={<AlertTriangle size={14}/>} color="#EF4444" delay={0.1} />
          <StatCard label="Urgent"         value={queue.filter(p=>p.triage_level===3).length} icon={<Clock size={14}/>}        color="#EAB308" delay={0.2} />
          <StatCard label="Non-urgent"     value={queue.filter(p=>p.triage_level>=4).length}  icon={<CheckCircle size={14}/>}  color="#22C55E" delay={0.3} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40">Loading queue...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && queue.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 rounded-3xl"
            style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.1)" }}>
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <p className="text-white text-2xl font-bold mb-2">Queue is Clear</p>
            <p className="text-white/30 text-sm">No patients currently waiting</p>
          </motion.div>
        )}

        {/* Emergency Section */}
        <AnimatePresence>
          {emergency.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <h2 className="text-red-400 font-bold text-sm uppercase tracking-widest">Emergency Cases</h2>
                <div className="px-2 py-0.5 rounded-full text-xs font-bold text-red-400"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {emergency.length}
                </div>
              </div>

              <div className="space-y-3">
                {emergency.map((p, i) => {
                  const t = TC[p.triage_level]
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl p-5 flex items-center justify-between"
                      style={{ background: `${t.color}08`, border: `1px solid ${t.color}30` }}>
                      <div className="flex items-center gap-5">
                        <div>
                          <p className="text-white/30 text-xs mb-1">TOKEN</p>
                          <p className="text-white text-2xl font-black">{p.token_number}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                          style={{ background: `${t.color}20`, border: `1px solid ${t.color}40`, color: t.color }}>
                          {t.emoji} {t.label}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{p.patient_name}</p>
                          <p className="text-white/40 text-xs">{p.required_specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white/30 text-xs mb-1">DOCTOR</p>
                          <p className="text-white font-semibold text-sm">{p.doctor_name}</p>
                        </div>
                        <div className="px-4 py-2 rounded-xl font-mono font-black text-lg"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#7C3AED" }}>
                          {p.room}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Normal Queue */}
        {normal.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <h2 className="text-white/40 font-bold text-sm uppercase tracking-widest">Regular Queue</h2>
            </div>

            <div className="rounded-3xl overflow-hidden" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Table Header */}
              <div className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-white/5">
                {["Token", "Priority", "Patient", "Specialty", "Doctor", "Room", "Wait"].map(h => (
                  <p key={h} className="text-white/25 text-xs font-semibold uppercase tracking-wider">{h}</p>
                ))}
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-white/5">
                {normal.map((p, i) => {
                  const t = TC[p.triage_level] || TC[5]
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="grid grid-cols-7 gap-4 px-6 py-4 items-center hover:bg-white/2 transition-colors group"
                    >
                      <p className="text-white font-black text-lg">{p.token_number}</p>
                      <div className="px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 w-fit"
                        style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}25` }}>
                        {t.emoji} {t.label}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(124,58,237,0.2)" }}>
                          <User size={12} className="text-purple-400" />
                        </div>
                        <p className="text-white text-sm font-medium">{p.patient_name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/50 text-sm">
                        <Stethoscope size={12} />
                        {p.required_specialty}
                      </div>
                      <p className="text-white/60 text-sm">{p.doctor_name}</p>
                      <div className="px-3 py-1 rounded-lg font-mono font-bold text-sm w-fit"
                        style={{ background: "rgba(124,58,237,0.15)", color: "#7C3AED" }}>
                        {p.room}
                      </div>
                      <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
                        <Clock size={12} />
                        ~{p.wait_time_est}m
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(11,17,32,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex gap-6">
          {Object.entries(TC).map(([l, t]) => (
            <span key={l} className="flex items-center gap-1.5 text-xs" style={{ color: t.color }}>
              {t.emoji} {t.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-white/20 text-xs">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Auto-refreshes every 15 seconds
        </div>
      </div>
    </div>
  )
}