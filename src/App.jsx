import html2pdf from "html2pdf.js";
import { useState, useRef, useEffect } from "react";
const STORAGE_KEY = "invoice-generator-data";
function generateInvoiceNumber() {
  return "INV-" + Date.now().toString().slice(-6);
}

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR — Indian Rupee" },
  { code: "USD", symbol: "$", label: "USD — US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR — Euro" },
  { code: "GBP", symbol: "£", label: "GBP — British Pound" },
  { code: "AED", symbol: "د.إ", label: "AED — UAE Dirham" },
  { code: "SGD", symbol: "S$", label: "SGD — Singapore Dollar" },
  { code: "AUD", symbol: "A$", label: "AUD — Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "CAD — Canadian Dollar" },
];

function UpiQR({ upiId, amount, name }) {
  if (!upiId) return null;
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || "Freelancer")}&am=${amount > 0 ? amount.toFixed(2) : ""}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiString)}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <img src={qrUrl} alt="UPI QR" style={{ width: 130, height: 130, borderRadius: 8, border: "1px solid #e8e8e8", background: "#fff", padding: 5 }} />
      <div style={{ fontSize: "0.7rem", color: "#999" }}>Scan to pay via UPI</div>
      <div style={{ fontSize: "0.76rem", color: "#c9a84c", fontWeight: 600 }}>{upiId}</div>
    </div>
  );
}

// ── Shared Invoice Preview Component ──
function InvoicePreview({ data, fmt, formatDate, isInternational, gstEnabled, gstRate, gstAmount, subtotal, total, compact = false }) {
  const { businessName, businessEmail, businessPhone, businessAddress, gstNumber, logo,
    clientName, clientEmail, clientAddress, invoiceNumber, invoiceDate, dueDate, cur,
    items, upiId, showUpiQr, accountHolder, bankName, accountNumber, ifsc,
    paypalEmail, wiseEmail, swiftCode, ibanNumber, intlBankName, intlAccountHolder,
    notes, thankYouNote, termsEnabled, termsText, signatureEnabled, signatureImg, signatureName
  } = data;

  const p = compact ? "28px" : "48px";

  return (
    <div style={{ padding: p, fontFamily: "'Inter', sans-serif", color: "#1a1a1a", background: "#fff", fontSize: compact ? "0.82rem" : "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #f0f0f0" }}>
        <div>
          {logo && <img src={logo} style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 8, display: "block" }} alt="logo" />}
          <div style={{ fontSize: compact ? "1rem" : "1.2rem", fontWeight: 700, color: "#111", fontFamily: "'DM Serif Display', serif" }}>{businessName || "Your Business"}</div>
          <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: 4, lineHeight: 1.8 }}>
            {businessEmail && <>{businessEmail}<br /></>}
            {businessPhone && <>{businessPhone}<br /></>}
            {businessAddress && <>{businessAddress}<br /></>}
            {gstNumber && <>GST: {gstNumber}</>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: compact ? "1.4rem" : "1.7rem", color: "#1a1a1a", fontWeight: 400, letterSpacing: "-0.01em" }}>Invoice</div>
          <div style={{ fontSize: "0.72rem", color: "#bbb", marginTop: 4 }}>#{invoiceNumber}</div>
          <div style={{ fontSize: "0.72rem", color: "#999", marginTop: 2 }}>
            {formatDate(invoiceDate)}{dueDate && ` · Due ${formatDate(dueDate)}`}
          </div>
        </div>
      </div>

      {/* Bill To + Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#bbb", fontWeight: 600, marginBottom: 5 }}>Bill To</div>
          <div style={{ fontSize: compact ? "0.88rem" : "0.95rem", fontWeight: 600, color: "#111", marginBottom: 2 }}>{clientName || "—"}</div>
          <div style={{ fontSize: "0.72rem", color: "#aaa", lineHeight: 1.75 }}>
            {clientEmail && <>{clientEmail}<br /></>}{clientAddress}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#bbb", fontWeight: 600, marginBottom: 5 }}>Details</div>
          <div style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.9 }}>
            <strong style={{ color: "#444" }}>Currency:</strong> {cur.code}<br />
            {dueDate && <><strong style={{ color: "#444" }}>Due:</strong> {formatDate(dueDate)}<br /></>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #efefef" }}>
            <th style={{ textAlign: "left", padding: "8px 10px", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#bbb", fontWeight: 600 }}>Description</th>
            <th style={{ textAlign: "center", padding: "8px 10px", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#bbb", fontWeight: 600 }}>Qty</th>
            <th style={{ textAlign: "right", padding: "8px 10px", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#bbb", fontWeight: 600 }}>Rate</th>
            <th style={{ textAlign: "right", padding: "8px 10px", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#bbb", fontWeight: 600 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.filter(i => i.description).map(item => (
            <tr key={item.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
              <td style={{ padding: "9px 10px", fontSize: "0.83rem", color: "#333" }}>{item.description}</td>
              <td style={{ padding: "9px 10px", fontSize: "0.83rem", color: "#666", textAlign: "center" }}>{item.quantity}</td>
              <td style={{ padding: "9px 10px", fontSize: "0.83rem", color: "#333", textAlign: "right", fontWeight: 500 }}>{fmt(item.rate)}</td>
              <td style={{ padding: "9px 10px", fontSize: "0.83rem", color: "#111", textAlign: "right", fontWeight: 500 }}>{fmt(Number(item.quantity) * Number(item.rate))}</td>
            </tr>
          ))}
          {items.filter(i => i.description).length === 0 && (
            <tr><td colSpan={4} style={{ padding: "16px 10px", color: "#ddd", fontSize: "0.78rem", textAlign: "center" }}>No items added yet</td></tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <div style={{ width: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.8rem", color: "#999" }}>
            <span>Subtotal</span><span style={{ fontWeight: 500, color: "#555" }}>{fmt(subtotal)}</span>
          </div>
          {!isInternational && gstEnabled && <>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.8rem", color: "#999" }}>
              <span>CGST ({gstRate / 2}%)</span><span style={{ fontWeight: 500, color: "#555" }}>{fmt(gstAmount / 2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.8rem", color: "#999" }}>
              <span>SGST ({gstRate / 2}%)</span><span style={{ fontWeight: 500, color: "#555" }}>{fmt(gstAmount / 2)}</span>
            </div>
          </>}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: "0.92rem", fontWeight: 700, color: "#111", borderTop: "1px solid #efefef", marginTop: 6 }}>
            <span>Total</span>
            <span style={{ color: "#c9a84c", fontSize: "1rem" }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      {(!isInternational && (upiId || accountHolder || bankName)) && (
        <div style={{ background: "#f9f9f9", borderRadius: 8, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {upiId && (
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#aaa", fontWeight: 600, marginBottom: 6 }}>UPI</div>
              {showUpiQr && <div style={{ marginBottom: 8 }}><UpiQR upiId={upiId} amount={total} name={businessName} /></div>}
              <div style={{ fontSize: "0.75rem", color: "#555" }}>{upiId}</div>
            </div>
          )}
          {(accountHolder || bankName) && (
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#aaa", fontWeight: 600, marginBottom: 6 }}>Bank Transfer</div>
              <div style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.8 }}>
                {accountHolder && <><strong style={{ color: "#333" }}>Name:</strong> {accountHolder}<br /></>}
                {bankName && <><strong style={{ color: "#333" }}>Bank:</strong> {bankName}<br /></>}
                {accountNumber && <><strong style={{ color: "#333" }}>Acc:</strong> {accountNumber}<br /></>}
                {ifsc && <><strong style={{ color: "#333" }}>IFSC:</strong> {ifsc}</>}
              </div>
            </div>
          )}
        </div>
      )}
      {isInternational && (paypalEmail || wiseEmail || swiftCode) && (
        <div style={{ background: "#f9f9f9", borderRadius: 8, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {paypalEmail && <div style={{ flex: 1 }}><div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#aaa", fontWeight: 600, marginBottom: 4 }}>PayPal</div><div style={{ fontSize: "0.75rem", color: "#555" }}>{paypalEmail}</div></div>}
          {wiseEmail && <div style={{ flex: 1 }}><div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#aaa", fontWeight: 600, marginBottom: 4 }}>Wise</div><div style={{ fontSize: "0.75rem", color: "#555" }}>{wiseEmail}</div></div>}
          {swiftCode && <div style={{ flex: 1 }}><div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#aaa", fontWeight: 600, marginBottom: 4 }}>SWIFT</div><div style={{ fontSize: "0.75rem", color: "#555" }}>{swiftCode}</div></div>}
        </div>
      )}

      {/* Notes */}
      {notes && <div style={{ background: "#fafaf7", borderLeft: "2px solid #e0d0a0", borderRadius: 6, padding: "10px 14px", fontSize: "0.76rem", color: "#666", lineHeight: 1.75, marginBottom: 18 }}>{notes}</div>}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #efefef", paddingTop: 20 }}>
        {thankYouNote && <div style={{ textAlign: "center", fontFamily: "'DM Serif Display', serif", fontSize: "0.9rem", color: "#999", marginBottom: 16, fontStyle: "italic" }}>"{thankYouNote}"</div>}
        {signatureEnabled && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginBottom: 16 }}>
            {signatureImg && <img src={signatureImg} style={{ height: 44, objectFit: "contain", marginBottom: 4 }} alt="sig" />}
            <div style={{ width: 140, borderBottom: "1px solid #ddd", marginBottom: 5 }}></div>
            <div style={{ fontSize: "0.7rem", color: "#aaa" }}>{signatureName || "Authorized Signatory"}</div>
          </div>
        )}
        {termsEnabled && termsText && (
          <div style={{ background: "#f9f9f9", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#bbb", fontWeight: 600, marginBottom: 6 }}>Terms & Conditions</div>
            <div style={{ fontSize: "0.7rem", color: "#aaa", lineHeight: 1.9, whiteSpace: "pre-line" }}>{termsText}</div>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid #f0f0f0", fontSize: "0.64rem", color: "#ddd" }}>
          {businessName || "Your Business"} · {invoiceNumber}
        </div>
      </div>
    </div>
  );
}

export default function InvoiceGenerator() {
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [logo, setLogo] = useState(null);
  const logoInputRef = useRef();
  const sigInputRef = useRef();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: 0 }]);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  const [upiId, setUpiId] = useState("");
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const [paypalEmail, setPaypalEmail] = useState("");
  const [wiseEmail, setWiseEmail] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [ibanNumber, setIbanNumber] = useState("");
  const [intlBankName, setIntlBankName] = useState("");
  const [intlAccountHolder, setIntlAccountHolder] = useState("");

  const [thankYouNote, setThankYouNote] = useState("Thank you for your business! We appreciate your trust and look forward to working with you again.");
  const [termsEnabled, setTermsEnabled] = useState(true);
  const [termsText, setTermsText] = useState("1. Payment is due within the specified due date.\n2. Late payments may incur a 2% monthly charge.\n3. All work remains property of the freelancer until full payment is received.\n4. Disputes must be raised within 7 days of invoice date.");
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureImg, setSignatureImg] = useState(null);
  const [signatureName, setSignatureName] = useState("");
  const [notes, setNotes] = useState("");
  const [shareToast, setShareToast] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved locally");
  const [openSections, setOpenSections] = useState({
  business: true,
  client: true,
  invoice: false,
  items: true,
  payment: false,
  notes: false,
  footer: false,
});

const toggleSection = (section) => {
  setOpenSections(prev => ({
    ...prev,
    [section]: !prev[section]
  }));
};

  const cur = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const isInternational = currency !== "INR";
  const addItem = () => setItems([...items, { id: Date.now(), description: "", quantity: 1, rate: 0 }]);
  const removeItem = (id) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };
  const updateItem = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.rate), 0);
  const gstAmount = (!isInternational && gstEnabled) ? (subtotal * gstRate) / 100 : 0;
  const total = subtotal + gstAmount;
  const fmt = (n) => cur.symbol + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const handleLogo = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = ev => setLogo(ev.target.result); reader.readAsDataURL(file);
  };
  const handleSig = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = ev => setSignatureImg(ev.target.result); reader.readAsDataURL(file);
  };
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Invoice ${invoiceNumber}`, text: `Invoice from ${businessName || "Freelancer"} — ${fmt(total)}`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => { setShareToast(true); setTimeout(() => setShareToast(false), 2500); });
    }
  };
  const handleDownloadPDF = async () => {

  setPdfLoading(true);

  try {

    const element = document.querySelector(".invoice-sheet");

    const opt = {
      margin: 0.5,
      filename: `invoice-${invoiceNumber || "invoice"}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait"
      }
    };

    await html2pdf().set(opt).from(element).save();

  } catch (err) {
    console.error(err);
  }

  setPdfLoading(false);
};

  useEffect(() => {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);

      setBusinessName(parsed.businessName || "");
      setBusinessEmail(parsed.businessEmail || "");
      setBusinessPhone(parsed.businessPhone || "");
      setBusinessAddress(parsed.businessAddress || "");
      setGstNumber(parsed.gstNumber || "");

      setClientName(parsed.clientName || "");
      setClientEmail(parsed.clientEmail || "");
      setClientAddress(parsed.clientAddress || "");

      setInvoiceDate(parsed.invoiceDate || new Date().toISOString().split("T")[0]);
      setDueDate(parsed.dueDate || "");
      setCurrency(parsed.currency || "INR");

      setItems(parsed.items || [{ id: 1, description: "", quantity: 1, rate: 0 }]);

      setGstEnabled(parsed.gstEnabled || false);
      setGstRate(parsed.gstRate || 18);

      setUpiId(parsed.upiId || "");
      setShowUpiQr(parsed.showUpiQr || false);

      setBankName(parsed.bankName || "");
      setAccountNumber(parsed.accountNumber || "");
      setIfsc(parsed.ifsc || "");
      setAccountHolder(parsed.accountHolder || "");

      setPaypalEmail(parsed.paypalEmail || "");
      setWiseEmail(parsed.wiseEmail || "");
      setSwiftCode(parsed.swiftCode || "");
      setIbanNumber(parsed.ibanNumber || "");
      setIntlBankName(parsed.intlBankName || "");
      setIntlAccountHolder(parsed.intlAccountHolder || "");

      setThankYouNote(parsed.thankYouNote || "");
      setTermsEnabled(parsed.termsEnabled ?? true);
      setTermsText(parsed.termsText || "");

      setSignatureEnabled(parsed.signatureEnabled || false);
      setSignatureImg(parsed.signatureImg || null);
      setSignatureName(parsed.signatureName || "");

      setNotes(parsed.notes || "");
    } catch (error) {
      console.error("Failed to load saved invoice data", error);
    }
  }
}, []);

useEffect(() => {
  const dataToSave = {
    businessName,
    businessEmail,
    businessPhone,
    businessAddress,
    gstNumber,

    clientName,
    clientEmail,
    clientAddress,

    invoiceDate,
    dueDate,
    currency,

    items,

    gstEnabled,
    gstRate,

    upiId,
    showUpiQr,

    bankName,
    accountNumber,
    ifsc,
    accountHolder,

    paypalEmail,
    wiseEmail,
    swiftCode,
    ibanNumber,
    intlBankName,
    intlAccountHolder,

    thankYouNote,
    termsEnabled,
    termsText,

    signatureEnabled,
    signatureImg,
    signatureName,

    notes
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

  setSaveStatus("Saved locally");

  const timer = setTimeout(() => {
    setSaveStatus("Auto-saving...");
  }, 1200);

  return () => clearTimeout(timer);

}, [
  businessName,
  businessEmail,
  businessPhone,
  businessAddress,
  gstNumber,

  clientName,
  clientEmail,
  clientAddress,

  invoiceDate,
  dueDate,
  currency,

  items,

  gstEnabled,
  gstRate,

  upiId,
  showUpiQr,

  bankName,
  accountNumber,
  ifsc,
  accountHolder,

  paypalEmail,
  wiseEmail,
  swiftCode,
  ibanNumber,
  intlBankName,
  intlAccountHolder,

  thankYouNote,
  termsEnabled,
  termsText,

  signatureEnabled,
  signatureImg,
  signatureName,

  notes
]);
  const previewData = {
    businessName, businessEmail, businessPhone, businessAddress, gstNumber, logo,
    clientName, clientEmail, clientAddress, invoiceNumber, invoiceDate, dueDate, cur,
    items, upiId, showUpiQr, accountHolder, bankName, accountNumber, ifsc,
    paypalEmail, wiseEmail, swiftCode, ibanNumber, intlBankName, intlAccountHolder,
    notes, thankYouNote, termsEnabled, termsText, signatureEnabled, signatureImg, signatureName
  };

  const previewProps = { data: previewData, fmt, formatDate, isInternational, gstEnabled, gstRate, gstAmount, subtotal, total };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0c10; color: #c8c4bc; font-family: 'Inter', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; line-height: 1.6; overflow-x: hidden; }

        /* ── TOP BAR ── */
        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(12,12,16,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #1e1e28;
          padding: 12px 28px;
          display: flex; align-items: center; gap: 10px;
          backdrop-filter: blur(14px);
background: rgba(12,12,16,0.82);
display: flex;
align-items: center;
justify-content: space-between;
gap: 18px;
        }
        .topbar-logo {
  display: flex;
  align-items: center;
  gap: 10px;

  font-family: 'DM Serif Display', serif;
  font-size: 1.45rem;
  font-weight: 700;

  color: #f4efe6;
  letter-spacing: -0.03em;
}
  .brand-icon {
  color: #c9a84c;
  font-size: 0.9rem;

  display: flex;
  align-items: center;
  justify-content: center;
}
        .topbar-logo span { color: #c9a84c; }
        .topbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; gap: 10px; }
        .btn-ghost {
          padding: 7px 14px; border-radius: 8px; border: 1px solid #1e1e28;
          background: transparent; color: #56565e; font-family: 'Inter', sans-serif;
          font-size: 0.8rem; cursor: pointer; font-weight: 500; transition: all 0.18s;
        }
        .btn-ghost:hover { border-color: #2e2e3a; color: #8a8880; }
        .btn-primary {
          padding: 7px 16px; border-radius: 8px; border: none;
          background: #c9a84c; color: #0c0c10;
          font-family: 'Inter', sans-serif; font-size: 0.8rem;
          cursor: pointer; font-weight: 600; transition: all 0.2s;
        }
          .btn-primary:active {
  transform: scale(0.98);
}
        .btn-primary:hover { background: #d6b55e; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(201,168,76,0.3); }
        .btn-primary:disabled {
  transform: none !important;
  box-shadow: none !important;
}

        /* Mobile preview button */
        .btn-preview-mobile {
          display: none;
          padding: 7px 14px; border-radius: 8px; border: 1px solid #c9a84c33;
          background: #c9a84c11; color: #c9a84c;
          font-family: 'Inter', sans-serif; font-size: 0.8rem;
          cursor: pointer; font-weight: 500;
        }
        /* ── HERO SECTION ── */

.hero-section {
  padding: 46px 28px 26px;
  border-bottom: 1px solid #1e1e28;
  background:
    radial-gradient(circle at top left, rgba(201,168,76,0.08), transparent 28%),
    #0c0c10;
    text-align: center;
display: flex;
flex-direction: column;
align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.16);
  color: #b89a46;
  font-size: 0.72rem;
  font-weight: 600;
  margin-bottom: 18px;
}

.hero-title {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #f5f1ea;
  max-width: 760px;
  margin-bottom: 14px;
  font-weight: 400;
}

.hero-subtitle {
  font-size: 1rem;
  color: #8c8a84;
  margin-bottom: 14px;
  line-height: 1.7;
  max-width: 620px;
}

.hero-trust {
  font-size: 0.82rem;
  color: #5d5c57;
  line-height: 1.6;
  max-width: 640px;
}
        /* ── SPLIT LAYOUT ── */
        .split { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 57px); padding-top: 22px; width: 100%;
max-width: 100%;
overflow-x: hidden; }

        /* Left — Form */
        .form-col {
          padding: 32px 28px 80px;
          overflow-y: auto;
          border-right: 1px solid #1e1e28;
          padding-top: 12px;
          min-width: 0;
max-width: 100%;
        }

        /* Right — Live Preview */
        .preview-col {
        position: relative;
        padding-top: 12px;
          position: sticky; top: 57px;
          height: calc(100vh - 57px);
          overflow-y: auto;
          background: #0a0a0e;
          padding: 24px 20px;
          min-width: 0;
max-width: 100%;
        }
          /* ── PREVIEW HEADER ── */

.preview-header {
  position: sticky;
  top: 74px;
  z-index: 20;

  padding: 14px 18px;
  margin-bottom: 18px;

  border: 1px solid #1f1f28;
  border-radius: 16px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.03),
      rgba(255,255,255,0.015)
    );

  backdrop-filter: blur(12px);
}

.preview-header-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ece7de;
  margin-bottom: 4px;
}

.preview-header-subtitle {
  font-size: 0.74rem;
  color: #75736d;
}
        .preview-col-inner {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          min-height: 400px;
        }
        .preview-col-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
          background: #111117;
          border-bottom: 1px solid #1e1e28;
          border-radius: 12px 12px 0 0;
          margin-bottom: 0;
        }
        .preview-col-header span { font-size: 0.72rem; color: #48484f; font-weight: 500; }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4caf50; display: inline-block; margin-right: 6px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* ── CARDS (form side) ── */
        .card { background: #111117; border: 1px solid #20202a; border-radius: 14px; padding: 24px 28px; margin-bottom: 12px; background: linear-gradient(
  180deg,
  rgba(255,255,255,0.015),
  rgba(255,255,255,0.01)
); }
        
        
        .accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding-bottom: 2px;
  padding: 4px 2px;
border-radius: 10px;
transition: background 0.2s ease;
}
.accordion-header:hover {
  background: rgba(255,255,255,0.025);
}

.accordion-chevron {
  color: #7b7b86;
  font-size: 0.9rem;
  transition: transform 0.25s ease;
  font-weight: 700;
}

.accordion-chevron.open {
  transform: rotate(180deg);
}

.accordion-content {
  overflow: hidden;
  transition: all 0.28s ease;
}

.accordion-content.closed {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.accordion-content.open {
  max-height: 3000px;
  opacity: 1;
  margin-top: 18px;
  padding-top: 4px;
}
        .section-label { font-size: 0.76rem; font-weight: 600; color: #38383f; letter-spacing: 0; text-transform: none; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
        .section-label::after { content: ''; flex: 1; height: 1px; background: #1e1e28; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field label { font-size: 0.72rem; color: #56565e; font-weight: 500; }
        input, textarea, select {
        transition:
  border-color 0.2s ease,
  box-shadow 0.2s ease,
  background 0.2s ease;
          background: #0e0e14; border: 1px solid #1e1e28; border-radius: 9px;
          padding: 10px 13px; color: #c8c4bc; font-family: 'Inter', sans-serif;
          font-size: 0.855rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%; font-weight: 400; line-height: 1.5;
        }
          .input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: rgba(201,168,76,0.42);

  box-shadow:
    0 0 0 4px rgba(201,168,76,0.06);

  background: rgba(255,255,255,0.03);
}
        input::placeholder, textarea::placeholder {
  color: #6f6f78;
}
        input:focus, textarea:focus, select:focus { border-color: #30303e; box-shadow: 0 0 0 3px rgba(201,168,76,0.05); }
        textarea { resize: vertical; min-height: 80px; line-height: 1.65; line-height: 1.7;
resize: vertical; }
        select option { background: #111117; }

        .logo-area { border: 1px dashed #1e1e28; border-radius: 10px; padding: 18px; text-align: center; cursor: pointer; transition: all 0.2s; background: #0e0e14; }
        .logo-area:hover { border-color: #30303e; }
        .logo-area img.preview { width: 64px; height: 64px; object-fit: contain; border-radius: 6px; margin-bottom: 6px; }
        .logo-hint { font-size: 0.73rem; color: #38383f; }
        .logo-hint span { color: #7a6e40; }

        .cur-badge { display: inline-flex; align-items: center; gap: 5px; background: #181510; border: 1px solid #252010; border-radius: 5px; padding: 2px 8px; font-size: 0.7rem; color: #7a6e40; font-weight: 500; margin-left: 8px; }

        .items-head { display: grid; grid-template-columns: 3fr 0.8fr 1.2fr 0.9fr 30px; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid #1e1e28; margin-bottom: 10px; }
        .items-head span { font-size: 0.68rem; color: #38383f; font-weight: 500; }
        .item-row { display: grid; grid-template-columns: 3fr 0.8fr 1.2fr 0.9fr 30px; gap: 8px; align-items: center; margin-bottom: 8px; }
        .item-amt { font-size: 0.82rem; font-weight: 500; color: #6a6860; text-align: right; }
        .btn-remove { background: none; border: 1px solid #1e1e28; border-radius: 6px; color: #38383f; width: 30px; height: 34px; cursor: pointer; font-size: 0.9rem; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .btn-remove:hover { border-color: #5a2828; color: #b04848; background: rgba(176,72,72,0.06); }
        .btn-add { background: none; border: 1px dashed #1e1e28; border-radius: 8px; color: #38383f; padding: 9px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.78rem; width: 100%; margin-top: 6px; transition: all 0.18s; font-weight: 500; }
        .btn-add:hover { border-color: #30303e; color: #7a7870; }

        .toggle-row { display: flex; align-items: center; gap: 12px; padding: 11px 14px; background: #0e0e14; border: 1px solid #1e1e28; border-radius: 9px; cursor: pointer; transition: border-color 0.18s; margin-bottom: 9px; }
        .toggle-row:hover { border-color: #2e2e3a; }
        .toggle-sw { width: 38px; height: 21px; background: #1e1e28; border-radius: 11px; position: relative; transition: background 0.25s; flex-shrink: 0; }
        .toggle-sw.on { background: #c9a84c; }
        .toggle-knob { position: absolute; top: 2.5px; left: 2.5px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform 0.25s; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
        .toggle-sw.on .toggle-knob { transform: translateX(17px); }
        .toggle-lbl { font-size: 0.82rem; color: #56565e; line-height: 1.4; }
        .toggle-lbl strong { color: #9a9890; font-weight: 500; }

        .divider { font-size: 0.7rem; color: #28282f; letter-spacing: 0; text-transform: none; margin: 16px 0 14px; display: flex; align-items: center; gap: 10px; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #1e1e28; }

        .totals { margin-top: 18px; border-top: 1px solid #1e1e28; padding-top: 14px; }
        .t-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 0.83rem; color: #48484f; }
        .t-row .val { color: #6a6860; font-weight: 500; }
        .t-row.grand { font-size: 0.96rem; font-weight: 600; color: #c8c4bc; border-top: 1px solid #1e1e28; margin-top: 8px; padding-top: 12px; }
        .t-row.grand .val { color: #c9a84c; font-size: 1.05rem; }

        .info-box { background: #0e0e14; border: 1px solid #1e1e28; border-left: 2px solid #c9a84c; border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; color: #48484f; margin-bottom: 14px; line-height: 1.6; }
        .info-box strong { color: #7a6e40; }

        .qr-box { background: #0e0e14; border: 1px solid #1e1e28; border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; gap: 20px; margin-top: 10px; }
        .qr-box h4 { font-size: 0.86rem; color: #c8c4bc; font-weight: 600; margin-bottom: 4px; }
        .qr-box p { font-size: 0.75rem; color: #48484f; line-height: 1.6; }

        /* ── TOAST ── */
        .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #1e1e28; border: 1px solid #2e2e3a; color: #c8c4bc; padding: 10px 20px; border-radius: 9px; font-size: 0.8rem; z-index: 999; animation: fadeup 0.25s ease; }
        @keyframes fadeup { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        /* ── MOBILE MODAL ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; flex-direction: column; }
        .modal-sheet { background: #fff; flex: 1; overflow-y: auto; border-radius: 16px 16px 0 0; margin-top: 60px; }
        .modal-header { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #f0f0f0; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
        .modal-header span { font-size: 0.85rem; font-weight: 600; color: #333; }
        .modal-close { background: none; border: none; font-size: 1.4rem; color: #999; cursor: pointer; line-height: 1; }

        /* ── PRINT ── */
        @media print {
          body { background: #fff !important; }
          .topbar, .form-col, .preview-col-header, .no-print { display: none !important; }
          .split { display: block !important; }
          .preview-col { position: static !important; height: auto !important; padding: 0 !important; background: #fff !important; }
          .preview-col-inner { box-shadow: none !important; border-radius: 0 !important; }
        }

        /* ── RESPONSIVE ── */
        /* ── MOBILE ACTION BAR ── */

.mobile-action-bar {
  display: none;
}

.mobile-action {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 0.84rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-action.primary {
  background: #c9a84c;
  color: #0c0c10;
}

.mobile-action.primary:hover {
  background: #d6b55e;
}

.mobile-action.secondary {
  background: #14141b;
  color: #c8c4bc;
  border: 1px solid #1e1e28;
}

.mobile-action.secondary:hover {
  border-color: #30303e;
}
        @media (max-width: 900px) {
        .preview-header {
  display: none;
}

          .split {
  display: block !important;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
          .preview-col { display: none; }
          .btn-preview-mobile { display: flex !important; }
          .topbar { padding: 12px 18px; }
          .form-col { padding: 20px 16px 80px; border-right: none; }
        }
          @media (max-width: 900px) {

  .topbar {
    padding: 12px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .topbar button {
  flex: 1 1 100%;
  min-width: 0;
}
  .topbar-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

  .split {
    display: block !important;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .preview-col {
  position: absolute;
  left: -9999px;
  top: 0;
}

  .form-col {
    width: 100%;
    max-width: 100%;
  }

}
        .hero-section {
  padding: 34px 18px 22px;
}

.hero-title {
  font-size: 2rem;
}

.hero-subtitle {
  font-size: 0.92rem;
}
          .grid-2, .grid-3 { grid-template-columns: 1fr; }
          .items-head { display: none; }
          .item-row { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
          .item-row input:first-child { grid-column: 1 / -1; }
          .qr-box { flex-direction: column; }
          .card { padding: 18px; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="topbar no-print">
        <div className="topbar-logo">
  <span className="brand-icon">◈</span>
  Invoxa
</div>
        <div style={{
  fontSize: "0.72rem",
  color: "#4f8f62",
  marginLeft: "auto",
  marginRight: "14px",
  fontWeight: 500
}}>
  ● {saveStatus}
</div>
        <div className="topbar-right">
          <button className="btn-preview-mobile" onClick={() => setMobilePreviewOpen(true)}>👁 Preview</button>
          <button className="btn-ghost" onClick={handleShare}>Share</button>
          <button
  className="btn-primary"
  onClick={handleDownloadPDF}
  disabled={pdfLoading}
  style={{
    opacity: pdfLoading ? 0.7 : 1,
    cursor: pdfLoading ? "not-allowed" : "pointer",
    minWidth: "145px"
  }}
>
  {pdfLoading ? "Preparing PDF..." : "⬇ Download PDF"}
</button>
        </div>
      </div>

      {shareToast && <div className="toast">Link copied to clipboard</div>}
       
       {/* ── HERO SECTION ── */}
<div className="hero-section no-print">

  <div className="hero-badge">
    Professional Invoice Generator
  </div>

  <h1 className="hero-title">
    Create professional invoices in under 60 seconds.
  </h1>

  <p className="hero-subtitle">
    Fast. Clean. No signup required.
  </p>

  <div className="hero-trust">
    Trusted by freelancers, creators & remote professionals worldwide.
  </div>

</div>
      {/* ── SPLIT LAYOUT ── */}
      <div className="split">

        {/* LEFT — FORM */}
        <div className="form-col">

          {/* Business */}
<div className="card">

  <div
    className="accordion-header"
    onClick={() => toggleSection("business")}
  >
    <div className="section-label" style={{ marginBottom: 0 }}>
      Your Business
    </div>

    <div className={`accordion-chevron ${openSections.business ? "open" : ""}`}>
      ▼
    </div>
  </div>

  <div className={`accordion-content ${openSections.business ? "open" : "closed"}`}>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Business Logo</label>
                <div className="logo-area" onClick={() => logoInputRef.current.click()}>
                  {logo
                    ? <><img src={logo} className="preview" alt="logo" /><div className="logo-hint">Click to <span>change</span></div></>
                    : <><div style={{ fontSize: "1.4rem", marginBottom: 6, opacity: 0.25 }}>⬆</div><div className="logo-hint">Click to <span>upload logo</span> — PNG, JPG</div></>
                  }
                  <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
                </div>
              </div>
              <div className="field"><label>Business / Your Name</label><input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Rahul Design Studio" /></div>
              <div className="field"><label>Email Address</label><input value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="you@example.com" type="email" /></div>
              <div className="field"><label>Phone Number</label><input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
              <div className="field"><label>GST Number <span style={{ color: "#3a3a48", fontWeight: 400 }}>(optional)</span></label><input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" /></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Address</label><input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="City, State, PIN" /></div>
            </div>
          </div>
          </div>

          {/* Client */}
<div className="card">

  <div
    className="accordion-header"
    onClick={() => toggleSection("client")}
  >
    <div className="section-label" style={{ marginBottom: 0 }}>
      Bill To
    </div>

    <div className={`accordion-chevron ${openSections.client ? "open" : ""}`}>
      ▼
    </div>
  </div>

  <div className={`accordion-content ${openSections.client ? "open" : "closed"}`}>
            <div className="grid-3">
              <div className="field"><label>Client Name</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client or Company" /></div>
              <div className="field"><label>Client Email</label><input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@example.com" type="email" /></div>
              <div className="field"><label>Location / Country</label><input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="City, Country" /></div>
            </div>
          </div>
          </div>

          {/* Invoice Details */}
<div className="card">

  <div
    className="accordion-header"
    onClick={() => toggleSection("invoice")}
  >
    <div className="section-label" style={{ marginBottom: 0 }}>
      Invoice Details
    </div>

    <div className={`accordion-chevron ${openSections.invoice ? "open" : ""}`}>
      ▼
    </div>
  </div>

  <div className={`accordion-content ${openSections.invoice ? "open" : "closed"}`}>
            <div className="grid-3">
              <div className="field"><label>Invoice Number</label><input value={invoiceNumber} readOnly style={{ opacity: 0.4 }} /></div>
              <div className="field"><label>Invoice Date</label><input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
              <div className="field"><label>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            </div>
            <div className="field" style={{ marginTop: 14, maxWidth: 240 }}>
              <label>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            {isInternational && <div className="info-box" style={{ marginTop: 12 }}><strong>International invoice</strong> — GST disabled. Add international payment details below.</div>}
          </div>
          </div>

          {/* Items */}
<div className="card">

  <div
    className="accordion-header"
    onClick={() => toggleSection("items")}
  >
    <div className="section-label" style={{ marginBottom: 0 }}>
      Services & Items
    </div>

    <div className={`accordion-chevron ${openSections.items ? "open" : ""}`}>
      ▼
    </div>
  </div>

  <div className={`accordion-content ${openSections.items ? "open" : "closed"}`}>
            <span className="cur-badge">{cur.symbol} {cur.code}</span></div>
            <div className="items-head">
              <span>Description</span><span>Qty</span><span>Rate</span><span style={{ textAlign: "right" }}>Amount</span><span></span>
            </div>
            {items.map(item => (
              <div className="item-row" key={item.id}>
                <input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="e.g. Logo Design, Web Development" />
                <div>
  <div className="item-label">Qty</div>
  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", e.target.value)} />
</div>
                <div>
  <div className="item-label">Price</div>
  <input type="number" min="0" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} />
</div>
                <div className="item-amt">{cur.symbol}{(Number(item.quantity) * Number(item.rate)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                <button className="btn-remove" onClick={() => removeItem(item.id)}>×</button>
              </div>
            ))}
            <button className="btn-add" onClick={addItem}>+ Add line item</button>
            {!isInternational && (
              <div style={{ marginTop: 18 }}>
                <div className="toggle-row" onClick={() => setGstEnabled(!gstEnabled)}>
                  <div className={`toggle-sw ${gstEnabled ? "on" : ""}`}><div className="toggle-knob"></div></div>
                  <div className="toggle-lbl"><strong>GST</strong> — Enable for registered businesses</div>
                </div>
                {gstEnabled && (
                  <div className="field" style={{ maxWidth: 160 }}>
                    <label>GST Rate</label>
                    <select value={gstRate} onChange={e => setGstRate(Number(e.target.value))}>
                      <option value={5}>5%</option><option value={12}>12%</option>
                      <option value={18}>18%</option><option value={28}>28%</option>
                    </select>
                  </div>
                )}
              </div>
            )}
            <div className="totals">
              <div className="t-row"><span>Subtotal</span><span className="val">{fmt(subtotal)}</span></div>
              {!isInternational && gstEnabled && <>
                <div className="t-row"><span>CGST ({gstRate / 2}%)</span><span className="val">{fmt(gstAmount / 2)}</span></div>
                <div className="t-row"><span>SGST ({gstRate / 2}%)</span><span className="val">{fmt(gstAmount / 2)}</span></div>
              </>}
              <div className="t-row grand"><span>Total</span><span className="val">{fmt(total)}</span></div>
            </div>
          </div>
          </div>

          {/* Payment */}
          <div className="card">
            <div
  className="accordion-header"
  onClick={() => toggleSection("payment")}
>
  <div className="section-label" style={{ marginBottom: 0 }}>
    Payment Details
  </div>

  <div className={`accordion-chevron ${openSections.payment ? "open" : ""}`}>
    ▼
  </div>
</div>

<div className={`accordion-content ${openSections.payment ? "open" : "closed"}`}>
            {!isInternational ? (
              <>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>UPI ID</label>
                  <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi or 9876543210@paytm" />
                </div>
                {upiId && (
                  <>
                    <div className="toggle-row" onClick={() => setShowUpiQr(!showUpiQr)}>
                      <div className={`toggle-sw ${showUpiQr ? "on" : ""}`}><div className="toggle-knob"></div></div>
                      <div className="toggle-lbl"><strong>UPI QR Code</strong> — Show scannable QR on invoice</div>
                    </div>
                    {showUpiQr && (
                      <div className="qr-box">
                        <UpiQR upiId={upiId} amount={total} name={businessName} />
                        <div>
                          <h4>Pay instantly via UPI</h4>
                          <p style={{ marginTop: 4 }}>Client scans with PhonePe, GPay, Paytm, or BHIM.</p>
                          <p style={{ marginTop: 6, color: "#8a7840", fontSize: "0.75rem" }}>Pre-filled: {fmt(total)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="divider">Bank Transfer</div>
                <div className="grid-2">
                  <div className="field"><label>Account Holder</label><input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="As per bank records" /></div>
                  <div className="field"><label>Bank Name</label><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" /></div>
                  <div className="field"><label>Account Number</label><input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="XXXX XXXX XXXX" /></div>
                  <div className="field"><label>IFSC Code</label><input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" /></div>
                </div>
              </>
            ) : (
              <>
                <div className="info-box">Fill any method — client sees only what you fill.</div>
                <div className="divider">PayPal</div>
                <div className="field" style={{ marginBottom: 12 }}><label>PayPal Email or Link</label><input value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="you@email.com or paypal.me/yourname" /></div>
                <div className="divider">Wise</div>
                <div className="field" style={{ marginBottom: 12 }}><label>Wise Email or Profile Link</label><input value={wiseEmail} onChange={e => setWiseEmail(e.target.value)} placeholder="you@email.com or wise.com/pay/yourname" /></div>
                <div className="divider">SWIFT / Bank Transfer</div>
                <div className="grid-2">
                  <div className="field"><label>Account Holder</label><input value={intlAccountHolder} onChange={e => setIntlAccountHolder(e.target.value)} placeholder="As per bank" /></div>
                  <div className="field"><label>Bank Name</label><input value={intlBankName} onChange={e => setIntlBankName(e.target.value)} placeholder="e.g. HDFC Bank, Mumbai" /></div>
                  <div className="field"><label>SWIFT / BIC Code</label><input value={swiftCode} onChange={e => setSwiftCode(e.target.value)} placeholder="e.g. HDFCINBB" /></div>
                  <div className="field"><label>IBAN / Account Number</label><input value={ibanNumber} onChange={e => setIbanNumber(e.target.value)} placeholder="e.g. GB29 NWBK..." /></div>
                </div>
              </>
            )}
          </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div
  className="accordion-header"
  onClick={() => toggleSection("notes")}
>
  <div className="section-label" style={{ marginBottom: 0 }}>
    Notes
  </div>

  <div className={`accordion-chevron ${openSections.notes ? "open" : ""}`}>
    ▼
  </div>
</div>

<div className={`accordion-content ${openSections.notes ? "open" : "closed"}`}>
            <div className="field">
              <label>Additional notes or payment terms</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Payment due within 15 days." />
            </div>
          </div>
          </div>

          {/* Footer */}
          <div className="card">
            <div
  className="accordion-header"
  onClick={() => toggleSection("footer")}
>
  <div className="section-label" style={{ marginBottom: 0 }}>
    Invoice Footer
  </div>

  <div className={`accordion-chevron ${openSections.footer ? "open" : ""}`}>
    ▼
  </div>
</div>

<div className={`accordion-content ${openSections.footer ? "open" : "closed"}`}>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Thank you message</label>
              <textarea value={thankYouNote} onChange={e => setThankYouNote(e.target.value)} style={{ minHeight: 56 }} />
            </div>
            <div className="toggle-row" onClick={() => setTermsEnabled(!termsEnabled)}>
              <div className={`toggle-sw ${termsEnabled ? "on" : ""}`}><div className="toggle-knob"></div></div>
              <div className="toggle-lbl"><strong>Terms & Conditions</strong> — Show on invoice</div>
            </div>
            {termsEnabled && (
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Terms & Conditions</label>
                <textarea value={termsText} onChange={e => setTermsText(e.target.value)} style={{ minHeight: 90 }} />
              </div>
            )}
            <div className="toggle-row" onClick={() => setSignatureEnabled(!signatureEnabled)}>
              <div className={`toggle-sw ${signatureEnabled ? "on" : ""}`}><div className="toggle-knob"></div></div>
              <div className="toggle-lbl"><strong>Signature</strong> — Add your signature</div>
            </div>
            {signatureEnabled && (
              <div className="grid-2" style={{ marginTop: 8 }}>
                <div className="field">
                  <label>Signature Image</label>
                  <div className="logo-area" style={{ padding: 12 }} onClick={() => sigInputRef.current.click()}>
                    {signatureImg ? <img src={signatureImg} style={{ height: 40, objectFit: "contain" }} alt="sig" /> : <div className="logo-hint">Click to <span>upload signature</span></div>}
                    <input ref={sigInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSig} />
                  </div>
                </div>
                <div className="field"><label>Name / Designation</label><input value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="e.g. Rahul Sharma, Founder" /></div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* RIGHT — LIVE PREVIEW (desktop) */}
        <div className="preview-col">
          <div className="preview-header no-print">
  <div className="preview-header-title">
    Live Invoice Preview
  </div>

  <div className="preview-header-subtitle">
    Updates automatically as you edit.
  </div>
</div>
          <div className="preview-col-inner">
            <div className="preview-col-header">
              <span><span className="live-dot"></span>Live Preview</span>
              <span style={{ fontSize: "0.68rem", color: "#38383f" }}>Updates as you type</span>
            </div>
            <InvoicePreview {...previewProps} compact={true} />
          </div>
        </div>
      
      {/* MOBILE STICKY ACTION BAR */}
<div className="mobile-action-bar no-print">

  <button
    className="mobile-action secondary"
    onClick={() => setMobilePreviewOpen(true)}
  >
    👁 Preview
  </button>

  <button
    className="mobile-action primary"
    onClick={handleDownloadPDF}
    disabled={pdfLoading}
  >
    {pdfLoading ? "Preparing..." : "⬇ Download"}
  </button>

</div>
      {/* MOBILE MODAL PREVIEW */}
      {mobilePreviewOpen && (
        <div className="modal-overlay" onClick={() => setMobilePreviewOpen(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Invoice Preview</span>
              <button className="modal-close" onClick={() => setMobilePreviewOpen(false)}>×</button>
            </div>
            <InvoicePreview {...previewProps} compact={false} />
          </div>
        </div>
      )}

      {/* PRINT TARGET */}
      {isPrinting && (
        <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999 }}>
          <InvoicePreview {...previewProps} compact={false} />
        </div>
      )}
    </>
  );
}
