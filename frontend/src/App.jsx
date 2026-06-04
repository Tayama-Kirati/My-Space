import React from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import "./App.css";
import { ToastProvider } from "./components/Toast";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Login from "./pages/Login/Login";
import Journal from "./pages/Journal/Journal";
import JournalEntry from "./pages/Journal/JournalEntry";
import JournalMemories from "./pages/Journal/JournalMemories";
import Pomodoro from "./pages/Pomodoro/Pomodoro";
import Books from "./pages/Books/Books";
import Movies from "./pages/Movies/Movies";
import Memories from "./pages/Memories/Memories";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";

function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Total Posts",
              value: "24",
              color: "bg-primary-50 text-primary-700",
            },
            {
              label: "Active Users",
              value: "512",
              color: "bg-green-50 text-green-700",
            },
            {
              label: "Media Files",
              value: "138",
              color: "bg-purple-50 text-purple-700",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-6 ${color}`}>
              <p className="text-sm font-medium opacity-70">{label}</p>
              <p className="text-4xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Activity</h2>
          <p className="text-gray-500 text-sm">No recent activity yet.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login defaultTab="signup" />} />
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal/memories"
            element={
              <ProtectedRoute>
                <JournalMemories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal/:date"
            element={
              <ProtectedRoute>
                <JournalEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pomodoro"
            element={
              <ProtectedRoute>
                <Pomodoro />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <Books />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movies"
            element={
              <ProtectedRoute>
                <Movies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memories"
            element={
              <ProtectedRoute>
                <Memories />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
