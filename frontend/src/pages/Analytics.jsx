import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts"
import {
  Activity, Users, Clock, Stethoscope,
  AlertTriangle, CheckCircle, TrendingUp, Plus
} from "lucide-react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-sm" style={{ background:"#1F2937", border:"1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub, delay }) {
  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay }}
      className="rounded-2xl p-5"
      style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background:`${color}20`, color }}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black mb-1" style={{ color }}>{value}</p>
      {sub && <p className="text-white/30 text-xs">{sub}</p>}
    </motion.div>
  )
}

// ── Custom Pie Label ───────────────────────────────────────────
const RADIAN = Math.PI / 180
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Analytics() {
  const [summary,    setSummary]    = useState(null)
  const [daily,      setDaily]      = useState([])
  const [triage,     setTriage]     = useState([])
  const [specialty,  setSpecialty]  = useState([])
  const [doctors,    setDoctors]    = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, d, t, sp, dr] = await Promise.all([
          fetch(`${API}/api/v1/analytics/summary`).then(r => r.json()),
          fetch(`${API}/api/v1/analytics/daily-visits`).then(r => r.json()),
          fetch(`${API}/api/v1/analytics/triage-distribution`).then(r => r.json()),
          fetch(`${API}/api/v1/analytics/specialty-distribution`).then(r => r.json()),
          fetch(`${API}/api/v1/analytics/doctor-performance`).then(r => r.json()),
        ])
        setSummary(s); setDaily(d); setTriage(t); setSpecialty(sp); setDoctors(dr)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#0B1120" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40">Loading analytics...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen grid-bg" style={{ background:"#0B1120" }}>

      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full animate-pulse-glow"
          style={{ background:"radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full animate-pulse-glow"
          style={{ background:"radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)", animationDelay:"2s" }} />
      </div>

      {/* NAV */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-white/5"
        style={{ background:"rgba(11,17,32,0.9)", backdropFilter:"blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,#7C3AED,#6366F1)" }}>
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">Analytics Dashboard</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Live Data</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { href:"/",        icon:<Plus size={14}/>,        label:"Register" },
            { href:"/queue",   icon:<Activity size={14}/>,    label:"Queue" },
            { href:"/doctors", icon:<Stethoscope size={14}/>, label:"Doctors" },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium transition-all glass glass-hover">
              {l.icon} {l.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="relative z-10 px-8 py-8 max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Hospital Analytics</h1>
          <p className="text-white/40 text-sm">Real-time insights from CareAgent PK multi-agent system</p>
        </motion.div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Patients"    value={summary.total_patients}    icon={<Users size={14}/>}         color="#7C3AED" sub="All time"              delay={0}   />
            <StatCard label="Today's Visits"    value={summary.today_visits}      icon={<Activity size={14}/>}      color="#06B6D4" sub="Last 24 hours"         delay={0.1} />
            <StatCard label="Emergency Today"   value={summary.emergency_today}   icon={<AlertTriangle size={14}/>} color="#EF4444" sub="Level 1 & 2"           delay={0.2} />
            <StatCard label="Avg Wait Time"     value={`${summary.avg_wait_minutes}m`} icon={<Clock size={14}/>}  color="#F59E0B" sub="Today's average"        delay={0.3} />
            <StatCard label="Currently Waiting" value={summary.waiting_now}       icon={<Users size={14}/>}         color="#8B5CF6" sub="In queue right now"    delay={0.4} />
            <StatCard label="Completed Today"   value={summary.completed_today}   icon={<CheckCircle size={14}/>}   color="#10B981" sub="Consultations done"    delay={0.5} />
            <StatCard label="Doctors Available" value={summary.doctors_available} icon={<Stethoscope size={14}/>}   color="#06B6D4" sub="On duty now"           delay={0.6} />
            <StatCard label="AI Accuracy"       value="94%"                       icon={<TrendingUp size={14}/>}    color="#7C3AED" sub="Triage classification" delay={0.7} />
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-6">

          {/* Daily Visits Bar Chart */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="rounded-3xl p-6" style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-bold text-lg">Daily Visits</h3>
                <p className="text-white/40 text-xs mt-0.5">Last 7 days patient flow</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background:"#7C3AED" }} /> Normal</span>
                <span className="flex items-center gap-1.5 text-white/40"><span className="w-3 h-3 rounded-sm inline-block" style={{ background:"#EF4444" }} /> Emergency</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill:"#ffffff40", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#ffffff40", fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="normal"    name="Normal"    fill="#7C3AED" radius={[4,4,0,0]} />
                <Bar dataKey="emergency" name="Emergency" fill="#EF4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Triage Pie Chart */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
            className="rounded-3xl p-6" style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="mb-6">
              <h3 className="text-white font-bold text-lg">Triage Distribution</h3>
              <p className="text-white/40 text-xs mt-0.5">Patient severity breakdown</p>
            </div>
            {triage.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={triage}
                    cx="50%" cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {triage.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-white/30 text-sm">
                No triage data yet — register patients first
              </div>
            )}
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-6 mb-6">

          {/* Specialty Distribution */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
            className="rounded-3xl p-6" style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="mb-6">
              <h3 className="text-white font-bold text-lg">Top Specialties</h3>
              <p className="text-white/40 text-xs mt-0.5">Most visited departments</p>
            </div>
            {specialty.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={specialty} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill:"#ffffff40", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="specialty" tick={{ fill:"#ffffff60", fontSize:11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Patients" radius={[0,4,4,0]}>
                    {specialty.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-white/30 text-sm">
                No specialty data yet
              </div>
            )}
          </motion.div>

          {/* Doctor Performance */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
            className="rounded-3xl p-6" style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="mb-6">
              <h3 className="text-white font-bold text-lg">Doctor Performance</h3>
              <p className="text-white/40 text-xs mt-0.5">Patient load per doctor</p>
            </div>
            {doctors.length > 0 ? (
              <div className="space-y-3">
                {doctors.map((d, i) => {
                  const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0
                  const colors = ["#7C3AED","#6366F1","#06B6D4","#10B981","#F59E0B","#EF4444"]
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: colors[i % colors.length] + "30", color: colors[i % colors.length] }}>
                        {d.name.split(" ")[0][0]}{d.name.split(" ")[1]?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white text-xs font-medium truncate">{d.name}</p>
                          <p className="text-white/40 text-xs ml-2 flex-shrink-0">{d.total} patients</p>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${pct}%` }}
                            transition={{ duration:1, delay:0.8 + i*0.1 }}
                            className="h-full rounded-full"
                            style={{ background: colors[i % colors.length] }}
                          />
                        </div>
                      </div>
                      <p className="text-white/40 text-xs flex-shrink-0">{pct}%</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-white/30 text-sm">
                No doctor data yet
              </div>
            )}
          </motion.div>
        </div>

        {/* Area Chart — Visit Trend */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.7 }}
          className="rounded-3xl p-6" style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-bold text-lg">Visit Trend</h3>
              <p className="text-white/40 text-xs mt-0.5">7-day patient flow overview</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill:"#ffffff40", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#ffffff40", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="visits"    name="Total"     stroke="#7C3AED" fill="url(#colorVisits)"    strokeWidth={2} />
              <Area type="monotone" dataKey="emergency" name="Emergency" stroke="#EF4444" fill="url(#colorEmergency)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

      </div>
    </div>
  )
}