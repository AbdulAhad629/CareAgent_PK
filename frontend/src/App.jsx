import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import Landing         from "./pages/Landing"
import PatientRegister from "./pages/PatientRegister"
import QueueDisplay    from "./pages/QueueDisplay"
import DoctorDashboard from "./pages/DoctorDashboard"
import Analytics       from "./pages/Analytics"

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"          element={<Landing />}         />
          <Route path="/register"  element={<PatientRegister />} />
          <Route path="/queue"     element={<QueueDisplay />}    />
          <Route path="/doctors"   element={<DoctorDashboard />} />
          <Route path="/analytics" element={<Analytics />}       />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}