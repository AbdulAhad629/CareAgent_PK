export const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function fetchDoctors() {
  const res = await fetch(`${API}/api/v1/doctors/`)
  if (!res.ok) throw new Error("Failed to fetch doctors")
  return res.json()
}

export async function fetchQueue() {
  const res = await fetch(`${API}/api/v1/patients/queue`)
  if (!res.ok) throw new Error("Failed to fetch queue")
  return res.json()
}

export async function registerPatient(data) {
  const res = await fetch(`${API}/api/v1/patients/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Registration failed — please try again")
  return res.json()
}

export async function fetchDoctorDashboard(id) {
  const res = await fetch(`${API}/api/v1/doctors/${id}/dashboard`)
  if (!res.ok) throw new Error("Failed to fetch dashboard")
  return res.json()
}

export async function updateVisitStatus(visitId, status) {
  const res = await fetch(
    `${API}/api/v1/doctors/visits/${visitId}/status?status=${status}`,
    { method: "PATCH" }
  )
  if (!res.ok) throw new Error("Failed to update status")
  return res.json()
}
