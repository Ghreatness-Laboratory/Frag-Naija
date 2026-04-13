import Link from "next/link";

export default function Footer() {
  return (
    <footer className="ml-12 lg:ml-14 border-t border-fn-gborder bg-fn-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-display text-base font-black text-fn-green tracking-widest">FRAG</span>
              <span className="font-display text-base font-black text-fn-text tracking-widest">NAIJA</span>
            </div>
            <p className="text-[9px] text-fn-muted tracking-wider uppercase">
              © 2024 Frag Naija. Tactical Command Interface. All Rights Reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {["Privacy Policy", "Terms of Engagement", "Support", "Sponsorship"].map((l) => (
              <Link
                key={l}
                href="#"
                className="text-[9px] text-fn-muted hover:text-fn-green tracking-widest uppercase transition-colors"
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Social */}
          <div className="flex gap-3">
            {["𝕏", "💬", "📧"].map((icon, i) => (
              <button
                key={i}
                className="w-7 h-7 border border-fn-gborder text-fn-muted hover:border-fn-green hover:text-fn-green flex items-center justify-center text-xs transition-all rounded-sm"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
