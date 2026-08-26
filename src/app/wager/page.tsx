"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BarChart2,
  Info,
  Bookmark,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Gift,
  Hash,
  Plus,
  Share2,
  Shield,
  Trophy,
  Trash2,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  useActiveWagers,
  useBanks,
  useFeatured,
  useMe,
  useMyWagers,
  usePlaceWager,
  usePredictors,
  useWalletTransactions,
  useWithdraw,
} from "@/lib/hooks";
import { publishWagerCount } from "@/components/layout/BottomNav";
import { MAX_WAGER_AMOUNT, MIN_STAKE_NGN } from "@/features/wagers/constants";
import { GAMES } from "@/lib/games";
import BrandedLoader from "@/components/common/BrandedLoader";

type CurrentUser = {
  id?: string | null;
  email?: string | null;
  wallet?: {
    balance?: number | string | null;
  } | null;
  date_of_birth?: string | null;
} | null;

type CurrentMarket = Record<string, unknown> & {
  id: string | number;
};

type CurrentUserWager = {
  id: string | number;
  selection?: "YES" | "NO" | string | null;
  amount?: number | string | null;
  potential?: number | string | null;
  status?: string | null;
  wager_id?: string | number | null;
  created_at?: string | null;
  odds?: number | string | null;
  wager?: {
    question?: string | null;
    subtitle?: string | null;
    closes_at?: string | null;
  } | null;
};

type WalletTransaction = {
  id: string | number;
  type?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type SignupBonusStatus = {
  amount?: number | string | null;
  eligible?: boolean | null;
  claimed?: boolean | null;
  claimed_at?: string | null;
};

type Bank = {
  name: string;
  code: string;
};

type SlipSelection = {
  key: string;
  wagerId: string | number;
  marketTitle: string;
  marketSubtitle: string;
  selection: string;
  odds: number;
  eventName?: string;
  eventDate?: string;
};

type PlacedTicket = {
  id: string;
  slipCode?: string | null;
  verificationId?: string | null;
  username: string;
  selections: SlipSelection[];
  stake: number;
  combinedOdds: number;
  potential: number;
  placedAt: string;
  status: string;
};

function getUsername(user: CurrentUser) {
  const email = user?.email ?? "";
  return email ? email.split("@")[0] : "Guest";
}

function buildTicketId(reference?: string | null) {
  return reference || `FNW-${Date.now().toString(36).toUpperCase()}`;
}

function calculateCombinedOdds(selections: SlipSelection[]) {
  return selections.reduce((total, item) => total * Number(item.odds || 1), 1);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
) {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((lineText, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "…" : "";
    ctx.fillText(`${lineText}${suffix}`, x, y + index * lineHeight);
  });
}

function drawCrosshairIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const center = size / 2;
  ctx.save();
  ctx.strokeStyle = "#00c853";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + center, y + center, center - 5, 0, Math.PI * 2);
  ctx.moveTo(x + center, y + 2);
  ctx.lineTo(x + center, y + 15);
  ctx.moveTo(x + center, y + size - 15);
  ctx.lineTo(x + center, y + size - 2);
  ctx.moveTo(x + 2, y + center);
  ctx.lineTo(x + 15, y + center);
  ctx.moveTo(x + size - 15, y + center);
  ctx.lineTo(x + size - 2, y + center);
  ctx.stroke();
  ctx.fillStyle = "#d7f7d7";
  ctx.beginPath();
  ctx.arc(x + center, y + center, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getTicketEventDetails(item: SlipSelection) {
  const eventName = item.eventName || item.marketTitle;
  const eventDate = item.eventDate ? formatShortDate(item.eventDate) : "Date TBA";
  return `${eventName} • ${eventDate}`;
}

async function downloadTicketImage(ticket: PlacedTicket, mode: "print" | "share") {
  const width = mode === "share" ? 1080 : 900;
  const selectionHeight = 190;
  const height = Math.max(mode === "share" ? 1180 : 980, 430 + ticket.selections.length * selectionHeight + 360);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pad = mode === "share" ? 70 : 56;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const accent = "#00c853";
  const muted = "#74a874";
  const text = "#d7f7d7";

  ctx.fillStyle = "#020602";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#061006";
  ctx.strokeStyle = "#123d12";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 30);
  ctx.fill();
  ctx.stroke();

  const logo = await loadTicketLogo();

  const logoY = cardY + 58;
  const logoText = "FRAGNAIJA";
  ctx.font = "900 24px monospace";
  const logoWidth = ctx.measureText(logoText).width;
  const centerX = cardX + cardW / 2;
  ctx.strokeStyle = "rgba(0, 200, 83, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 38, logoY);
  ctx.lineTo(centerX - logoWidth / 2 - 42, logoY);
  ctx.moveTo(centerX + logoWidth / 2 + 42, logoY);
  ctx.lineTo(cardX + cardW - 38, logoY);
  ctx.stroke();
  if (logo) ctx.drawImage(logo, centerX - logoWidth / 2 - 38, logoY - 15, 24, 24);
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.fillText("FRAG", centerX - 36, logoY + 8);
  ctx.fillStyle = text;
  ctx.fillText("NAIJA", centerX + 42, logoY + 8);
  ctx.textAlign = "left";

  let y = logoY + 84;
  ticket.selections.forEach((item, index) => {
    const rowTop = y - 8;
    if (index > 0) {
      ctx.strokeStyle = "rgba(116, 168, 116, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 38, rowTop - 26);
      ctx.lineTo(cardX + cardW - 38, rowTop - 26);
      ctx.stroke();
    }

    drawCrosshairIcon(ctx, cardX + 38, rowTop, 50);
    ctx.fillStyle = text;
    ctx.font = "900 30px monospace";
    drawWrappedText(ctx, item.selection || item.marketTitle, cardX + 108, y + 22, cardW - 285, 34, 2);

    ctx.textAlign = "right";
    ctx.fillStyle = accent;
    ctx.font = "900 42px monospace";
    ctx.fillText(Number(item.odds || 0).toFixed(2), cardX + cardW - 38, y + 28);
    ctx.textAlign = "left";

    ctx.fillStyle = muted;
    ctx.font = "800 20px monospace";
    drawWrappedText(ctx, item.marketSubtitle || "Wager Market", cardX + 108, y + 92, cardW - 170, 26, 1);

    ctx.fillStyle = "#a8cfa8";
    ctx.font = "700 18px monospace";
    drawWrappedText(ctx, getTicketEventDetails(item), cardX + 108, y + 128, cardW - 170, 24, 2);
    y += selectionHeight;
  });

  ctx.textAlign = "right";
  ctx.fillStyle = muted;
  ctx.font = "700 18px monospace";
  ctx.fillText(`BET: ${ticket.slipCode || ticket.id}`, cardX + cardW - 38, y + 12);

  const totalsY = y + 62;
  const labelX = cardX + 52;
  const valueX = cardX + cardW - 52;
  ctx.textAlign = "left";
  ctx.fillStyle = muted;
  ctx.font = "800 22px monospace";
  ctx.fillText("Stake", labelX, totalsY);
  ctx.fillText("Payout", labelX, totalsY + 68);
  ctx.textAlign = "right";
  ctx.fillStyle = text;
  ctx.font = "900 34px monospace";
  ctx.fillText(formatCurrency(ticket.stake), valueX, totalsY + 4);
  ctx.fillStyle = accent;
  ctx.font = "900 40px monospace";
  ctx.fillText(formatCurrency(ticket.potential), valueX, totalsY + 76);
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(116, 168, 116, 0.7)";
  ctx.font = "700 14px monospace";
  ctx.fillText(`${ticket.selections.length} pick${ticket.selections.length === 1 ? "" : "s"} • ${ticket.status} • ${new Date(ticket.placedAt).toLocaleString("en-NG")}`, cardX + 52, cardY + cardH - 42);

  if (mode === "print") {
    downloadCanvasPdf(canvas, `${ticket.slipCode || ticket.id}-ticket.pdf`);
    return;
  }

  const link = document.createElement("a");
  link.download = `${ticket.id}-${mode}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();

  if (mode === "share" && navigator.share && navigator.canShare) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) {
      const file = new File([blob], `${ticket.id}.png`, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "FragNaija Wager Slip", files: [file] });
      }
    }
  }
}

function loadTicketLogo() {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "/logo-icon.jpeg";
  });
}

function downloadCanvasPdf(canvas: HTMLCanvasElement, filename: string) {
  const jpeg = canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
  const imageBytes = Uint8Array.from(atob(jpeg), (character) => character.charCodeAt(0));
  const pageWidth = 595.28;
  const pageHeight = Number((pageWidth * canvas.height / canvas.width).toFixed(2));
  const encoder = new TextEncoder();
  const objects: Uint8Array[] = [];
  const object = (content: string | Uint8Array) => typeof content === "string" ? encoder.encode(content) : content;
  const imageObject = [
    encoder.encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`),
    imageBytes,
    encoder.encode("\nendstream\nendobj\n"),
  ];
  objects.push(object("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"));
  objects.push(object("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"));
  objects.push(object(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Ticket 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`));
  objects.push(concatPdfBytes(imageObject));
  const stream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Ticket Do\nQ\n`;
  objects.push(object(`5 0 obj\n<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream\nendobj\n`));

  const header = encoder.encode("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
  const offsets: number[] = [0];
  let offset = header.length;
  objects.forEach((entry) => { offsets.push(offset); offset += entry.length; });
  const xrefOffset = offset;
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((entry) => `${String(entry).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const blob = new Blob([header, ...objects, encoder.encode(xref)], { type: "application/pdf" });
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function concatPdfBytes(parts: Uint8Array[]) {
  const bytes = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  parts.forEach((part) => { bytes.set(part, offset); offset += part.length; });
  return bytes;
}

function WithdrawalModal({
  open,
  onClose,
  balance,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("1000");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: banks } = useBanks();
  const { withdraw, loading: withdrawLoading } = useWithdraw();

  if (!open) return null;

  async function handleWithdraw() {
    if (!amount || !accountNumber || !bankCode || !accountName) {
      setMessage("All fields are required.");
      return;
    }

    const numericAmount = Number(amount);
    if (numericAmount < 1000) {
      setMessage("Minimum withdrawal is ₦1,000.");
      return;
    }

    if (numericAmount > balance) {
      setMessage("Insufficient funds.");
      return;
    }

    setMessage(null);

    try {
      await withdraw({
        amount: numericAmount,
        account_number: accountNumber,
        bank_code: bankCode,
        name: accountName,
      });
      setIsSuccess(true);
      onSuccess();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Withdrawal failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-sm border border-fn-gborder bg-fn-card p-6 shadow-2xl">
        <h2 className="mb-4 font-display text-xl font-black uppercase tracking-tight text-fn-text">
          WITHDRAW FUNDS
        </h2>

        {isSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="rounded-sm border border-fn-green/30 bg-fn-green/10 p-4">
              <Zap size={24} className="mx-auto mb-2 text-fn-green" />
              <p className="text-sm font-bold text-fn-text uppercase tracking-widest">Withdrawal Initiated</p>
              <p className="mt-1 text-[10px] text-fn-muted">
                Your transfer of {formatCurrency(Number(amount))} is being processed.
              </p>
            </div>
            <button onClick={onClose} className="fn-btn w-full py-3">
              CLOSE
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">AMOUNT (MIN ₦1,000)</label>
              <div className="flex items-center rounded-sm border border-fn-gborder bg-fn-dark px-3">
                <span className="mr-2 text-[10px] text-fn-muted">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-[11px] font-bold text-fn-text outline-none"
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAmount(String(Math.floor(balance)))}
                className="rounded-sm border border-fn-gborder bg-fn-dark py-1.5 text-[9px] font-bold text-fn-muted hover:border-fn-green/30 hover:text-fn-text transition-all"
              >
                USE MAX
              </button>
              <button
                onClick={() => setAmount("1000")}
                className="rounded-sm border border-fn-gborder bg-fn-dark py-1.5 text-[9px] font-bold text-fn-muted hover:border-fn-green/30 hover:text-fn-text transition-all"
              >
                MINIMUM (₦1K)
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">SELECT BANK</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-[11px] font-bold text-fn-text outline-none appearance-none"
              >
                <option value="">Choose your bank...</option>
                {Array.isArray(banks) &&
                  (banks as Bank[]).map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">ACCOUNT NUMBER</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-[11px] font-bold text-fn-text outline-none"
                placeholder="10-digit number"
                maxLength={10}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">ACCOUNT NAME</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-[11px] font-bold text-fn-text outline-none"
                placeholder="Full Legal Name"
              />
            </div>

            {message && <p className="text-[10px] font-bold text-fn-red uppercase">{message}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="fn-btn-outline flex-1 py-3 text-[10px] uppercase">
                CANCEL
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !bankCode || !accountNumber || !accountName}
                className={`fn-btn flex-1 py-3 text-[10px] uppercase ${
                  withdrawLoading || !bankCode || !accountNumber || !accountName
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {withdrawLoading ? "PROCESSING..." : "CONFIRM WITHDRAW"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount || 0);
}

function formatCountdown(value?: string | null) {
  if (!value) {
    return "Closing time TBD";
  }

  const closesAt = new Date(value);
  if (Number.isNaN(closesAt.getTime())) {
    return value;
  }

  const diff = closesAt.getTime() - Date.now();
  if (diff <= 0) {
    return "Closed";
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  return `${hours}h ${minutes}m left`;
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return "Time TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTransactionAmount(amount: number) {
  const absAmount = Math.abs(amount);
  return `${amount >= 0 ? "+" : "-"}${formatCurrency(absAmount)}`;
}

/**
 * Parses and validates wager amount input.
 * Takes raw input string/number, strips invalid characters,
 * and returns a valid number for validation against min ₦100, max ₦1,000,000, and user's balance.
 */
function parseWagerAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  // Convert to string and strip non-numeric characters except decimal point
  const sanitized = String(value).replace(/[^0-9.]/g, "");
  const parsed = parseFloat(sanitized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a raw numeric value for display in the amount input field.
 * Takes the raw input value and returns a formatted display string with
 * Naira symbol and thousand separators (e.g., 100000 → ₦100,000).
 * This is for display only - the underlying numeric value is preserved for validation.
 */
function formatAmountInputValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const numericValue = parseWagerAmount(value);
  if (numericValue === 0) {
    return "";
  }
  // Format with thousand separators and Naira symbol
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
}

/**
 * Sanitizes wager amount input for display/validation.
 * Returns the sanitized string or null if input should be rejected.
 */
function sanitizeWagerAmountInput(value: string): string | null {
  // Allow empty string (user clearing the field)
  if (value === "") {
    return "";
  }
  // Strip any character that's not a digit or decimal point
  const sanitized = value.replace(/[^0-9.]/g, "");
  // Prevent multiple decimal points
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("");
  }
  return sanitized;
}

/**
 * Validates wager amount against business rules.
 * Returns an error message string if invalid, or null if valid.
 */
function getWagerAmountError(
  amount: string | number | null | undefined,
  isLoggedIn: boolean
): string | null {
  const numericAmount = parseWagerAmount(amount);
  
  if (!isLoggedIn) {
    return "You must be logged in to place a wager.";
  }
  
  if (numericAmount <= 0) {
    return "Enter a valid wager amount.";
  }
  
  if (numericAmount < MIN_STAKE_NGN) {
    return `Minimum wager amount is ${formatCurrency(MIN_STAKE_NGN)}.`;
  }
  
  if (numericAmount > MAX_WAGER_AMOUNT) {
    return `Maximum wager amount is ${formatCurrency(MAX_WAGER_AMOUNT)}.`;
  }
  
  return null;
}

function getWagerPaymentHint(amount: string | number | null | undefined, walletBalance: number): string | null {
  const numericAmount = parseWagerAmount(amount);
  if (numericAmount > 0 && numericAmount > walletBalance) {
    return "Your wallet balance will not cover this stake. You will continue to Paystack checkout.";
  }
  return null;
}

function getPoolAmount(market: Record<string, unknown>) {
  const directPool = Number(
    market.pool_size ??
      market.pool ??
      market.total_pool ??
      market.amount_pool ??
      market.pool_total ??
      market.totalPool ??
      0
  );

  if (directPool > 0) {
    return directPool;
  }

  return Number(market.yes_pool ?? 0) + Number(market.no_pool ?? 0);
}

function getTradeCount(market: Record<string, unknown>) {
  const directCount = Number(
    market.trades ??
      market.trade_count ??
      market.bet_count ??
      market.total_bets ??
      0
  );

  if (directCount > 0) {
    return directCount;
  }

  return Number(market.yes_count ?? 0) + Number(market.no_count ?? 0);
}

function getPoolSplit(market: Record<string, unknown>) {
  const yesPool = Number(market.yes_pool ?? market.yesPool ?? 0);
  const noPool = Number(market.no_pool ?? market.noPool ?? 0);
  if (yesPool > 0 || noPool > 0) return { yesPool, noPool, source: 'actual' as const };

  const total = getPoolAmount(market);
  const implied = getImpliedSplit(market.yes_odds, market.no_odds);
  return {
    yesPool: Math.round(total * (implied.yes / 100)),
    noPool: Math.max(0, total - Math.round(total * (implied.yes / 100))),
    source: 'estimated' as const,
  };
}

function getUserStakeInMarket(market: Record<string, unknown>, userWagers: CurrentUserWager[]) {
  return userWagers
    .filter((wager) => String(wager.wager_id ?? '') === String(market.id ?? ''))
    .reduce((sum, wager) => sum + Number(wager.amount ?? 0), 0);
}

function getImpliedSplit(yesOddsRaw: unknown, noOddsRaw: unknown) {
  const yesOdds = Number(yesOddsRaw);
  const noOdds = Number(noOddsRaw);

  if (yesOdds > 0 && noOdds > 0) {
    const yesProbability = 1 / yesOdds;
    const noProbability = 1 / noOdds;
    const total = yesProbability + noProbability;

    const yes = Math.round((yesProbability / total) * 100);
    return { yes, no: 100 - yes };
  }

  return { yes: 50, no: 50 };
}

function getMarketTag(market: Record<string, unknown>) {
  if (market.hot) {
    return {
      label: "HOT MARKET",
      className: "bg-fn-red/20 text-fn-red border-fn-red/30",
    };
  }

  return {
    label: "LIVE WAGER",
    className: "bg-fn-green/20 text-fn-green border-fn-gborder",
  };
}

function getMarketQuestion(market: Record<string, unknown>) {
  return (
    market.question ??
    market.title ??
    market.prompt ??
    market.name ??
    "Untitled wager market"
  );
}

function getMarketMatch(market: Record<string, unknown>) {
  return String(market.match_name ?? market.match ?? market.game_match ?? "").trim();
}

function getMarketSubtitle(market: Record<string, unknown>) {
  const subtitle =
    market.subtitle ??
    market.description ??
    market.match_name ??
    market.market_type ??
    market.category;

  if (subtitle) {
    return String(subtitle);
  }

  return `Closes ${formatCountdown(String(market.closes_at ?? ""))}`;
}

function ProbBar({ yes, no }: { yes: number; no: number }) {
  return (
    <div className="mb-1 flex h-1.5 overflow-hidden rounded-sm">
      <div className="bg-fn-green/70 transition-all" style={{ width: `${yes}%` }} />
      <div className="bg-fn-red/70 transition-all" style={{ width: `${no}%` }} />
    </div>
  );
}

type PickOption = { label: string; odds: number };

function parsePickOptions(value: unknown): PickOption[] {
  const raw = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return []; } })() : value;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((option) => ({ label: String(option?.label ?? '').trim(), odds: Number(option?.odds) }))
    .filter((option) => option.label && Number.isFinite(option.odds) && option.odds > 0);
}

const PICK_CONFIGS: Record<string, { prompt: string; badge: string; badgeStyle: string }> = {
  player_pick:  { prompt: "Pick a player to back",   badge: "PLAYER PICK", badgeStyle: "border-fn-yellow/30 bg-fn-yellow/10 text-fn-yellow"     },
  team_pick:    { prompt: "Pick a team to back",     badge: "TEAM PICK",   badgeStyle: "border-blue-400/30 bg-blue-400/10 text-blue-400"         },
  mvp_pick:     { prompt: "Pick the MVP",            badge: "MVP PICK",    badgeStyle: "border-orange-400/30 bg-orange-400/10 text-orange-400"   },
  map_pick:     { prompt: "Pick the winning map",    badge: "MAP PICK",    badgeStyle: "border-purple-400/30 bg-purple-400/10 text-purple-400"   },
  outcome_pick: { prompt: "Pick the match outcome",  badge: "OUTCOME",     badgeStyle: "border-cyan-400/30 bg-cyan-400/10 text-cyan-400"         },
  first_blood:  { prompt: "Pick first blood scorer", badge: "FIRST BLOOD", badgeStyle: "border-fn-red/30 bg-fn-red/10 text-fn-red"               },
};

function WagerCard({
  market,
  email,
  username,
  onAddToSlip,
  walletBalance,
  onPlaced,
  userWagers = [],
}: {
  market: Record<string, unknown>;
  email?: string | null;
  username: string;
  walletBalance: number;
  onAddToSlip: (selection: SlipSelection) => string | null;
  onPlaced?: (ticket?: PlacedTicket) => void;
  userWagers?: CurrentUserWager[];
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [poolOpen, setPoolOpen] = useState(false);
  const { placeWager, loading } = usePlaceWager();

  const pickOptions = parsePickOptions(market.options);
  const isOptionPick = pickOptions.length > 0;
  const pickConfig = PICK_CONFIGS[String(market.type ?? "")] ?? { prompt: "Pick an option", badge: "PICK", badgeStyle: "border-fn-green/30 bg-fn-green/10 text-fn-green" };

  const { yes, no } = getImpliedSplit(market.yes_odds, market.no_odds);
  const yesOdds = Number(market.yes_odds ?? 0);
  const noOdds = Number(market.no_odds ?? 0);
  const numericAmount = parseWagerAmount(amount);
  const activeEmail = email ?? null;
  const amountError = getWagerAmountError(amount, Boolean(activeEmail));
  const paymentHint = getWagerPaymentHint(amount, walletBalance);

  const pickedOption = isOptionPick ? pickOptions.find((o) => o.label === picked) : null;
  const pickedOdds = isOptionPick
    ? Number(pickedOption?.odds ?? 0)
    : picked === "YES"
      ? yesOdds
      : picked === "NO"
        ? noOdds
        : 0;
  const potentialReturn = isOptionPick
    ? pickedOption ? numericAmount * pickedOption.odds : 0
    : picked === "YES"
      ? numericAmount * yesOdds
      : picked === "NO"
        ? numericAmount * noOdds
        : 0;

  const tag = getMarketTag(market);
  const poolSplit = getPoolSplit(market);
  const userStake = getUserStakeInMarket(market, userWagers);
  const currentSelection: SlipSelection | null = picked && pickedOdds > 0 ? {
    key: `${String(market.id)}:${picked}`,
    wagerId: market.id as string | number,
    marketTitle: String(getMarketQuestion(market)),
    marketSubtitle: getMarketSubtitle(market),
    selection: picked,
    odds: pickedOdds,
    eventName: getMarketMatch(market) || String(getMarketQuestion(market)),
    eventDate: typeof market.closes_at === "string" ? market.closes_at : undefined,
  } : null;

  function handleAddToSlip() {
    if (!currentSelection) {
      setMessage(isOptionPick ? `Choose a ${pickConfig.badge.toLowerCase()} option first.` : "Choose YES or NO first.");
      return;
    }
    const error = onAddToSlip(currentSelection);
    setMessage(error || "Selection added to wager.");
    if (!error) setPicked(null);
  }

  function handleAmountChange(value: string) {
    const sanitized = sanitizeWagerAmountInput(value);
    if (sanitized === null) return;
    setAmount(sanitized);
  }

  async function handlePlaceWager() {
    if (!activeEmail) { window.location.href = "/login?next=/wager"; return; }
    if (!picked) { setMessage(isOptionPick ? `Choose a ${pickConfig.badge.toLowerCase()} option before placing a wager.` : "Choose YES or NO before placing a wager."); return; }
    if (amountError) { setMessage(amountError); return; }
    setMessage(null);
    try {
      const result = await placeWager({
        wager_id: market.id,
        selection: picked,
        amount: numericAmount,
        email: activeEmail,
      });
      const placedTicket: PlacedTicket = {
        id: result.slip_code || buildTicketId(result.reference),
        slipCode: result.slip_code || null,
        verificationId: result.verification_id || null,
        username,
        selections: currentSelection ? [currentSelection] : [],
        stake: numericAmount,
        combinedOdds: pickedOdds,
        potential: numericAmount * pickedOdds,
        placedAt: new Date().toISOString(),
        status: "PENDING",
      };
      if (result.paid_from_wallet) {
        setMessage("Wager placed! Stake deducted from your wallet.");
        setPicked(null);
        onPlaced?.(placedTicket);
      } else {
        onPlaced?.(placedTicket);
        window.location.href = result.authorization_url;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
    }
  }

  return (
    <div className="overflow-hidden rounded-sm border border-fn-gborder bg-fn-card transition-all hover:border-fn-green/30">
      <div className="px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-sm border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${tag.className}`}>
              {tag.label}
            </span>
            {isOptionPick && (
              <span className={`rounded-sm border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${pickConfig.badgeStyle}`}>
                {pickConfig.badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="fn-label">{formatCompactCurrency(getPoolAmount(market))} stake pool</span>
            <button type="button" onClick={() => setPoolOpen(true)} className="inline-flex items-center gap-1 rounded-sm border border-fn-green/25 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-fn-green hover:bg-fn-green/10">
              <Info size={10} /> View Pool
            </button>
            <button onClick={() => setSaved((current) => !current)} className="transition-colors">
              <Bookmark size={13} className={saved ? "fill-fn-green text-fn-green" : "text-fn-muted hover:text-fn-text"} />
            </button>
          </div>
        </div>


        {poolOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setPoolOpen(false)}>
            <div className="w-full max-w-sm rounded-sm border border-fn-green/30 bg-fn-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="fn-label text-fn-green">Stake Pool</p>
                  <h4 className="mt-1 text-sm font-black uppercase tracking-widest text-fn-text">{String(getMarketQuestion(market))}</h4>
                </div>
                <button type="button" onClick={() => setPoolOpen(false)} className="text-fn-muted hover:text-fn-text" aria-label="Close pool details"><X size={16} /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-fn-gborder pb-2"><span className="text-fn-muted">Total pool</span><strong className="text-fn-green">{formatCurrency(getPoolAmount(market))}</strong></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3"><p className="fn-label">YES / Side A</p><p className="mt-1 font-black text-fn-text">{formatCurrency(poolSplit.yesPool)}</p></div>
                  <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3"><p className="fn-label">NO / Side B</p><p className="mt-1 font-black text-fn-text">{formatCurrency(poolSplit.noPool)}</p></div>
                </div>
                <div className="flex items-center justify-between border-t border-fn-gborder pt-2"><span className="text-fn-muted">Your stake in this pool</span><strong className="text-fn-text">{formatCurrency(userStake)}</strong></div>
                {poolSplit.source === 'estimated' && <p className="text-[10px] leading-relaxed text-fn-muted">Side split is estimated from displayed odds until per-side pool columns are available from the API.</p>}
              </div>
            </div>
          </div>
        )}

        <h3 className="mb-1 text-sm font-bold leading-snug text-fn-text sm:text-base">
          {String(getMarketQuestion(market))}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {getMarketMatch(market) && (
            <span className="rounded-sm border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-fn-green">
              {getMarketMatch(market)}
            </span>
          )}
          <span className="fn-label py-1">{getMarketSubtitle(market)}</span>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-3">
        {isOptionPick ? (
          /* ── Option Pick UI (player / team / mvp / map / outcome / first_blood) ── */
          <div>
            <p className="fn-label mb-2">{pickConfig.prompt}</p>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {pickOptions.map((opt) => {
                const isSelected = picked === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setPicked((cur) => (cur === opt.label ? null : opt.label))}
                    className={`rounded-sm border px-3 py-3 text-left transition-all ${
                      isSelected
                        ? "border-fn-green bg-fn-green/10"
                        : "border-fn-gborder hover:border-fn-green/40 bg-fn-dark/60"
                    }`}
                  >
                    <div className={`text-[10px] font-bold truncate ${isSelected ? "text-fn-green" : "text-fn-text"}`}>
                      {opt.label}
                    </div>
                    <div className="font-display text-lg font-black text-fn-green mt-0.5">
                      {Number(opt.odds).toFixed(2)}×
                    </div>
                    <div className="mt-0.5 text-[8px] text-fn-muted">
                      {numericAmount > 0 ? `${formatCurrency(numericAmount)} → ${formatCurrency(numericAmount * opt.odds)}` : "Enter amount"}
                    </div>
                  </button>
                );
              })}
            </div>

            {picked && (
              <div className="mt-2 flex items-center justify-between rounded-sm border border-fn-gborder/50 bg-fn-green/5 px-2 py-1.5 text-[9px]">
                <span className="text-fn-muted">{formatCurrency(numericAmount)} stake on <strong className="text-fn-text">{picked}</strong></span>
                <span className="font-bold text-fn-green">→ {formatCurrency(potentialReturn)}</span>
              </div>
            )}
          </div>
        ) : (
          /* ── Binary YES / NO UI ── */
          <div>
            <ProbBar yes={yes} no={no} />
            <div className="mb-3 flex justify-between fn-label">
              <span className="text-fn-green">YES {yes}%</span>
              <span className="text-fn-red">NO {no}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPicked((current) => (current === "YES" ? null : "YES"))}
                className={`rounded-sm px-3 py-3 text-center transition-all ${picked === "YES" ? "pred-yes active" : "pred-yes"}`}
              >
                <div className="mb-0.5 text-[10px] font-bold">BUY YES</div>
                <div className="font-display text-xl font-black">{yesOdds.toFixed(2)}x</div>
                <div className="mt-0.5 text-[8px] opacity-80">
                  {numericAmount > 0 ? `${formatCurrency(numericAmount)} → ${formatCurrency(numericAmount * yesOdds)}` : "Enter amount"}
                </div>
              </button>
              <button
                onClick={() => setPicked((current) => (current === "NO" ? null : "NO"))}
                className={`rounded-sm px-3 py-3 text-center transition-all ${picked === "NO" ? "pred-no active" : "pred-no"}`}
              >
                <div className="mb-0.5 text-[10px] font-bold">BUY NO</div>
                <div className="font-display text-xl font-black">{noOdds.toFixed(2)}x</div>
                <div className="mt-0.5 text-[8px] opacity-80">
                  {numericAmount > 0 ? `${formatCurrency(numericAmount)} → ${formatCurrency(numericAmount * noOdds)}` : "Enter amount"}
                </div>
              </button>
            </div>

            {picked && (
              <div className={`mt-2 flex items-center justify-between rounded-sm border px-2 py-1.5 text-[9px] ${
                picked === "YES" ? "border-fn-gborder/50 bg-fn-green/5 text-fn-muted" : "border-fn-gborder/50 bg-fn-red/5 text-fn-muted"
              }`}>
                <span>{formatCurrency(numericAmount)} stake</span>
                <span className={picked === "YES" ? "font-bold text-fn-green" : "font-bold text-fn-red"}>
                  Potential return {formatCurrency(potentialReturn)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="space-y-2">
          <label className={`flex items-center rounded-sm border bg-fn-dark px-3 min-w-0 ${amountError ? "border-fn-red/60" : "border-fn-gborder"}`}>
            <span className="mr-2 fn-label shrink-0">AMOUNT</span>
            <input
              type="text"
              inputMode="decimal"
              required
              aria-invalid={Boolean(amountError)}
              placeholder="₦100"
              value={formatAmountInputValue(amount)}
              onChange={(event) => handleAmountChange(event.target.value)}
              className="flex-1 min-w-0 bg-transparent py-2.5 text-[11px] font-bold text-fn-text outline-none"
            />
          </label>
          <div className="flex items-center justify-between gap-2 text-[8px]">
            <span className={amountError ? "text-fn-red" : paymentHint ? "text-fn-yellow" : "text-fn-muted"}>{amountError || paymentHint || `Balance: ${formatCurrency(walletBalance)}`}</span>
            <span className="text-fn-muted">Min {formatCurrency(MIN_STAKE_NGN)} • Max {formatCurrency(MAX_WAGER_AMOUNT)}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddToSlip}
              className={`fn-btn-outline flex-1 whitespace-nowrap px-3 text-[10px] ${!picked || Boolean(amountError) ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!picked || Boolean(amountError)}
            >
              <Plus size={11} className="inline-block mr-1" /> SLIP
            </button>
            <button
              onClick={handlePlaceWager}
              className={`fn-btn flex-1 whitespace-nowrap px-4 text-[10px] ${loading ? "cursor-wait opacity-50" : ""}`}
              disabled={loading}
            >
              {loading ? "PLACING..." : "PLACE WAGER"}
            </button>
          </div>
        </div>

        {!activeEmail && <p className="mt-2 text-[9px] text-fn-yellow">Sign in to unlock checkout for this market.</p>}
        <p className="mt-2 text-[9px] text-fn-muted">
          By placing a wager, you agree to the{" "}
          <Link href="/wager/terms" className="font-bold text-fn-green hover:text-fn-yellow transition-colors">
            Wager Terms
          </Link>
          .
        </p>
        {message && (
          <p className={`mt-2 text-[9px] ${
            message.startsWith("Wager placed") ? "text-fn-green" : "text-fn-red"
          }`}>{message}</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-fn-gborder bg-fn-dark/50 px-4 py-2.5">
        <div className="flex items-center gap-1 text-[9px] text-fn-muted">
          <BarChart2 size={10} /> {getTradeCount(market).toLocaleString()} trades
        </div>
        <div className="flex items-center gap-1 text-[9px] text-fn-muted">
          <Clock size={10} /> {formatCountdown(String(market.closes_at ?? ""))}
        </div>
      </div>
    </div>
  );
}

function BetDetailModal({
  bet,
  onClose,
}: {
  bet: CurrentUserWager | null;
  onClose: () => void;
}) {
  if (!bet) return null;

  const selection = String(bet.selection ?? "N/A");
  const statusLabel = String(bet.status ?? "Pending");
  const statusTone =
    statusLabel === "Won"
      ? { bg: "rgb(var(--fn-green) / 0.14)", color: "rgb(var(--fn-green))", border: "rgb(var(--fn-green) / 0.28)" }
      : statusLabel === "Lost"
        ? { bg: "#ff4d4f20", color: "#ff4d4f", border: "#ff4d4f40" }
        : { bg: "rgb(var(--fn-yellow) / 0.14)", color: "rgb(var(--fn-yellow))", border: "rgb(var(--fn-yellow) / 0.28)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-sm border border-fn-gborder bg-fn-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-fn-gborder bg-fn-dark px-4 py-3">
          <span className="fn-label text-fn-text">BET DETAILS</span>
          <button onClick={onClose} className="text-fn-muted hover:text-fn-text transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="fn-label mb-1">MARKET</p>
            <p className="text-[11px] font-bold leading-snug text-fn-text">
              {bet.wager?.question || "Untitled wager market"}
            </p>
            {bet.wager?.subtitle && (
              <p className="fn-label mt-0.5">{bet.wager.subtitle}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="fn-label">STATUS</span>
            <span
              className="rounded-sm px-2 py-0.5 text-[8px] font-bold tracking-widest"
              style={{ background: statusTone.bg, color: statusTone.color, border: `1px solid ${statusTone.border}` }}
            >
              {statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "SELECTION", value: selection },
              { label: "ODDS",      value: `${Number(bet.odds ?? 0).toFixed(2)}×` },
              { label: "STAKE",     value: formatCurrency(Number(bet.amount ?? 0)) },
              { label: "POTENTIAL", value: formatCurrency(Number(bet.potential ?? 0)) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                <p className="fn-label mb-1 text-[7px]">{label}</p>
                <p className="text-[11px] font-bold text-fn-green">{value}</p>
              </div>
            ))}
          </div>

          {bet.wager?.closes_at && (
            <div className="flex items-center justify-between rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2">
              <span className="fn-label">CLOSES</span>
              <span className="text-[10px] font-bold text-fn-text">{formatShortDate(bet.wager.closes_at)}</span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2">
            <span className="fn-label">SUBMITTED</span>
            <span className="text-[10px] font-bold text-fn-text">{formatShortDate(bet.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const WAGER_TERMS_KEY = "fn-wager-terms-v1";

const WAGER_RULES = [
  "You must be 18 years of age or older to place wagers on this platform.",
  "All wagers must be placed before a fixture begins — no late entries are accepted.",
  "Match fixing or placing bets with inside knowledge is considered fraud and may result in account termination and legal action.",
  "Frag Naija wagers are skill-based predictions. This is not a lottery or casino product.",
  "Winnings are subject to a 10% platform fee deducted automatically at settlement.",
  "Frag Naija reserves the right to void any market it deems compromised or fraudulent.",
  "Wager responsibly. Set limits and only stake what you can afford to lose.",
];

function WagerTermsModal({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-fn-yellow/30 bg-fn-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-fn-gborder bg-fn-dark px-5 py-4">
          <AlertTriangle size={14} className="flex-shrink-0 text-fn-yellow animate-pulse" />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-fn-text">
            Wager Zone — Terms & Conditions
          </h2>
          <span className="ml-auto text-[8px] font-bold border border-fn-yellow/30 bg-fn-yellow/10 text-fn-yellow px-2 py-0.5 tracking-widest">
            REQUIRED
          </span>
        </div>

        {/* Rules */}
        <div className="max-h-64 overflow-y-auto px-5 py-4 space-y-3">
          {WAGER_RULES.map((rule, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border border-fn-yellow/30 bg-fn-yellow/10 text-[8px] font-black text-fn-yellow">
                {i + 1}
              </span>
              <p className="text-[11px] leading-snug text-fn-muted">{rule}</p>
            </div>
          ))}
        </div>

        {/* Checkbox */}
        <div className="px-5 pb-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setChecked(!checked)}
              className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border transition-all"
              style={checked
                ? { background: 'rgb(var(--fn-yellow))', borderColor: 'rgb(var(--fn-yellow))' }
                : { background: 'transparent', borderColor: 'rgb(var(--fn-gborder))' }}
            >
              {checked && <span className="text-[9px] font-black text-black">✓</span>}
            </div>
            <span className="text-[11px] text-fn-muted leading-snug group-hover:text-fn-text transition-colors">
              I confirm I am 18+ years old, I have read and agree to the Wager Zone Terms & Conditions, and I understand the risks involved.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex items-center gap-3">
          <Shield size={10} className="text-fn-muted flex-shrink-0" />
          <p className="text-[9px] text-fn-muted flex-1">Predict responsibly. Never wager more than you can afford to lose.</p>
        </div>

        <div className="grid gap-2 px-5 pb-5 sm:grid-cols-[1fr_1.3fr]">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-sm border border-fn-gborder px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-fn-muted transition-colors hover:border-fn-red/50 hover:text-fn-red"
          >
            Decline
          </button>
          <button
            onClick={() => { if (checked) onAccept(); }}
            disabled={!checked}
            className="w-full rounded-sm py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all"
            style={checked
              ? { background: 'rgb(var(--fn-yellow))', color: 'rgb(var(--fn-black))' }
              : { background: 'rgb(var(--fn-card2))', color: 'rgb(var(--fn-muted))', cursor: 'not-allowed' }}
          >
            {checked ? "I Accept — Enter Wager Zone" : "Check the box above to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupBonusModal({
  amount,
  claiming,
  message,
  onClaim,
  onClose,
}: {
  amount: number;
  claiming: boolean;
  message: string | null;
  onClaim: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-sm border border-fn-green/40 bg-fn-card shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-grid-fn bg-grid opacity-15" />
        <div className="relative border-b border-fn-gborder bg-fn-dark px-5 py-4">
          <button onClick={onClose} className="absolute right-4 top-4 text-fn-muted hover:text-fn-text">
            <X size={14} />
          </button>
          <div className="mb-2 flex items-center gap-2 fn-label text-fn-green">
            <Gift size={11} /> SIGNUP DROP
          </div>
          <h2 className="font-display text-2xl font-black uppercase leading-none text-fn-text">
            Claim your ₦500 signup bonus!
          </h2>
        </div>

        <div className="relative space-y-4 px-5 py-5">
          <div className="rounded-sm border border-fn-green/25 bg-fn-green/10 p-4">
            <div className="fn-label mb-1">AVAILABLE CREDIT</div>
            <div className="font-display text-4xl font-black text-fn-green">
              {formatCurrency(amount)}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-fn-muted">
              Add this starter credit to your wallet before you place your first Wager Zone pick.
            </p>
          </div>

          {message && (
            <p className="rounded-sm border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-[10px] font-bold uppercase text-fn-red">
              {message}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={onClose} className="fn-btn-outline py-3 text-[10px] uppercase">
              Later
            </button>
            <button
              onClick={onClaim}
              disabled={claiming}
              className={`fn-btn py-3 text-[10px] uppercase ${claiming ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {claiming ? "Claiming..." : "Claim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WagerPanel({
  selections,
  stake,
  setStake,
  email,
  username,
  onRemove,
  onClear,
  onSubmit,
  walletBalance,
}: {
  selections: SlipSelection[];
  stake: string;
  setStake: (value: string) => void;
  email?: string | null;
  username: string;
  walletBalance: number;
  onRemove: (key: string) => void;
  onClear: () => void;
  onSubmit: (ticket: PlacedTicket) => void;
}) {
  const { placeWager, loading: placing } = usePlaceWager();
  const [message, setMessage] = useState<string | null>(null);
  const numericStake = parseWagerAmount(stake);
  const combinedOdds = calculateCombinedOdds(selections);
  const potential = numericStake * combinedOdds;
  const stakeError = getWagerAmountError(stake, Boolean(email));
  const paymentHint = getWagerPaymentHint(stake, walletBalance);

  function handleStakeChange(value: string) {
    const sanitized = sanitizeWagerAmountInput(value);
    if (sanitized === null) return;
    setStake(sanitized);
  }

  async function submitSlip() {
    if (!email) { window.location.href = "/login?next=/wager"; return; }
    if (!selections.length) { setMessage("Add at least one selection to your wager."); return; }
    if (stakeError) { setMessage(stakeError); return; }

    const marketIds = selections.map((item) => String(item.wagerId));
    if (new Set(marketIds).size !== marketIds.length) {
      setMessage("Conflicting wager: only one selection is allowed from each market.");
      return;
    }

    setMessage(null);
    try {
      const result = await placeWager({
        selections: selections.map((item) => ({
          wager_id: item.wagerId,
          selection: item.selection,
        })),
        amount: numericStake,
        email,
      });
      onSubmit({
        id: result.slip_code || buildTicketId(result.reference),
        slipCode: result.slip_code || null,
        verificationId: result.verification_id || null,
        username,
        selections,
        stake: numericStake,
        combinedOdds,
        potential,
        placedAt: new Date().toISOString(),
        status: "PENDING",
      });
      onClear();
      if (!result.paid_from_wallet && result.authorization_url) {
        window.location.href = result.authorization_url;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to place wager.");
    }
  }

  return (
    <div className="sticky top-20 rounded-sm border border-fn-gborder bg-fn-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="fn-label text-fn-text">WAGER</span>
        <span className="rounded-sm border border-fn-green/30 bg-fn-green/10 px-2 py-0.5 text-[8px] font-bold text-fn-green">
          {selections.length} PICK{selections.length === 1 ? "" : "S"}
        </span>
      </div>

      {selections.length === 0 ? (
        <div className="rounded-sm border border-dashed border-fn-gborder bg-fn-dark p-4 text-center text-[10px] text-fn-muted">
          Add picks from live markets to build an optional accumulator. Single-pick wagers work too.
        </div>
      ) : (
        <div className="space-y-2">
          {selections.map((item) => (
            <div key={item.key} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-fn-text">{item.marketTitle}</p>
                  <p className="fn-label mt-0.5 truncate">{item.marketSubtitle}</p>
                  <p className="mt-2 text-[10px] font-bold text-fn-green">
                    {item.selection} @ {item.odds.toFixed(2)}×
                  </p>
                </div>
                <button onClick={() => onRemove(item.key)} className="text-fn-muted hover:text-fn-red">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-3">
        <label className={`flex items-center rounded-sm border bg-fn-dark px-3 ${stakeError ? "border-fn-red/60" : "border-fn-gborder"}`}>
          <span className="mr-2 fn-label shrink-0">TOTAL STAKE</span>
          <input
            type="text"
            inputMode="decimal"
            required
            aria-invalid={Boolean(stakeError)}
            placeholder="₦100"
            value={formatAmountInputValue(stake)}
            onChange={(event) => handleStakeChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-[11px] font-bold text-fn-text outline-none"
          />
        </label>
        <div className="flex items-center justify-between gap-2 text-[8px]">
          <span className={stakeError ? "text-fn-red" : paymentHint ? "text-fn-yellow" : "text-fn-muted"}>{stakeError || paymentHint || `Balance: ${formatCurrency(walletBalance)}`}</span>
          <span className="text-fn-muted">Min {formatCurrency(MIN_STAKE_NGN)} • Max {formatCurrency(MAX_WAGER_AMOUNT)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
            <p className="fn-label mb-1">COMBINED ODDS</p>
            <p className="font-display text-xl font-black text-fn-green">{combinedOdds.toFixed(2)}×</p>
          </div>
          <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
            <p className="fn-label mb-1">PAYOUT</p>
            <p className="font-display text-xl font-black text-fn-yellow">{formatCompactCurrency(potential)}</p>
          </div>
        </div>
        <button
          onClick={submitSlip}
          disabled={placing}
          className={`fn-btn w-full py-3 text-[10px] ${placing ? "cursor-wait opacity-50" : ""}`}
        >
          {placing ? "PLACING..." : selections.length > 1 ? "PLACE ACCUMULATOR" : "PLACE SLIP"}
        </button>
        {!email && <p className="text-[9px] text-fn-yellow">Sign in to place your slip.</p>}
        {message && <p className="text-[9px] text-fn-red">{message}</p>}
      </div>
    </div>
  );
}

function TicketActions({ ticket, onClose }: { ticket: PlacedTicket | null; onClose: () => void }) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-sm border border-fn-green/40 bg-fn-card p-5 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-fn-muted hover:text-fn-text">
          <X size={15} />
        </button>
        <div className="mb-4 flex items-center gap-3 border-b border-fn-gborder pb-4">
          <Image src="/logo-icon.jpeg" alt="FragNaija" width={40} height={40} className="h-10 w-10 rounded-sm border border-fn-green/40 object-cover" />
          <div><p className="font-display text-lg font-black uppercase tracking-widest text-fn-green">Frag<span className="text-fn-text">Naija</span></p><p className="fn-label mt-1">Official wager ticket</p></div>
          <CheckCircle size={24} className="ml-auto text-fn-green" />
        </div>
        <h2 className="font-display text-xl font-black uppercase text-fn-text">Wager Placed</h2>
        <p className="mt-1 text-[10px] leading-relaxed text-fn-muted">
          Confirmation is complete. Generate a ticket only if you want a printable or shareable slip.
        </p>

        <div className="my-4 rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px]">
          <div className="flex justify-between"><span className="fn-label flex items-center gap-1"><Hash size={11}/> BET SLIP CODE</span><span className="font-bold text-fn-green">{ticket.slipCode || ticket.id}</span></div>
          <div className="mt-2 flex justify-between"><span className="fn-label flex items-center gap-1"><Trophy size={11}/> PICKS</span><span>{ticket.selections.length}</span></div>
          <div className="mt-2 flex justify-between"><span className="fn-label flex items-center gap-1"><Wallet size={11}/> STAKE</span><span>{formatCurrency(ticket.stake)}</span></div>
          <div className="mt-2 flex justify-between"><span className="fn-label flex items-center gap-1"><Trophy size={11}/> POTENTIAL PAYOUT</span><span className="font-bold text-fn-green">{formatCurrency(ticket.potential)}</span></div>
          <div className="mt-2 flex justify-between"><span className="fn-label flex items-center gap-1"><Clock size={11}/> STATUS</span><span>{ticket.status}</span></div>
          <div className="mt-2 flex justify-between"><span className="fn-label flex items-center gap-1"><CalendarDays size={11}/> PLACED</span><span>{new Date(ticket.placedAt).toLocaleString("en-NG")}</span></div>
        </div>

        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
          <button onClick={() => downloadTicketImage(ticket, "print")} className="fn-btn-outline py-3 text-[10px]">
            <Download size={12} className="mr-1 inline-block" /> DOWNLOAD PDF
          </button>
          <button onClick={() => downloadTicketImage(ticket, "share")} className="fn-btn py-3 text-[10px]">
            <Share2 size={12} className="mr-1 inline-block" /> SHARE SLIP
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1 text-[8px] text-fn-muted">
          <Download size={10} /> Download PDF preserves the branded ticket design; Share exports a PNG.
        </p>
      </div>
    </div>
  );
}

function WagerPageContent() {
  const [showAll, setShowAll] = useState(false);
  const [selectedGameSlug, setSelectedGameSlug] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState("all");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [slipSelections, setSlipSelections] = useState<SlipSelection[]>([]);
  const [slipStake, setSlipStake] = useState("");
  const [latestTicket, setLatestTicket] = useState<PlacedTicket | null>(null);
  const [signupBonus, setSignupBonus] = useState<SignupBonusStatus | null>(null);
  const [signupBonusLoading, setSignupBonusLoading] = useState(false);
  const [signupBonusClaiming, setSignupBonusClaiming] = useState(false);
  const [signupBonusDismissed, setSignupBonusDismissed] = useState(false);
  const [signupBonusMessage, setSignupBonusMessage] = useState<string | null>(null);
  const [signupBonusToast, setSignupBonusToast] = useState<string | null>(null);


  const [selectedBet, setSelectedBet] = useState<CurrentUserWager | null>(null);
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const { data: wagers, loading: wagersLoading, error: wagersError, refetch } = useActiveWagers();
  const { data: me, loading: meLoading, refetch: refetchMe } = useMe();
  const {
    data: myWagers,
    loading: myWagersLoading,
    error: myWagersError,
    refetch: refetchMyWagers,
  } = useMyWagers();
  const {
    data: walletTransactions,
    loading: walletTxLoading,
    error: walletTxError,
    refetch: refetchWalletTx,
  } = useWalletTransactions(8);
  const { data: predictorsData } = usePredictors();
  const { data: featuredData } = useFeatured();
  const currentUser = me as CurrentUser;
  const termsStorageKey = `${WAGER_TERMS_KEY}:${currentUser?.email || "guest"}`;
  const liveWagers = useMemo(() => (Array.isArray(wagers) ? wagers : []) as CurrentMarket[], [wagers]);
  const currentUserWagers = (Array.isArray(myWagers) ? myWagers : []) as CurrentUserWager[];
  const walletTxList = (Array.isArray(walletTransactions) ? walletTransactions : []) as WalletTransaction[];
  const predictors = Array.isArray(predictorsData) ? predictorsData : [];
  const featured = Array.isArray(featuredData) ? featuredData : [];

  const gameFilteredMarkets = useMemo(() => selectedGameSlug === "all"
    ? liveWagers
    : liveWagers.filter((market) => String(market.game_slug ?? "") === selectedGameSlug), [liveWagers, selectedGameSlug]);
  const availableGameFilters = useMemo(() => {
    const slugs = new Set(liveWagers.map((market) => String(market.game_slug ?? "")).filter(Boolean));
    return GAMES.filter((game) => slugs.has(game.slug));
  }, [liveWagers]);
  const matchOptions = useMemo(() => Array.from(new Set(gameFilteredMarkets.map(getMarketMatch).filter(Boolean))).sort(), [gameFilteredMarkets]);
  const allMarkets = selectedMatch === "all" ? gameFilteredMarkets : gameFilteredMarkets.filter((market) => getMarketMatch(market) === selectedMatch);
  const displayedMarkets = showAll ? allMarkets : allMarkets.slice(0, 4);
  const walletBalance = Number(currentUser?.wallet?.balance ?? 0);
  const username = getUsername(currentUser);
  useEffect(() => {
    if (meLoading) return;
    const acceptedLegacyTerms = localStorage.getItem(WAGER_TERMS_KEY) === "1";
    const acceptedUserTerms = localStorage.getItem(termsStorageKey) === "1";
    setTermsAccepted(acceptedLegacyTerms || acceptedUserTerms);
    setTermsChecked(true);
  }, [meLoading, termsStorageKey]);

  function acceptTerms() {
    localStorage.setItem(termsStorageKey, "1");
    localStorage.removeItem(WAGER_TERMS_KEY);
    setTermsAccepted(true);
  }

  function declineTerms() {
    setTermsAccepted(false);
    setTermsChecked(true);
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  const showTermsModal = termsChecked && !termsAccepted;
  const showSignupBonusPrompt = Boolean(
    termsAccepted &&
      currentUser?.email &&
      signupBonus?.eligible &&
      !signupBonus?.claimed &&
      !signupBonusDismissed &&
      !signupBonusLoading
  );

  useEffect(() => {
    let active = true;

    if (meLoading) {
      return () => {
        active = false;
      };
    }

    if (!currentUser?.email) {
      setSignupBonus(null);
      setSignupBonusDismissed(false);
      setSignupBonusMessage(null);
      return () => {
        active = false;
      };
    }

    async function loadSignupBonus() {
      setSignupBonusLoading(true);
      setSignupBonusMessage(null);

      try {
        const res = await fetch("/api/wallet/signup-bonus");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Unable to load signup bonus.");
        if (active) {
          setSignupBonus(data);
          setSignupBonusDismissed(false);
        }
      } catch {
        if (active) setSignupBonus(null);
      } finally {
        if (active) setSignupBonusLoading(false);
      }
    }

    loadSignupBonus();

    return () => {
      active = false;
    };
  }, [currentUser?.email, meLoading]);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    let active = true;
    fetch(`/api/wager/slip?code=${encodeURIComponent(code)}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active || !ok || !data.redeemable) return;
        const redeemed = (data.selections || []).map((item: { wager_id: string | number; selection: string; live_odds: number; market?: { question?: string; subtitle?: string; match_name?: string; closes_at?: string } }) => ({
          key: `${String(item.wager_id)}:${item.selection}`,
          wagerId: item.wager_id,
          marketTitle: String(item.market?.question || 'Wager market'),
          marketSubtitle: String(item.market?.subtitle || item.market?.match_name || 'Wager Zone'),
          selection: String(item.selection),
          odds: Number(item.live_odds || 1),
          eventName: item.market?.match_name || item.market?.question,
          eventDate: item.market?.closes_at,
        }));
        setSlipSelections(redeemed);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [searchParams]);

  useEffect(() => {
    publishWagerCount(slipSelections.length);

    return () => publishWagerCount(0);
  }, [slipSelections.length]);

  function addToSlip(selection: SlipSelection) {
    if (slipSelections.some((item) => item.key === selection.key)) {
      return "Duplicate selection: this pick is already in your slip.";
    }

    if (slipSelections.some((item) => String(item.wagerId) === String(selection.wagerId))) {
      return "Conflicting selection: remove the existing pick for this market first.";
    }

    setSlipSelections((current) => [...current, selection]);
    return null;
  }

  function removeFromSlip(key: string) {
    setSlipSelections((current) => current.filter((item) => item.key !== key));
  }

  function refreshAfterPlacement(ticket?: PlacedTicket) {
    if (ticket) setLatestTicket(ticket);
    refetch();
    refetchMyWagers();
    refetchWalletTx();
    refetchMe();
  }

  async function handleClaimSignupBonus() {
    setSignupBonusClaiming(true);
    setSignupBonusMessage(null);

    try {
      const res = await fetch("/api/wallet/signup-bonus", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to claim signup bonus.");

      const creditedAmount = Number(data.creditedAmount ?? 0);
      setSignupBonus((current) => ({
        amount: data.amount ?? current?.amount ?? 500,
        eligible: false,
        claimed: true,
        claimed_at: data.claimed_at ?? current?.claimed_at ?? null,
      }));
      setSignupBonusDismissed(true);
      setSignupBonusToast(
        creditedAmount > 0
          ? `${formatCurrency(creditedAmount)} signup bonus added to your wallet.`
          : "Signup bonus already claimed."
      );
      refetchMe();
      refetchWalletTx();
    } catch (error) {
      setSignupBonusMessage(error instanceof Error ? error.message : "Unable to claim signup bonus.");
    } finally {
      setSignupBonusClaiming(false);
    }
  }

  return (
    <div className="min-h-screen">
      {showTermsModal && <WagerTermsModal onAccept={acceptTerms} onDecline={declineTerms} />}
      {showSignupBonusPrompt && (
        <SignupBonusModal
          amount={Number(signupBonus?.amount ?? 500)}
          claiming={signupBonusClaiming}
          message={signupBonusMessage}
          onClaim={handleClaimSignupBonus}
          onClose={() => setSignupBonusDismissed(true)}
        />
      )}
      <div className="relative overflow-hidden border-b border-fn-gborder bg-fn-card/20 px-4 py-6 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-grid-fn bg-grid opacity-20" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 fn-label">
              <Zap size={9} className="text-fn-green" /> TACTICAL HUB 06
            </div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-fn-text xs:text-4xl sm:text-5xl">
              WAGER ZONE
            </h1>
          </div>

          <div className="flex flex-col gap-3 xs:flex-row xs:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-sm border border-fn-yellow/30 bg-fn-card px-4 py-3 min-w-[180px]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-fn-yellow/40 bg-fn-yellow/20 text-sm">
                <Wallet size={14} className="text-fn-yellow" />
              </div>
              <div className="min-w-0">
                <div className="fn-label truncate">CURRENT BALANCE</div>
                <div className="font-display text-lg font-black text-fn-yellow sm:text-xl truncate">
                  {meLoading ? "..." : formatCurrency(walletBalance)}
                </div>
              </div>
            </div>
            
            {currentUser?.email && (
              <div className="grid grid-cols-2 gap-2 xs:h-full">
                <Link
                  href="/wallet?tab=deposit"
                  className="fn-btn px-6 py-3.5 text-center text-[10px] font-black uppercase tracking-widest xs:h-full"
                >
                  DEPOSIT
                </Link>
                <button
                  onClick={() => setIsWithdrawOpen(true)}
                  className="fn-btn-outline px-6 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-fn-yellow/10 hover:border-fn-yellow/50 xs:h-full"
                >
                  WITHDRAW
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-8 lg:px-12">
        {isWithdrawOpen && (
          <WithdrawalModal
            open={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            balance={walletBalance}
            onSuccess={() => {
              refetchMe();
              refetchWalletTx();
            }}
          />
        )}
        <BetDetailModal bet={selectedBet} onClose={() => setSelectedBet(null)} />
        <TicketActions ticket={latestTicket} onClose={() => setLatestTicket(null)} />
        {signupBonusToast && (
          <div className="mb-4 flex items-center gap-2 rounded-sm border border-fn-green/30 bg-fn-green/10 px-4 py-3 text-[11px] text-fn-text">
            <CheckCircle size={13} className="flex-shrink-0 text-fn-green" />
            <span className="min-w-0 flex-1">{signupBonusToast}</span>
            <button onClick={() => setSignupBonusToast(null)} className="text-fn-muted hover:text-fn-text">
              <X size={13} />
            </button>
          </div>
        )}
        {status === "success" && (
          <div className="mb-4 rounded-sm border border-fn-green/30 bg-fn-green/10 px-4 py-3 text-[11px] text-fn-text">
            Payment completed. Your wager is being confirmed and will show up after Paystack webhook processing.
          </div>
        )}

        {wagersError && (
          <div className="mb-4 rounded-sm border border-fn-red/30 bg-fn-red/10 px-4 py-3 text-[11px] text-fn-text">
            Unable to load live markets right now: {wagersError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            {featured.length > 0 && (
              <div>
                <div className="fn-label mb-2 flex items-center gap-1.5">
                  <Zap size={9} className="text-fn-red" /> WHAT&apos;S HOT NOW
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {featured.map((item) => (
                    <div
                      key={String((item as Record<string, unknown>).id)}
                      className="flex-shrink-0 bg-fn-card border border-fn-gborder rounded-sm px-3 py-2.5 min-w-[160px] hover:border-fn-green/30 transition-colors"
                    >
                      <span className="inline-block text-[7px] font-bold bg-fn-red/20 text-fn-red border border-fn-red/30 px-1.5 py-0.5 rounded-sm mb-1.5">
                        {String((item as Record<string, unknown>).badge || "HOT")}
                      </span>
                      <p className="text-[10px] font-bold text-fn-text leading-snug">
                        {String((item as Record<string, unknown>).label)}
                      </p>
                      {Boolean((item as Record<string, unknown>).type) && (
                        <p className="fn-label mt-0.5">
                          {String((item as Record<string, unknown>).type).toUpperCase()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 fn-label">
                <span className="live-dot" /> LIVE MARKETS - {allMarkets.length} OPEN
              </div>
              <div className="flex flex-col gap-2 xs:flex-row">
              <select
                value={selectedGameSlug}
                onChange={(event) => { setSelectedGameSlug(event.target.value); setSelectedMatch("all"); setShowAll(false); }}
                className="rounded-sm border border-fn-gborder bg-fn-card px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-fn-text outline-none"
                aria-label="Filter wagers by game"
              >
                <option value="all">All games</option>
                {availableGameFilters.map((game) => <option key={game.slug} value={game.slug}>{game.shortName}</option>)}
              </select>
              {matchOptions.length > 0 && (
                <select
                  value={selectedMatch}
                  onChange={(event) => { setSelectedMatch(event.target.value); setShowAll(false); }}
                  className="rounded-sm border border-fn-gborder bg-fn-card px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-fn-text outline-none"
                  aria-label="Filter wagers by match"
                >
                  <option value="all">All matches</option>
                  {matchOptions.map((match) => <option key={match} value={match}>{match}</option>)}
                </select>
              )}
              </div>
            </div>

            {wagersLoading && (
              <div className="flex justify-center rounded-sm border border-fn-gborder bg-fn-card p-6">
                <BrandedLoader label="Loading active wager markets" size="sm" />
              </div>
            )}

            {!wagersLoading && !allMarkets.length && (
              <div className="rounded-sm border border-fn-gborder bg-fn-card p-6">
                <p className="text-sm font-bold text-fn-text">No live markets are open right now.</p>
                <p className="mt-2 text-[11px] text-fn-muted">
                  New tactical markets will appear here as soon as the admin desk opens them.
                </p>
              </div>
            )}

            {displayedMarkets.map((market) => (
              <WagerCard
                key={String(market.id)}
                market={market}
                email={currentUser?.email}
                username={username}
                walletBalance={walletBalance}
                onAddToSlip={addToSlip}
                onPlaced={refreshAfterPlacement}
                userWagers={currentUserWagers}
              />
            ))}

            {allMarkets.length > 4 && (
              <button
                onClick={() => setShowAll((current) => !current)}
                className="fn-btn-outline flex w-full items-center justify-center gap-2 py-3 text-[10px]"
              >
                {showAll ? (
                  <>
                    <ChevronUp size={12} /> SHOW LESS
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} /> LOAD {allMarkets.length - 4} MORE MARKETS
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4 xl:col-span-1">
            <WagerPanel
              selections={slipSelections}
              stake={slipStake}
              setStake={setSlipStake}
              email={currentUser?.email}
              username={username}
              walletBalance={walletBalance}
              onRemove={removeFromSlip}
              onClear={() => setSlipSelections([])}
              onSubmit={refreshAfterPlacement}
            />

            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={12} className="text-fn-yellow" />
                <span className="fn-label text-fn-text">ELITE PREDICTORS</span>
              </div>
              <div className="space-y-2">
                {predictors.length === 0 ? (
                  <p className="text-[10px] text-fn-muted text-center py-3">No predictors ranked yet.</p>
                ) : (
                  (predictors as Record<string, unknown>[]).slice(0, 5).map((predictor, index) => (
                    <div
                      key={String(predictor.tag)}
                      className="flex items-center gap-3 rounded-sm border border-fn-gborder bg-fn-dark p-2 transition-colors hover:border-fn-green/30"
                    >
                      <span
                        className={`w-5 text-center text-[9px] font-bold ${
                          index === 0 ? "text-fn-yellow" : index === 1 ? "text-fn-text" : "text-fn-muted"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-fn-gborder bg-fn-green/10 text-[9px] font-bold text-fn-green">
                        {String(predictor.tag)[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-bold text-fn-text">{String(predictor.tag)}</div>
                        <div className="fn-label">{String(predictor.accuracy || "")} accuracy</div>
                      </div>
                      <span className="flex-shrink-0 text-[9px] font-bold text-fn-green">
                        {String(predictor.weekly_earnings || "")}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button className="fn-btn-outline mt-3 w-full py-2 text-[9px]">VIEW ALL RANKINGS</button>
            </div>

            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: allMarkets.length.toLocaleString(), label: "Open Markets", icon: BarChart2 },
                  { value: formatCompactCurrency(walletBalance), label: "Wallet Balance", icon: Wallet },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-center">
                    <Icon size={12} className="mx-auto mb-1 text-fn-green" />
                    <div className="font-display text-xl font-black text-fn-text">{value}</div>
                    <div className="fn-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="fn-label">MY ACTIVE PREDICTIONS</span>
                <span className="text-[9px] font-bold text-fn-green">{currentUserWagers.length} ACTIVE</span>
              </div>
              {myWagersLoading ? (
                <div className="flex justify-center rounded-sm border border-fn-gborder bg-fn-dark p-3">
                  <BrandedLoader label="Loading wager history" size="sm" />
                </div>
              ) : !currentUser?.email ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  Sign in to view your active predictions and settled wager history.
                </div>
              ) : myWagersError ? (
                <div className="rounded-sm border border-fn-red/30 bg-fn-red/10 p-3 text-[10px] text-fn-text">
                  Unable to load your wagers right now: {myWagersError}
                </div>
              ) : !currentUserWagers.length ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  You have not placed any wagers yet.
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-0.5">
                  {currentUserWagers.map((prediction) => {
                    const selection = String(prediction.selection ?? "N/A");
                    const statusLabel = String(prediction.status ?? "Pending");
                    const statusTone =
                      statusLabel === "Won"
                        ? { bg: "rgb(var(--fn-green) / 0.14)", color: "rgb(var(--fn-green))", border: "rgb(var(--fn-green) / 0.28)" }
                        : statusLabel === "Lost"
                          ? { bg: "#ff4d4f20", color: "#ff4d4f", border: "#ff4d4f40" }
                          : { bg: "rgb(var(--fn-yellow) / 0.14)", color: "rgb(var(--fn-yellow))", border: "rgb(var(--fn-yellow) / 0.28)" };

                    return (
                      <button
                        key={String(prediction.id)}
                        onClick={() => setSelectedBet(prediction)}
                        className="w-full rounded-sm border border-fn-gborder bg-fn-dark p-3 text-left transition-colors hover:border-fn-green/30 hover:bg-fn-green/5"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold leading-tight text-fn-text">
                              {prediction.wager?.question || "Untitled wager market"}
                            </div>
                            <div className="fn-label mt-0.5 flex items-center gap-1">
                              <Clock size={8} />
                              {formatShortDate(prediction.created_at)}
                            </div>
                          </div>
                          <span
                            className="flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[7px] font-bold tracking-widest"
                            style={{
                              background: statusTone.bg,
                              color: statusTone.color,
                              border: `1px solid ${statusTone.border}`,
                            }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          {[
                            { value: selection, label: "PICK" },
                            { value: `${Number(prediction.odds ?? 0).toFixed(2)}×`, label: "ODDS" },
                            { value: formatCurrency(Number(prediction.amount ?? 0)), label: "STAKE" },
                          ].map(({ value, label }) => (
                            <div key={label} className="text-center">
                              <div className="truncate text-[9px] font-bold text-fn-green">{value}</div>
                              <div className="fn-label text-[7px]">{label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex justify-between border-t border-fn-gborder/50 pt-2">
                          <span className="fn-label">POTENTIAL</span>
                          <span className="text-[10px] font-bold text-fn-green">
                            {formatCurrency(Number(prediction.potential ?? 0))}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="fn-label">WALLET ACTIVITY</span>
                <span className="text-[9px] font-bold text-fn-green">{walletTxList.length} ITEMS</span>
              </div>
              {walletTxLoading ? (
                <div className="flex justify-center rounded-sm border border-fn-gborder bg-fn-dark p-3">
                  <BrandedLoader label="Loading wallet history" size="sm" />
                </div>
              ) : !currentUser?.email ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  Sign in to see wallet transactions and payout history.
                </div>
              ) : walletTxError ? (
                <div className="rounded-sm border border-fn-red/30 bg-fn-red/10 p-3 text-[10px] text-fn-text">
                  Unable to load wallet history: {walletTxError}
                </div>
              ) : !walletTxList.length ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  No wallet activity yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {walletTxList.map((tx) => {
                    const amount = Number(tx.amount ?? 0);
                    const tone = amount >= 0 ? "text-fn-green" : "text-fn-red";
                    return (
                      <div key={String(tx.id)} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-fn-text">
                              {tx.type || "Transaction"}
                            </div>
                            <div className="fn-label">
                              {tx.description || "Wallet activity logged"}
                            </div>
                          </div>
                          <div className={`text-[10px] font-bold ${tone}`}>
                            {formatTransactionAmount(amount)}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between border-t border-fn-gborder/50 pt-2">
                          <span className="fn-label">POSTED</span>
                          <span className="text-[9px] font-bold text-fn-green">
                            {formatShortDate(tx.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WagerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-fn-dark" />}>
      <WagerPageContent />
    </Suspense>
  );
}
