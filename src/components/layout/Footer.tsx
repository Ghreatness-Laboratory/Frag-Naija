import Link from "next/link";
const socialLinks = [
  { label: "X", href: process.env.NEXT_PUBLIC_SOCIAL_X_URL, glyph: "𝕏" },
  { label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, glyph: "IG" },
  { label: "TikTok", href: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK_URL, glyph: "TT" },
  { label: "Discord", href: process.env.NEXT_PUBLIC_SOCIAL_DISCORD_URL, glyph: "DC" },
  { label: "WhatsApp", href: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP_URL, glyph: "WA" },
].filter((link) => Boolean(link.href));

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-fn-gborder bg-fn-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-display text-base font-black text-fn-green tracking-widest">FRAG</span>
              <span className="font-display text-base font-black text-fn-text tracking-widest">NAIJA</span>
            </div>
            <p className="text-[9px] text-fn-muted tracking-wider uppercase">
              © {year} FragNaija. Everything Esports. One Platform. All Rights Reserved.
            </p>
            <p className="mt-1 text-[9px] text-fn-muted tracking-wider uppercase">
              A Frag Africa product.
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
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {socialLinks.length > 0 ? (
              <div className="flex gap-3">
                {socialLinks.map(({ label, href, glyph }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`FragNaija on ${label}`}
                    className="w-7 h-7 border border-fn-gborder text-fn-muted hover:border-fn-green hover:text-fn-green flex items-center justify-center text-xs transition-all rounded-sm"
                  >
                    {glyph}
                  </a>
                ))}
              </div>
            ) : (
              <p className="max-w-[220px] text-[8px] uppercase tracking-widest text-fn-muted/70 sm:text-right">
                Social links pending official FragNaija URLs.
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
