"use client";
import { useState } from "react";
import { Mail, Send, MapPin, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const f =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-fn-gborder bg-fn-card/20 px-4 py-6 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-grid-fn bg-grid opacity-20" />
        <div className="relative">
          <div className="mb-1 fn-label flex items-center gap-1.5">
            <MessageSquare size={9} className="text-fn-green" /> OPERATOR COMMS
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-fn-text sm:text-5xl">
            CONTACT US
          </h1>
          <p className="text-fn-muted text-[11px] mt-2 max-w-md">
            Reach out to the Frag Naija command center. We respond within 24 hours.
          </p>
        </div>
      </div>

      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact info */}
          <div className="space-y-4">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-3 flex items-center gap-1.5">
                <Mail size={9} className="text-fn-green" /> DIRECT LINE
              </div>
              <a
                href="mailto:fragnaija@gmail.com"
                className="text-fn-green text-[11px] font-bold hover:underline"
              >
                fragnaija@gmail.com
              </a>
            </div>

            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-3 flex items-center gap-1.5">
                <MapPin size={9} className="text-fn-yellow" /> SECTOR
              </div>
              <p className="text-fn-muted text-[11px]">
                Nigeria Esports Federation
                <br />
                Lagos Command Center
              </p>
            </div>

            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-2">RESPONSE TIME</div>
              <p className="text-fn-text text-[11px] font-bold">Within 24 hours</p>
              <p className="text-fn-muted text-[10px] mt-1">Mon–Fri, 9:00–18:00 WAT</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6">
            <div className="fn-label mb-4 flex items-center gap-1.5">
              <Send size={9} className="text-fn-green" /> TRANSMIT MESSAGE
            </div>

            {status === "sent" ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-fn-green/20 border border-fn-green/40 flex items-center justify-center">
                  <Send size={20} className="text-fn-green" />
                </div>
                <p className="text-fn-text font-bold">Message transmitted!</p>
                <p className="text-fn-muted text-[11px]">
                  We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="fn-btn-outline text-[10px] px-4 py-2 mt-2"
                >
                  SEND ANOTHER
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="fn-label block mb-1">NAME *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={f("name")}
                      placeholder="Your name"
                      className="w-full bg-fn-dark border border-fn-gborder rounded-sm px-3 py-2.5 text-[11px] text-fn-text outline-none focus:border-fn-green/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="fn-label block mb-1">EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={f("email")}
                      placeholder="your@email.com"
                      className="w-full bg-fn-dark border border-fn-gborder rounded-sm px-3 py-2.5 text-[11px] text-fn-text outline-none focus:border-fn-green/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="fn-label block mb-1">MESSAGE *</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={f("message")}
                    placeholder="Describe your inquiry, report an issue, or ask about joining the platform..."
                    className="w-full bg-fn-dark border border-fn-gborder rounded-sm px-3 py-2.5 text-[11px] text-fn-text outline-none focus:border-fn-green/50 transition-colors resize-none"
                  />
                </div>
                {status === "error" && error && (
                  <p className="text-fn-red text-[10px] bg-fn-red/10 border border-fn-red/20 rounded-sm px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={`fn-btn flex items-center gap-2 px-5 py-2.5 text-[10px] ${
                    status === "sending" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Send size={11} />
                  {status === "sending" ? "TRANSMITTING..." : "TRANSMIT MESSAGE"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
