import { useState, useRef, useEffect } from "react";

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

// Simple UPI QR using a public QR API
function UpiQR({ upiId, amount, name }) {
  if (!upiId) return null;
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || "Freelancer")}&am=${amount > 0 ? amount.toFixed(2) : ""}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiString)}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <img src={qrUrl} alt="UPI QR" style={{ width: 160, height: 160, borderRadius: 10, border: "2px solid #c9a84c33", background: "#fff", padding: 6 }} />
      <div style={{ fontSize: "0.75rem", color: "#7a7568", textAlign: "center" }}>Scan to pay via any UPI app</div>
      <div style={{ fontSize: "0.78rem", color: "#c9a84c", fontWeight: 600 }}>{upiId}</div>
    </div>
  );
}

export default function InvoiceGenerator() {
  const [tab, setTab] = useState("edit"); // "edit" | "preview"

  // Business
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [logo, setLogo] = useState(null);
  const logoInputRef = useRef();
  const sigInputRef = useRef();

  // Client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Invoice meta
  const [invoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("INR");

  // Items
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: 0 }]);

  // GST
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  // Payment Domestic
  const [upiId, setUpiId] = useState("");
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Payment International
  const [paypalEmail, setPaypalEmail] = useState("");
  const [wiseEmail, setWiseEmail] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [ibanNumber, setIbanNumber] = useState("");
  const [intlBankName, setIntlBankName] = useState("");
  const [intlAccountHolder, setIntlAccountHolder] = useState("");

  // Footer
  const [thankYouNote, setThankYouNote] = useState("Thank you for your business! We appreciate your trust and look forward to working with you again.");
  const [termsEnabled, setTermsEnabled] = useState(true);
  const [termsText, setTermsText] = useState("1. Payment is due within the specified due date.\n2. Late payments may incur a 2% monthly charge.\n3. All work remains property of the freelancer until full payment is received.\n4. Disputes must be raised within 7 days of invoice date.");
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [signatureImg, setSignatureImg] = useState(null);
  const [signatureName, setSignatureName] = useState("");

  const [notes, setNotes] = useState("");

  // Share
  const [shareToast, setShareToast] = useState(false);

  const cur = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const isInternational = currency !== "INR";

  const addItem = () => setItems([...items, { id: Date.now(), description: "", quantity: 1, rate: 0 }]);
  const removeItem = (id) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };
  const updateItem = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.rate), 0);
  const gstAmount = (!isInternational && gstEnabled) ? (subtotal * gstRate) / 100 : 0;
  const total = subtotal + gstAmount;

  const fmt = (n) => cur.symbol + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

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

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; color: #e8e4dc; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .app { max-width: 960px; margin: 0 auto; padding: 40px 20px 60px; }
        .header { text-align: center; margin-bottom: 36px; }
        .header h1 { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: #f0ebe0; letter-spacing: -0.02em; }
        .header p { color: #7a7568; font-size: 0.85rem; margin-top: 6px; font-weight: 300; letter-spacing: 0.08em; text-transform: uppercase; }
        .gold { color: #c9a84c; }

        /* Top action bar */
        .action-bar { display: flex; gap: 10px; margin-bottom: 24px; align-items: center; }
        .tab-btn { padding: 10px 22px; border-radius: 8px; border: 1px solid #1e1e2a; background: #0d0d14; color: #7a7568; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-weight: 500; }
        .tab-btn.active { border-color: #c9a84c; color: #c9a84c; background: #c9a84c11; }
        .share-btn { margin-left: auto; padding: 10px 20px; border-radius: 8px; border: 1px solid #2a2a38; background: #0d0d14; color: #b8b0a0; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 7px; }
        .share-btn:hover { border-color: #c9a84c55; color: #c9a84c; }
        .print-btn-top { padding: 10px 20px; border-radius: 8px; border: none; background: linear-gradient(135deg, #c9a84c, #a8872e); color: #0a0a0f; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .print-btn-top:hover { opacity: 0.88; transform: translateY(-1px); }

        /* Toast */
        .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #1e1e2a; border: 1px solid #c9a84c44; color: #c9a84c; padding: 12px 24px; border-radius: 10px; font-size: 0.85rem; z-index: 999; animation: fadeup 0.3s ease; }
        @keyframes fadeup { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        .card { background: #111118; border: 1px solid #1e1e2a; border-radius: 12px; padding: 28px; margin-bottom: 20px; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: #c9a84c; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .card-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(to right, #c9a84c33, transparent); }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 0.72rem; color: #5a5650; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; }
        input, textarea, select { background: #0d0d14; border: 1px solid #1e1e2a; border-radius: 8px; padding: 10px 14px; color: #e8e4dc; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; outline: none; transition: border-color 0.2s; width: 100%; }
        input:focus, textarea:focus, select:focus { border-color: #c9a84c55; box-shadow: 0 0 0 3px #c9a84c0d; }
        textarea { resize: vertical; min-height: 80px; }
        select option { background: #111118; }

        .logo-upload-area { border: 1.5px dashed #2a2a38; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: #0d0d14; }
        .logo-upload-area:hover { border-color: #c9a84c55; background: #c9a84c06; }
        .logo-preview { width: 90px; height: 90px; object-fit: contain; border-radius: 8px; margin-bottom: 8px; }
        .logo-hint { font-size: 0.78rem; color: #5a5650; }
        .logo-hint span { color: #c9a84c; }

        .currency-badge { display: inline-flex; align-items: center; gap: 6px; background: #c9a84c15; border: 1px solid #c9a84c33; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; color: #c9a84c; font-weight: 500; margin-left: 10px; }

        .items-header { display: grid; grid-template-columns: 3fr 1fr 1.4fr 1fr 36px; gap: 10px; padding: 0 4px 10px; border-bottom: 1px solid #1e1e2a; margin-bottom: 12px; }
        .items-header span { font-size: 0.68rem; color: #5a5650; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; }
        .item-row { display: grid; grid-template-columns: 3fr 1fr 1.4fr 1fr 36px; gap: 10px; align-items: center; margin-bottom: 10px; }
        .item-amount { color: #c9a84c; font-size: 0.88rem; font-weight: 500; text-align: right; padding-right: 4px; }
        .btn-remove { background: none; border: 1px solid #1e1e2a; border-radius: 6px; color: #444; width: 36px; height: 38px; cursor: pointer; font-size: 1rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-remove:hover { border-color: #8b3a3a; color: #e05555; background: #8b3a3a11; }
        .btn-add { background: none; border: 1px dashed #2a2a38; border-radius: 8px; color: #5a5650; padding: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; width: 100%; margin-top: 8px; transition: all 0.2s; }
        .btn-add:hover { border-color: #c9a84c55; color: #c9a84c; background: #c9a84c08; }

        .toggle-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: #0d0d14; border: 1px solid #1e1e2a; border-radius: 8px; cursor: pointer; transition: border-color 0.2s; margin-bottom: 12px; }
        .toggle-row:hover { border-color: #c9a84c44; }
        .toggle-switch { width: 44px; height: 24px; background: #1e1e2a; border-radius: 12px; position: relative; transition: background 0.3s; flex-shrink: 0; }
        .toggle-switch.on { background: #c9a84c; }
        .toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: transform 0.3s; box-shadow: 0 1px 4px #0005; }
        .toggle-switch.on .toggle-knob { transform: translateX(20px); }
        .toggle-label { font-size: 0.85rem; color: #8a8478; }
        .toggle-label span { color: #e8e4dc; font-weight: 500; }

        .section-divider { font-size: 0.7rem; color: #3a3a48; text-transform: uppercase; letter-spacing: 0.12em; margin: 16px 0 14px; display: flex; align-items: center; gap: 10px; }
        .section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: #1e1e2a; }

        .totals { margin-top: 20px; border-top: 1px solid #1e1e2a; padding-top: 16px; }
        .totals-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.88rem; color: #7a7568; }
        .totals-row.total { font-size: 1.1rem; font-weight: 600; color: #f0ebe0; border-top: 1px solid #1e1e2a; margin-top: 8px; padding-top: 14px; }
        .totals-row.total .amount { color: #c9a84c; font-family: 'Playfair Display', serif; font-size: 1.2rem; }
        .totals-row .amount { color: #b8b0a0; }

        .info-box { background: #0d0d14; border: 1px solid #1e1e2a; border-left: 3px solid #c9a84c; border-radius: 8px; padding: 12px 16px; font-size: 0.8rem; color: #7a7568; margin-bottom: 16px; line-height: 1.6; }
        .info-box strong { color: #c9a84c; }

        /* UPI QR box */
        .qr-box { background: #0d0d14; border: 1px solid #c9a84c22; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 24px; margin-top: 16px; }
        .qr-box-text h4 { font-family: 'Playfair Display', serif; color: #f0ebe0; font-size: 1rem; margin-bottom: 6px; }
        .qr-box-text p { font-size: 0.8rem; color: #7a7568; line-height: 1.5; }

        /* ── PREVIEW ── */
        .preview-wrap { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 48px #0008; }
        .pv { padding: 48px; font-family: 'DM Sans', sans-serif; color: #1a1a1a; background: #fff; }
        .pv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #f0f0f0; }
        .pv-logo { width: 80px; height: 80px; object-fit: contain; }
        .pv-biz-name { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #1a1a1a; }
        .pv-biz-meta { font-size: 0.78rem; color: #888; margin-top: 4px; line-height: 1.7; }
        .pv-invoice-label { text-align: right; }
        .pv-invoice-label h2 { font-family: 'Playfair Display', serif; font-size: 2rem; color: #c9a84c; font-weight: 700; letter-spacing: -0.02em; }
        .pv-invoice-label p { font-size: 0.78rem; color: #aaa; margin-top: 4px; }
        .pv-invoice-label strong { color: #555; }
        .pv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; }
        .pv-party-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a84c; font-weight: 600; margin-bottom: 6px; }
        .pv-party-name { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 3px; }
        .pv-party-meta { font-size: 0.78rem; color: #888; line-height: 1.6; }
        .pv-dates { display: flex; gap: 32px; background: #fafafa; border-radius: 8px; padding: 14px 20px; margin-bottom: 32px; }
        .pv-date-item label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; display: block; margin-bottom: 3px; }
        .pv-date-item span { font-size: 0.9rem; font-weight: 600; color: #333; }
        .pv-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .pv-table th { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; font-weight: 600; padding: 10px 12px; background: #fafafa; border-bottom: 2px solid #f0f0f0; }
        .pv-table td { padding: 12px; font-size: 0.88rem; color: #333; border-bottom: 1px solid #f5f5f5; }
        .pv-table tr:last-child td { border-bottom: none; }
        .pv-table .amt { text-align: right; font-weight: 500; color: #1a1a1a; }
        .pv-totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .pv-totals-box { width: 280px; }
        .pv-totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.85rem; color: #888; border-bottom: 1px solid #f5f5f5; }
        .pv-totals-row.pv-total { font-size: 1rem; font-weight: 700; color: #1a1a1a; border-bottom: none; border-top: 2px solid #f0f0f0; padding-top: 12px; margin-top: 4px; }
        .pv-totals-row.pv-total .pv-amt { color: #c9a84c; font-family: 'Playfair Display', serif; font-size: 1.15rem; }
        .pv-amt { font-weight: 500; color: #333; }

        /* Payment in preview */
        .pv-payment { display: flex; gap: 32px; background: #fafafa; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px; align-items: flex-start; }
        .pv-payment-section { flex: 1; }
        .pv-payment-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a84c; font-weight: 600; margin-bottom: 8px; }
        .pv-payment-row { font-size: 0.8rem; color: #555; line-height: 1.8; }
        .pv-payment-row strong { color: #333; }

        /* Notes in preview */
        .pv-notes { background: #fffbf0; border-left: 3px solid #c9a84c; border-radius: 6px; padding: 14px 18px; font-size: 0.82rem; color: #666; line-height: 1.7; margin-bottom: 28px; }

        /* Footer in preview */
        .pv-footer { border-top: 2px solid #f0f0f0; padding-top: 28px; }
        .pv-thankyou { text-align: center; font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #c9a84c; margin-bottom: 20px; font-style: italic; }
        .pv-signature { display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 20px; }
        .pv-signature img { height: 56px; object-fit: contain; margin-bottom: 4px; }
        .pv-signature-line { width: 180px; border-bottom: 1.5px solid #ccc; margin-bottom: 6px; }
        .pv-signature-name { font-size: 0.78rem; color: #888; text-align: right; }
        .pv-terms { background: #fafafa; border-radius: 8px; padding: 16px 20px; }
        .pv-terms-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a84c; font-weight: 600; margin-bottom: 8px; }
        .pv-terms-text { font-size: 0.75rem; color: #999; line-height: 1.8; white-space: pre-line; }
        .pv-footer-bar { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0; font-size: 0.7rem; color: #ccc; letter-spacing: 0.06em; }

        @media (max-width: 640px) {
          .grid-2, .grid-3 { grid-template-columns: 1fr; }
          .items-header { display: none; }
          .item-row { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
          .item-row input:first-child { grid-column: 1 / -1; }
          .pv { padding: 24px; }
          .pv-header, .pv-parties { flex-direction: column; grid-template-columns: 1fr; }
          .pv-payment { flex-direction: column; }
          .action-bar { flex-wrap: wrap; }
          .qr-box { flex-direction: column; }
        }

        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .preview-wrap { box-shadow: none !important; border-radius: 0 !important; }
          .pv { padding: 32px !important; }
        }
      `}</style>

      <div className="app">
        <div className="header no-print">
          <h1>Invoice <span className="gold">Generator</span></h1>
          <p>Professional Invoicing for Freelancers & Businesses</p>
        </div>

        {/* Action Bar */}
        <div className="action-bar no-print">
          <button className={`tab-btn ${tab === "edit" ? "active" : ""}`} onClick={() => setTab("edit")}>✏️ Edit</button>
          <button className={`tab-btn ${tab === "preview" ? "active" : ""}`} onClick={() => setTab("preview")}>👁 Preview</button>
          <button className="share-btn" onClick={handleShare}>🔗 Share Invoice</button>
          <button className="print-btn-top" onClick={() => { setTab("preview"); setTimeout(() => window.print(), 300); }}>⬇ Download PDF</button>
        </div>

        {shareToast && <div className="toast">✅ Invoice link copied to clipboard!</div>}

        {/* ══ EDIT MODE ══ */}
        {tab === "edit" && (
          <>
            {/* Business Info */}
            <div className="card">
              <div className="card-title">Your Business</div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Business Logo</label>
                  <div className="logo-upload-area" onClick={() => logoInputRef.current.click()}>
                    {logo ? <><img src={logo} className="logo-preview" alt="logo" /><div className="logo-hint">Click to <span>change logo</span></div></> : <><div style={{ fontSize: "2rem", marginBottom: 8 }}>🖼️</div><div className="logo-hint">Click to <span>upload your logo</span> — PNG, JPG</div></>}
                    <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
                  </div>
                </div>
                <div className="field"><label>Business / Your Name</label><input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Rahul Design Studio" /></div>
                <div className="field"><label>Email</label><input value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="you@example.com" type="email" /></div>
                <div className="field"><label>Phone</label><input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
                <div className="field"><label>GST Number (optional)</label><input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" /></div>
                <div className="field" style={{ gridColumn: "1 / -1" }}><label>Address</label><input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="City, State, PIN" /></div>
              </div>
            </div>

            {/* Client */}
            <div className="card">
              <div className="card-title">Bill To (Client)</div>
              <div className="grid-3">
                <div className="field"><label>Client Name</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client / Company" /></div>
                <div className="field"><label>Client Email</label><input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@example.com" type="email" /></div>
                <div className="field"><label>Client Address / Country</label><input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="City, Country" /></div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="card">
              <div className="card-title">Invoice Details</div>
              <div className="grid-3">
                <div className="field"><label>Invoice Number</label><input value={invoiceNumber} readOnly style={{ opacity: 0.6 }} /></div>
                <div className="field"><label>Invoice Date</label><input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
                <div className="field"><label>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              </div>
              <div className="field" style={{ marginTop: 16, maxWidth: 280 }}>
                <label>Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              {isInternational && <div className="info-box" style={{ marginTop: 14 }}><strong>International Invoice</strong> — Currency set to {cur.code}. GST auto-disabled. Add international payment details below.</div>}
            </div>

            {/* Items */}
            <div className="card">
              <div className="card-title">Services / Items <span className="currency-badge">{cur.symbol} {cur.code}</span></div>
              <div className="items-header">
                <span>Description</span><span>Qty</span><span>Rate ({cur.symbol})</span><span style={{ textAlign: "right" }}>Amount</span><span></span>
              </div>
              {items.map(item => (
                <div className="item-row" key={item.id}>
                  <input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="e.g. Logo Design, Web Development..." />
                  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", e.target.value)} />
                  <input type="number" min="0" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} placeholder="0" />
                  <div className="item-amount">{cur.symbol}{(Number(item.quantity) * Number(item.rate)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                  <button className="btn-remove" onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
              <button className="btn-add" onClick={addItem}>+ Add Item</button>
              {!isInternational && (
                <div style={{ marginTop: 24 }}>
                  <div className="toggle-row" onClick={() => setGstEnabled(!gstEnabled)}>
                    <div className={`toggle-switch ${gstEnabled ? "on" : ""}`}><div className="toggle-knob"></div></div>
                    <div className="toggle-label"><span>GST</span> — Enable for GST registered businesses</div>
                  </div>
                  {gstEnabled && <div className="field" style={{ maxWidth: 200 }}><label>GST Rate (%)</label><select value={gstRate} onChange={e => setGstRate(Number(e.target.value))}><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option></select></div>}
                </div>
              )}
              <div className="totals">
                <div className="totals-row"><span>Subtotal</span><span className="amount">{fmt(subtotal)}</span></div>
                {!isInternational && gstEnabled && <>
                  <div className="totals-row"><span>CGST ({gstRate / 2}%)</span><span className="amount">{fmt(gstAmount / 2)}</span></div>
                  <div className="totals-row"><span>SGST ({gstRate / 2}%)</span><span className="amount">{fmt(gstAmount / 2)}</span></div>
                </>}
                <div className="totals-row total"><span>Total Amount</span><span className="amount">{fmt(total)}</span></div>
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <div className="card-title">Payment Details</div>
              {!isInternational ? (
                <>
                  <div className="field" style={{ marginBottom: 12 }}><label>UPI ID</label><input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi  /  9876543210@paytm" /></div>
                  {upiId && (
                    <>
                      <div className="toggle-row" onClick={() => setShowUpiQr(!showUpiQr)}>
                        <div className={`toggle-switch ${showUpiQr ? "on" : ""}`}><div className="toggle-knob"></div></div>
                        <div className="toggle-label"><span>UPI QR Code</span> — Show scannable QR on invoice</div>
                      </div>
                      {showUpiQr && (
                        <div className="qr-box">
                          <UpiQR upiId={upiId} amount={total} name={businessName} />
                          <div className="qr-box-text">
                            <h4>Pay Instantly via UPI</h4>
                            <p>Client can scan this QR using any UPI app — PhonePe, GPay, Paytm, BHIM, etc.</p>
                            <p style={{ marginTop: 8, color: "#c9a84c", fontSize: "0.8rem" }}>Amount pre-filled: {fmt(total)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="section-divider">or bank transfer</div>
                  <div className="grid-2">
                    <div className="field"><label>Account Holder</label><input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="As per bank records" /></div>
                    <div className="field"><label>Bank Name</label><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" /></div>
                    <div className="field"><label>Account Number</label><input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="XXXX XXXX XXXX" /></div>
                    <div className="field"><label>IFSC Code</label><input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-box">Fill in any payment method — client will see only what you fill.</div>
                  <div className="section-divider">PayPal</div>
                  <div className="field" style={{ marginBottom: 16 }}><label>PayPal Email / PayPal.me Link</label><input value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="you@email.com  or  paypal.me/yourname" /></div>
                  <div className="section-divider">Wise</div>
                  <div className="field" style={{ marginBottom: 16 }}><label>Wise Email / Profile Link</label><input value={wiseEmail} onChange={e => setWiseEmail(e.target.value)} placeholder="you@email.com  or  wise.com/pay/yourname" /></div>
                  <div className="section-divider">SWIFT / IBAN Bank Transfer</div>
                  <div className="grid-2">
                    <div className="field"><label>Account Holder</label><input value={intlAccountHolder} onChange={e => setIntlAccountHolder(e.target.value)} placeholder="As per bank" /></div>
                    <div className="field"><label>Bank Name</label><input value={intlBankName} onChange={e => setIntlBankName(e.target.value)} placeholder="e.g. HDFC Bank, Mumbai" /></div>
                    <div className="field"><label>SWIFT / BIC Code</label><input value={swiftCode} onChange={e => setSwiftCode(e.target.value)} placeholder="e.g. HDFCINBB" /></div>
                    <div className="field"><label>IBAN / Account Number</label><input value={ibanNumber} onChange={e => setIbanNumber(e.target.value)} placeholder="e.g. GB29 NWBK..." /></div>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="card">
              <div className="card-title">Notes</div>
              <div className="field"><label>Additional Notes / Payment Terms</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Payment due within 15 days." /></div>
            </div>

            {/* Footer */}
            <div className="card">
              <div className="card-title">Professional Footer</div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Thank You Note</label>
                <textarea value={thankYouNote} onChange={e => setThankYouNote(e.target.value)} style={{ minHeight: 60 }} />
              </div>
              <div className="toggle-row" onClick={() => setTermsEnabled(!termsEnabled)}>
                <div className={`toggle-switch ${termsEnabled ? "on" : ""}`}><div className="toggle-knob"></div></div>
                <div className="toggle-label"><span>Terms & Conditions</span> — Show on invoice</div>
              </div>
              {termsEnabled && <div className="field" style={{ marginBottom: 16 }}><label>Terms & Conditions</label><textarea value={termsText} onChange={e => setTermsText(e.target.value)} style={{ minHeight: 100 }} /></div>}
              <div className="toggle-row" onClick={() => setSignatureEnabled(!signatureEnabled)}>
                <div className={`toggle-switch ${signatureEnabled ? "on" : ""}`}><div className="toggle-knob"></div></div>
                <div className="toggle-label"><span>Signature</span> — Add your signature to invoice</div>
              </div>
              {signatureEnabled && (
                <div className="grid-2" style={{ marginTop: 4 }}>
                  <div className="field">
                    <label>Upload Signature Image</label>
                    <div className="logo-upload-area" style={{ padding: 14 }} onClick={() => sigInputRef.current.click()}>
                      {signatureImg ? <img src={signatureImg} style={{ height: 48, objectFit: "contain" }} alt="sig" /> : <div className="logo-hint">Click to <span>upload signature</span></div>}
                      <input ref={sigInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSig} />
                    </div>
                  </div>
                  <div className="field"><label>Signatory Name / Designation</label><input value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="e.g. Rahul Sharma, Founder" /></div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ PREVIEW MODE ══ */}
        {tab === "preview" && (
          <div className="preview-wrap">
            <div className="pv">
              {/* Header */}
              <div className="pv-header">
                <div>
                  {logo && <img src={logo} className="pv-logo" alt="logo" style={{ marginBottom: 10 }} />}
                  <div className="pv-biz-name">{businessName || "Your Business Name"}</div>
                  <div className="pv-biz-meta">
                    {businessEmail && <>{businessEmail}<br /></>}
                    {businessPhone && <>{businessPhone}<br /></>}
                    {businessAddress && <>{businessAddress}<br /></>}
                    {gstNumber && <>GST: {gstNumber}</>}
                  </div>
                </div>
                <div className="pv-invoice-label">
                  <h2>INVOICE</h2>
                  <p><strong>#{invoiceNumber}</strong></p>
                </div>
              </div>

              {/* Parties */}
              <div className="pv-parties">
                <div>
                  <div className="pv-party-label">Bill To</div>
                  <div className="pv-party-name">{clientName || "Client Name"}</div>
                  <div className="pv-party-meta">{clientEmail && <>{clientEmail}<br /></>}{clientAddress}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="pv-party-label">Invoice Details</div>
                  <div className="pv-party-meta">
                    <strong>Date:</strong> {formatDate(invoiceDate)}<br />
                    {dueDate && <><strong>Due:</strong> {formatDate(dueDate)}<br /></>}
                    <strong>Currency:</strong> {cur.code}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="pv-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Description</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Rate</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.description).map(item => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td className="amt">{fmt(item.rate)}</td>
                      <td className="amt">{fmt(Number(item.quantity) * Number(item.rate))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="pv-totals">
                <div className="pv-totals-box">
                  <div className="pv-totals-row"><span>Subtotal</span><span className="pv-amt">{fmt(subtotal)}</span></div>
                  {!isInternational && gstEnabled && <>
                    <div className="pv-totals-row"><span>CGST ({gstRate / 2}%)</span><span className="pv-amt">{fmt(gstAmount / 2)}</span></div>
                    <div className="pv-totals-row"><span>SGST ({gstRate / 2}%)</span><span className="pv-amt">{fmt(gstAmount / 2)}</span></div>
                  </>}
                  <div className="pv-totals-row pv-total"><span>Total</span><span className="pv-amt">{fmt(total)}</span></div>
                </div>
              </div>

              {/* Payment */}
              <div className="pv-payment">
                {!isInternational ? (
                  <>
                    {upiId && (
                      <div className="pv-payment-section">
                        <div className="pv-payment-label">UPI Payment</div>
                        {showUpiQr && <div style={{ marginBottom: 10 }}><UpiQR upiId={upiId} amount={total} name={businessName} /></div>}
                        <div className="pv-payment-row"><strong>UPI ID:</strong> {upiId}</div>
                      </div>
                    )}
                    {(accountHolder || bankName || accountNumber || ifsc) && (
                      <div className="pv-payment-section">
                        <div className="pv-payment-label">Bank Transfer</div>
                        <div className="pv-payment-row">
                          {accountHolder && <><strong>Name:</strong> {accountHolder}<br /></>}
                          {bankName && <><strong>Bank:</strong> {bankName}<br /></>}
                          {accountNumber && <><strong>Account:</strong> {accountNumber}<br /></>}
                          {ifsc && <><strong>IFSC:</strong> {ifsc}</>}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {paypalEmail && <div className="pv-payment-section"><div className="pv-payment-label">PayPal</div><div className="pv-payment-row"><strong>PayPal:</strong> {paypalEmail}</div></div>}
                    {wiseEmail && <div className="pv-payment-section"><div className="pv-payment-label">Wise</div><div className="pv-payment-row"><strong>Wise:</strong> {wiseEmail}</div></div>}
                    {(swiftCode || ibanNumber) && (
                      <div className="pv-payment-section">
                        <div className="pv-payment-label">Bank Transfer</div>
                        <div className="pv-payment-row">
                          {intlAccountHolder && <><strong>Name:</strong> {intlAccountHolder}<br /></>}
                          {intlBankName && <><strong>Bank:</strong> {intlBankName}<br /></>}
                          {swiftCode && <><strong>SWIFT:</strong> {swiftCode}<br /></>}
                          {ibanNumber && <><strong>IBAN:</strong> {ibanNumber}</>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Notes */}
              {notes && <div className="pv-notes">📝 {notes}</div>}

              {/* Footer */}
              <div className="pv-footer">
                {thankYouNote && <div className="pv-thankyou">"{thankYouNote}"</div>}
                {signatureEnabled && (
                  <div className="pv-signature">
                    {signatureImg && <img src={signatureImg} alt="signature" />}
                    <div className="pv-signature-line"></div>
                    <div className="pv-signature-name">{signatureName || "Authorized Signatory"}</div>
                  </div>
                )}
                {termsEnabled && termsText && (
                  <div className="pv-terms">
                    <div className="pv-terms-label">Terms & Conditions</div>
                    <div className="pv-terms-text">{termsText}</div>
                  </div>
                )}
                <div className="pv-footer-bar">{businessName || "Your Business"} · {invoiceNumber} · Generated with Invoice Generator</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}