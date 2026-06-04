import React, { useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Navbar/Footer/Footer'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import './Contact.css'

const INFO = [
  { icon: Mail,   label: 'Email',    value: 'tayamab2003@gmail.com' },
  { icon: Phone,  label: 'Phone',    value: '+977-1-1234567'        },
  { icon: MapPin, label: 'Location', value: 'Kathmandu, Nepal'      },
]

export default function Contact() {
  const [form, setForm]           = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="contact-root">
      <Navbar />

      {/* ── Hero ── */}
      <section className="contact-hero">
        <h1 className="contact-hero-title">Get in Touch 🌿</h1>
        <p className="contact-hero-sub">
          Tried the site? I'd love to hear what you think — share a review, suggest improvements, or just say hello from wherever you are in the world.
        </p>
      </section>

      <div className="contact-body">
        {/* Info cards */}
        <div className="contact-info-row">
          {INFO.map(({ icon: Icon, label, value }) => (
            <div key={label} className="contact-info-card">
              <div className="contact-info-icon"><Icon size={22} /></div>
              <span className="contact-info-label">{label}</span>
              <span className="contact-info-value">{value}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="contact-form-card">
          <p className="contact-form-title">Send a Message</p>
          <p className="contact-form-sub">Have feedback, a feature idea, or spotted a bug? Fill in the form and I'll get back to you.</p>

          <form onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <label className="contact-form-label">Your Name</label>
              <input type="text" required value={form.name} onChange={handle('name')}
                placeholder="Tayama Kirati" className="contact-form-input" />
            </div>
            <div className="contact-form-row">
              <label className="contact-form-label">Email Address</label>
              <input type="email" required value={form.email} onChange={handle('email')}
                placeholder="you@example.com" className="contact-form-input" />
            </div>
            <div className="contact-form-row">
              <label className="contact-form-label">Message</label>
              <textarea required value={form.message} onChange={handle('message')} rows={6}
                placeholder="Write your message here…" className="contact-form-textarea" />
            </div>
            <button type="submit" className="contact-submit-btn">
              <Send size={17} /> Send Message
            </button>
          </form>

          {submitted && (
            <div className="contact-success">
              <CheckCircle size={18} /> Thank you! Your message has been sent.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
