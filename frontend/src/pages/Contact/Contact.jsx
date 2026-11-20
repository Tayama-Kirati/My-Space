import React, { useState } from "react";
import { Mail, MapPin, ArrowRight, Send, Check } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { PageHeader, Card, Segmented, Button, Field, Input, Textarea } from "../../components/ui";

const TOPICS = [
  { value: "feedback", label: "Feedback" },
  { value: "idea", label: "Idea" },
  { value: "bug", label: "Bug" },
  { value: "hi", label: "Just saying hi" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: "feedback", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Contact"
        title="Say hello."
        subtitle="Feedback, a feature idea, or a bug you spotted — I read every message and usually reply within a few days."
      />

      <div className="flex gap-8 flex-wrap items-start pb-4">
        <Card as="form" onSubmit={handleSubmit} className="p-8 flex flex-col gap-5" style={{ flex: "999 1 520px", minWidth: 0 }}>
          {submitted ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-moss-t text-moss-d flex items-center justify-center mx-auto mb-4">
                <Check size={26} />
              </div>
              <h2 className="font-serif text-[26px] text-ink">Message sent</h2>
              <p className="text-ink-2 mt-2">Thanks, {form.name || "friend"} — I'll reply to {form.email || "your email"} soon.</p>
              <Button variant="secondary" className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "feedback", message: "" }); }}>
                Send another
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-4 flex-wrap">
                <Field label="Name" htmlFor="cn" className="flex-1 min-w-[200px]">
                  <Input id="cn" type="text" autoComplete="name" value={form.name} onChange={handle("name")} required />
                </Field>
                <Field label="Email" htmlFor="ce" className="flex-1 min-w-[200px]">
                  <Input id="ce" type="email" autoComplete="email" value={form.email} onChange={handle("email")} required />
                </Field>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-ink-2 mb-2">What's it about?</p>
                <Segmented
                  ariaLabel="Topic"
                  options={TOPICS}
                  value={form.topic}
                  onChange={(v) => setForm((f) => ({ ...f, topic: v }))}
                />
              </div>

              <Field label="Message" htmlFor="cm">
                <Textarea id="cm" rows={7} value={form.message} onChange={handle("message")} required />
              </Field>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[13px] text-ink-3">I'll reply to the email you enter.</span>
                <Button type="submit" icon={Send}>Send message</Button>
              </div>
            </>
          )}
        </Card>

        <aside className="flex flex-col gap-3" style={{ flex: "1 1 280px" }}>
          <a href="mailto:tayamab2003@gmail.com" className="bg-surface border border-line rounded-card p-5 flex gap-3.5 items-center text-ink hover:border-moss transition-colors">
            <span className="text-moss"><Mail size={20} /></span>
            <span>
              <span className="block text-[13px] text-ink-3">Email</span>
              <span className="font-semibold">tayamab2003@gmail.com</span>
            </span>
          </a>
          <div className="bg-surface border border-line rounded-card p-5 flex gap-3.5 items-center">
            <span className="text-moss"><MapPin size={20} /></span>
            <span>
              <span className="block text-[13px] text-ink-3">Based in</span>
              <span className="font-semibold">Kathmandu, Nepal · UTC+5:45</span>
            </span>
          </div>
          <a href="https://github.com/Tayama-Kirati" className="bg-surface border border-line rounded-card p-5 flex gap-3.5 items-center text-ink hover:border-moss transition-colors">
            <span className="text-moss"><ArrowRight size={20} /></span>
            <span>
              <span className="block text-[13px] text-ink-3">Code</span>
              <span className="font-semibold">github.com/Tayama-Kirati</span>
            </span>
          </a>
        </aside>
      </div>
    </AppLayout>
  );
}
