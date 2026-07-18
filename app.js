const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE = {
  types: 'axonSmartWaiverTypesV2',
  records: 'axonSmartWaiverRecordsV2',
  recipient: 'axonSmartNotifyRecipientV2'
};
const ASSETS = {
  logoBlue: 'assets/axon-performance-blue.png',
  insigniaBlue: 'assets/axon-insignia-blue.png'
};

const DEFAULT_SIGNATURE = {
  initialsInstruction: 'Draw initials once, then apply them to every required section.',
  initialsTitle: 'SET YOUR INITIALS',
  initialsHelp: 'Use your finger or Apple Pencil. Initials are recorded as black ink.',
  consentText: 'I agree this serves as my electronic signature.',
  consentDescription: 'By continuing, I confirm I reviewed the agreement, applied initials beside each acknowledgement, and agree to the terms in this contract.',
  typedLabel: 'Typed signature',
  typedPlaceholder: 'Type full legal name',
  dateLabel: 'Signature date',
  drawnLabel: 'SIGN HERE',
  submitText: 'SIGN & SUBMIT',
  pdfTitle: 'DIGITAL CONTRACT'
};

const DEFAULT_SECTIONS = [
  { id: 'risk', title: 'Assumption of Risk', text: 'I understand exercise, facility use, equipment use, and wellness services can involve injury or medical complications. I voluntarily assume those risks.', initialsRequired: true },
  { id: 'release', title: 'Release of Liability', text: 'I release the facility, owners, staff, coaches, and affiliates from liability for injuries, damages, or losses related to my participation, to the fullest extent permitted by law.', initialsRequired: true },
  { id: 'conduct', title: 'Facility Conduct', text: 'I agree to follow facility rules, staff instructions, safety guidelines, and standards of conduct.', initialsRequired: true },
  { id: 'medical', title: 'Physical & Medical Responsibilities', text: 'I confirm that I am physically and medically able to participate, and I am responsible for consulting a healthcare provider if I have concerns or medical conditions.', initialsRequired: true }
];

const DEFAULT_TYPES = {
  'Waiver & Liability': {
    badge: 'NEW MEMBER',
    description: 'Core facility waiver with initials, signature, and date only.',
    short: 'New member agreement',
    theme: 'blue',
    fields: [field('fullName', 'Full Legal Name', 'text', 'Enter full legal name', true)],
    sections: clone(DEFAULT_SECTIONS),
    signature: clone(DEFAULT_SIGNATURE)
  },
  'Day Pass Waiver': {
    badge: 'DAY PASS',
    description: 'Single-visit waiver with concise guest information.',
    short: 'Day pass visitor agreement',
    theme: 'amber',
    fields: [field('fullName', 'Full Legal Name', 'text', 'Enter full legal name', true), field('phone', 'Phone', 'tel', '(555) 555-5555', true), field('email', 'Email', 'email', 'you@example.com', true)],
    sections: clone(DEFAULT_SECTIONS),
    signature: clone(DEFAULT_SIGNATURE)
  },
  'Gym Tour': {
    badge: 'VISITOR',
    description: 'Condensed visitor waiver and facility tour check-in.',
    short: 'Tour visitor agreement',
    theme: 'teal',
    fields: [field('fullName', 'Full Legal Name', 'text', 'Enter full legal name', true), field('phone', 'Phone', 'tel', '(555) 555-5555', true), field('email', 'Email', 'email', 'you@example.com', true), field('homeCity', 'Home City', 'text', 'City', false), field('homeState', 'State', 'text', 'State', false)],
    sections: clone(DEFAULT_SECTIONS),
    signature: clone(DEFAULT_SIGNATURE)
  },
  'Client Waiver': {
    badge: 'CLIENT',
    description: 'Expanded training, performance, and service client agreement.',
    short: 'Client training agreement',
    theme: 'violet',
    fields: [field('fullName', 'Full Legal Name', 'text', 'Enter full legal name', true), field('phone', 'Phone', 'tel', '(555) 555-5555', true), field('email', 'Email', 'email', 'you@example.com', true), field('dob', 'Date of Birth', 'date', '', true), field('emergencyContact', 'Emergency Contact', 'text', 'Name & phone number', true), field('notes', 'Client Notes', 'textarea', 'Optional goals, restrictions, or relevant notes', false)],
    sections: clone(DEFAULT_SECTIONS),
    signature: clone(DEFAULT_SIGNATURE)
  }
};

function field(id, label, type, placeholder, required) { return { id, label, type, placeholder, required: Boolean(required) }; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function uid(prefix = 'id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function textSafe(value) { return String(value ?? '').replace(/\r?\n/g, ' ').trim(); }
function safeId(label) { return String(label || 'field').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).map((part, index) => index ? part[0].toUpperCase() + part.slice(1) : part).join('') || 'field'; }
function dialog(dialog, open) { if (open) { if (!dialog.open) dialog.showModal(); } else if (dialog.open) dialog.close(); }

function normalizeField(item) {
  if (Array.isArray(item)) return field(item[0], item[1], item[2], item[3], item[4]);
  return { id: item.id || safeId(item.label), label: item.label || 'Field', type: ['text','email','tel','date','textarea'].includes(item.type) ? item.type : 'text', placeholder: item.placeholder || '', required: Boolean(item.required) };
}
function normalizeSection(item, index) {
  if (Array.isArray(item)) return { id: `section-${index}`, title: item[0], text: item[1], initialsRequired: true };
  return { id: item.id || `section-${index}`, title: item.title || 'Agreement section', text: item.text || '', initialsRequired: item.initialsRequired !== false };
}
function normalizeType(config, legacySections = DEFAULT_SECTIONS) {
  const source = config || {};
  return {
    badge: source.badge || 'WAIVER',
    description: source.description || 'Digital agreement pathway.',
    short: source.short || source.description || 'Digital agreement',
    theme: ['blue','amber','teal','violet','coral'].includes(source.theme) ? source.theme : 'blue',
    fields: (source.fields || []).map(normalizeField),
    sections: (source.sections || legacySections || DEFAULT_SECTIONS).map(normalizeSection),
    signature: { ...clone(DEFAULT_SIGNATURE), ...(source.signature || {}) }
  };
}
function loadTypes() {
  const stored = JSON.parse(localStorage.getItem(STORAGE.types) || 'null');
  if (stored) return Object.fromEntries(Object.entries(stored).map(([name, cfg]) => [name, normalizeType(cfg)]));
  const legacy = JSON.parse(localStorage.getItem('axonWaiverTypes') || 'null');
  const legacySections = JSON.parse(localStorage.getItem('axonWaiverSections') || 'null') || DEFAULT_SECTIONS;
  const base = legacy || DEFAULT_TYPES;
  const normalized = Object.fromEntries(Object.entries(base).map(([name, cfg]) => [name, normalizeType(cfg, legacySections)]));
  localStorage.setItem(STORAGE.types, JSON.stringify(normalized));
  return normalized;
}

let waiverTypes = loadTypes();
let records = JSON.parse(localStorage.getItem(STORAGE.records) || localStorage.getItem('axonWaiverRecords') || '[]');
let recipient = localStorage.getItem(STORAGE.recipient) || localStorage.getItem('axonNotifyRecipient') || '';
let selectedType = Object.keys(waiverTypes)[0];
let editorTypeName = selectedType;
let activeTab = 'overview';
let initialsData = '';
let signatureData = '';
let latestRecord = null;

function persist() {
  localStorage.setItem(STORAGE.types, JSON.stringify(waiverTypes));
  localStorage.setItem(STORAGE.records, JSON.stringify(records));
  localStorage.setItem(STORAGE.recipient, recipient);
}
function currentConfig() { return waiverTypes[selectedType]; }
function colorForTheme(theme) { return ({ blue:'#57c9f1', amber:'#ffc766', teal:'#58d7c2', violet:'#c493f4', coral:'#ff8d86' }[theme] || '#57c9f1'); }
function displayTitle(value) { return escapeHtml(value).replace(/\s+&\s+/g, ' &<br>').replace(/\s+/g, '<br>'); }

// Kiosk carousel
function renderTiles() {
  const root = $('#serviceTiles');
  const entries = Object.entries(waiverTypes);
  root.innerHTML = entries.map(([name, cfg], index) => `
    <button class="service-card theme-${escapeHtml(cfg.theme)}" type="button" role="listitem" data-type="${escapeHtml(name)}" aria-label="Open ${escapeHtml(name)}">
      <span class="tile-number">${String(index + 1).padStart(2, '0')}</span>
      <img class="tile-icon" src="${ASSETS.insigniaBlue}" alt="" />
      <b>${displayTitle(name)}</b><small>${escapeHtml(cfg.badge)}</small><p>${escapeHtml(cfg.description)}</p><em>→</em>
    </button>`).join('');
  $$('.service-card', root).forEach(button => button.addEventListener('click', () => openContract(button.dataset.type)));
  updateCarouselCount();
}
function updateCarouselCount() {
  const carousel = $('#serviceTiles'); const cards = $$('.service-card', carousel); if (!cards.length) return;
  const left = carousel.getBoundingClientRect().left;
  let closest = 0; let best = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => { const delta = Math.abs(card.getBoundingClientRect().left - left); if (delta < best) { best = delta; closest = index; } });
  $('#tileCounter').textContent = `${closest + 1} / ${cards.length}`;
}
function scrollCarousel(direction) { const card = $('.service-card', $('#serviceTiles')); if (card) $('#serviceTiles').scrollBy({ left: direction * (card.offsetWidth + 18), behavior: 'smooth' }); }
$('#tilePrev').addEventListener('click', () => scrollCarousel(-1));
$('#tileNext').addEventListener('click', () => scrollCarousel(1));
$('#serviceTiles').addEventListener('scroll', () => requestAnimationFrame(updateCarouselCount), { passive: true });

// Contract rendering
function renderContract(config) {
  $('#contractModalTitle').textContent = selectedType.toUpperCase();
  $('#contractModalSub').textContent = config.short;
  $('#paperContractTitle').textContent = selectedType.toUpperCase();
  $('#paperContractDescription').textContent = config.short;
  $('#contractBadge').textContent = config.badge;
  $('#contractDateStamp').textContent = new Date().toLocaleDateString();
  $('#signerInstruction').textContent = 'Complete the fields required for this agreement.';
  $('#initialInstruction').textContent = config.signature.initialsInstruction;
  $('#initialPadTitle').textContent = config.signature.initialsTitle;
  $('#initialPadHelp').textContent = config.signature.initialsHelp;
  $('#consentText').textContent = config.signature.consentText;
  $('#consentDescription').textContent = config.signature.consentDescription;
  $('#typedSignatureField').childNodes[0].nodeValue = config.signature.typedLabel;
  $('#typedSignatureField input').placeholder = config.signature.typedPlaceholder;
  $('#signatureDateField').childNodes[0].nodeValue = config.signature.dateLabel;
  $('#drawnSignatureLabel').textContent = config.signature.drawnLabel;
  $('#submitText').textContent = config.signature.submitText;
  $('#formFields').innerHTML = config.fields.map(item => item.type === 'textarea'
    ? `<label>${escapeHtml(item.label)}<textarea name="${escapeHtml(item.id)}" placeholder="${escapeHtml(item.placeholder)}" ${item.required ? 'required' : ''}></textarea></label>`
    : `<label>${escapeHtml(item.label)}<input name="${escapeHtml(item.id)}" type="${escapeHtml(item.type)}" placeholder="${escapeHtml(item.placeholder)}" ${item.required ? 'required' : ''} /></label>`).join('');
  $('#signatureDateField input').value = today();
  $('#waiverSections').innerHTML = config.sections.map((section, index) => `
    <article class="term-row" data-term="${index}">
      <div><b>${escapeHtml(section.title)}</b><p>${escapeHtml(section.text)}</p></div>
      <div class="initial-area">
        <div class="initial-slot" data-slot="${index}">${section.initialsRequired ? 'INITIALS' : 'NOT REQUIRED'}</div>
        ${section.initialsRequired ? `<button class="apply-initials" type="button" data-apply="${index}">APPLY INITIALS</button>` : ''}
      </div>
    </article>`).join('');
  $$('[data-apply]').forEach(button => button.addEventListener('click', () => applyInitials(Number(button.dataset.apply))));
}
function openContract(type) {
  selectedType = type;
  initialsData = ''; signatureData = '';
  initialsPad.clear(); signaturePad.clear();
  renderContract(currentConfig());
  dialog($('#contractDialog'), true);
  setTimeout(() => { initialsPad.resize(); signaturePad.resize(); }, 100);
}
$('#closeContract').addEventListener('click', () => dialog($('#contractDialog'), false));

function makePad(canvas, onChange) {
  const ctx = canvas.getContext('2d'); let drawing = false; let last = null;
  function resize() {
    const rect = canvas.getBoundingClientRect(); const prior = canvas.width ? canvas.toDataURL() : null;
    canvas.width = Math.max(320, Math.round(rect.width * 2)); canvas.height = Math.max(110, Math.round(rect.height * 2));
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.strokeStyle = '#050505'; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (prior && prior.length > 200) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height); img.src = prior; }
  }
  function point(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
  canvas.addEventListener('pointerdown', event => { event.preventDefault(); drawing = true; canvas.setPointerCapture?.(event.pointerId); last = point(event); });
  canvas.addEventListener('pointermove', event => { if (!drawing) return; event.preventDefault(); const next = point(event); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(next.x, next.y); ctx.stroke(); last = next; onChange(canvas.toDataURL()); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => canvas.addEventListener(type, () => { drawing = false; }));
  return { resize, clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); onChange(''); }, data: () => canvas.toDataURL() };
}
const initialsPad = makePad($('#initialCanvas'), data => { initialsData = data; });
const signaturePad = makePad($('#signatureCanvas'), data => { signatureData = data; });
$('#clearInitials').addEventListener('click', () => { initialsPad.clear(); initialsData = ''; $$('.initial-slot').forEach(slot => { if (slot.textContent !== 'NOT REQUIRED') { slot.textContent = 'INITIALS'; slot.dataset.applied = 'false'; } }); });
$('#clearSignature').addEventListener('click', () => { signaturePad.clear(); signatureData = ''; });
function applyInitials(index) {
  if (!initialsData || initialsData.length < 300) { alert('Draw your initials once before applying them.'); return; }
  const slot = $(`[data-slot="${index}"]`); slot.dataset.applied = 'true'; slot.innerHTML = `<img src="${initialsData}" alt="Applied initials" />`;
}
function allInitialsApplied(config) { return config.sections.every((section, index) => !section.initialsRequired || $(`[data-slot="${index}"]`)?.dataset.applied === 'true'); }

function fieldValues(formData, config) { const out = {}; config.fields.forEach(item => { out[item.label] = textSafe(formData.get(item.id)); }); return out; }
function contractText(record) {
  const terms = record.sections.map((section, index) => `${index + 1}. ${section.title}\n${section.text}\nInitials recorded: ${section.initialsRequired ? 'Yes' : 'Not required'}`).join('\n\n');
  return `AXON PERFORMANCE - ${record.template.signature.pdfTitle}\n${'='.repeat(52)}\nSubmission ID: ${record.id}\nSubmitted: ${record.submittedAt}\nContract Type: ${record.type}\nContract Category: ${record.badge}\n\nSIGNER DETAILS\n${Object.entries(record.fields).map(([label, value]) => `${label}: ${value || '—'}`).join('\n')}\n\nLEGAL ACKNOWLEDGEMENTS\n${terms}\n\nELECTRONIC SIGNATURE\nConsent: ${record.eConsent ? 'Accepted' : 'Not accepted'}\nTyped signature: ${record.typedSignature}\nSignature date: ${record.signatureDate}\nInitials captured: ${record.initialsImage ? 'Yes' : 'No'}\nDrawn signature captured: ${record.signatureImage ? 'Yes' : 'No'}\n\nThis contract reflects the signer-facing agreement text at the time of submission.\n`;
}
function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
function downloadText(text, name) { downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), name); }

// Native PDF writer - no external scripts or third-party dependencies.
const enc = new TextEncoder();
function concatBytes(parts) { const length = parts.reduce((sum, part) => sum + part.length, 0); const out = new Uint8Array(length); let offset = 0; parts.forEach(part => { out.set(part, offset); offset += part.length; }); return out; }
function ascii(value) { return enc.encode(value); }
function cleanPdfText(value) { return String(value ?? '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[^\x20-\x7E]/g, '?'); }
function pdfLiteral(value) { return cleanPdfText(value).replace(/([\\()])/g, '\\$1'); }
function base64Bytes(dataUrl) { const base64 = dataUrl.split(',')[1] || ''; const raw = atob(base64); const bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i); return bytes; }
function jpegDimensions(bytes) { for (let i = 0; i < bytes.length - 9; i++) { if (bytes[i] === 0xFF && [0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF].includes(bytes[i + 1])) return { height: bytes[i + 5] * 256 + bytes[i + 6], width: bytes[i + 7] * 256 + bytes[i + 8] }; } return { width: 1, height: 1 }; }
async function dataUrlToJpeg(dataUrl, maxWidth = 700) {
  if (!dataUrl) return null;
  const image = new Image(); image.src = dataUrl; await image.decode();
  const scale = Math.min(1, maxWidth / image.naturalWidth); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const bytes = base64Bytes(canvas.toDataURL('image/jpeg', .92)); return { bytes, ...jpegDimensions(bytes) };
}
async function assetToJpeg(url, maxWidth = 700) {
  const blob = await fetch(url).then(response => response.blob()); const data = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); }); return dataUrlToJpeg(data, maxWidth);
}
class PdfBuilder {
  constructor() { this.objects = []; }
  addText(content) { this.objects.push(ascii(content)); return this.objects.length; }
  addStream(dictionary, bytes) { const dict = dictionary ? dictionary : '<<'; this.objects.push(concatBytes([ascii(`${dict} /Length ${bytes.length} >>\nstream\n`), bytes, ascii('\nendstream')])); return this.objects.length; }
  build(rootId) {
    const parts = [ascii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')]; const offsets = [0]; let offset = parts[0].length;
    this.objects.forEach((body, index) => { offsets[index + 1] = offset; const prefix = ascii(`${index + 1} 0 obj\n`); const suffix = ascii('\nendobj\n'); parts.push(prefix, body, suffix); offset += prefix.length + body.length + suffix.length; });
    const xrefOffset = offset; const xref = [`xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`]; for (let i = 1; i <= this.objects.length; i++) xref.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`); const trailer = `trailer\n<< /Size ${this.objects.length + 1} /Root ${rootId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    parts.push(ascii(xref.join('')), ascii(trailer)); return new Blob(parts, { type: 'application/pdf' });
  }
}
function pdfColor(hex) { const value = hex.replace('#',''); return [parseInt(value.slice(0,2),16)/255, parseInt(value.slice(2,4),16)/255, parseInt(value.slice(4,6),16)/255]; }
function wrapText(text, size, maxWidth) { const words = cleanPdfText(text).split(/\s+/).filter(Boolean); const lines = []; let line = ''; const measure = value => value.length * size * .51; words.forEach(word => { const next = line ? `${line} ${word}` : word; if (measure(next) > maxWidth && line) { lines.push(line); line = word; } else line = next; }); if (line) lines.push(line); return lines.length ? lines : ['']; }
function pdfText(ops, x, y, size, font, value, color = '#111b25') { const [r,g,b] = pdfColor(color); ops.push(`BT /${font} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${pdfLiteral(value)}) Tj ET`); }
function pdfRect(ops, x, y, width, height, fill, stroke = null, line = 1) { if (fill) { const [r,g,b] = pdfColor(fill); ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x} ${y} ${width} ${height} re f`); } if (stroke) { const [r,g,b] = pdfColor(stroke); ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${line} w ${x} ${y} ${width} ${height} re S`); } }
function pdfImage(ops, name, x, y, width, height) { ops.push(`q ${width.toFixed(1)} 0 0 ${height.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} cm /${name} Do Q`); }

async function createContractPdf(record) {
  let logo = null, initials = null, signature = null;
  try { logo = await assetToJpeg(ASSETS.logoBlue, 620); } catch { /* fallback text branding */ }
  try { initials = await dataUrlToJpeg(record.initialsImage, 360); } catch { /* no image */ }
  try { signature = await dataUrlToJpeg(record.signatureImage, 680); } catch { /* no image */ }

  const pages = [];
  const pageSize = { width: 612, height: 792, left: 34, right: 578, top: 746, bottom: 42 };
  const usableWidth = pageSize.right - pageSize.left;
  let page;

  function newPage() {
    page = { ops: [], y: pageSize.top, colY: null };
    pages.push(page);
    drawPageHeader(page);
  }

  function drawPageHeader(target) {
    // Compact branded contract header: much less vertical space than previous version.
    pdfRect(target.ops, 0, 758, 612, 34, '#07385f');
    pdfRect(target.ops, 0, 0, 9, 792, '#1389cf');
    if (logo) {
      const ratio = logo.width / logo.height;
      const h = 21;
      pdfImage(target.ops, 'Logo', 28, 765, h * ratio, h);
    } else {
      pdfText(target.ops, 30, 772, 13, 'F2', 'AXON PERFORMANCE', '#60c7ef');
    }
    pdfText(target.ops, 420, 775, 7.5, 'F2', 'DIGITAL CONTRACT', '#f8f3e7');
    pdfText(target.ops, 420, 762, 7, 'F1', cleanPdfText(record.badge), '#c6e9f8');
    target.y = 744;
  }

  function ensure(height) {
    if (page.y - height < pageSize.bottom) newPage();
  }

  function miniHeader(label, height = 17) {
    ensure(height + 6);
    pdfRect(page.ops, pageSize.left, page.y - height, usableWidth, height, '#e9f3f9', '#bdd5e8', .7);
    pdfText(page.ops, pageSize.left + 8, page.y - 11, 7.3, 'F2', label, '#145c8d');
    page.y -= height + 8;
  }

  function drawIntro() {
    const title = record.type.toUpperCase();
    pdfText(page.ops, pageSize.left, page.y - 1, 8.4, 'F2', 'AXON PERFORMANCE DIGITAL AGREEMENT', '#27719f');
    page.y -= 15;
    pdfText(page.ops, pageSize.left, page.y - 3, 20, 'F2', title, '#132c41');
    page.y -= 24;
    const subtitle = record.template.short || record.template.description || '';
    wrapText(subtitle, 8.2, usableWidth).slice(0, 2).forEach(line => { pdfText(page.ops, pageSize.left, page.y - 2, 8.2, 'F1', line, '#5e7487'); page.y -= 11; });
    page.y -= 3;
    pdfRect(page.ops, pageSize.left, page.y - 24, usableWidth, 23, '#f0f7fb', '#cbddea', .7);
    pdfText(page.ops, pageSize.left + 8, page.y - 10, 7.1, 'F2', `SUBMISSION ID: ${record.id}`, '#285779');
    pdfText(page.ops, pageSize.left + 310, page.y - 10, 7.1, 'F2', `SIGNED: ${record.submittedAt}`, '#285779');
    page.y -= 32;
  }

  function drawDetailCards() {
    miniHeader('SIGNER DETAILS', 15);
    const pairs = Object.entries(record.fields || {});
    const colGap = 10;
    const cols = 3;
    const colW = (usableWidth - colGap * (cols - 1)) / cols;
    for (let index = 0; index < pairs.length; index += cols) {
      const row = pairs.slice(index, index + cols);
      ensure(35);
      row.forEach(([label, value], col) => {
        const x = pageSize.left + col * (colW + colGap);
        pdfRect(page.ops, x, page.y - 29, colW, 27, '#fbfdff', '#cbd9e4', .7);
        pdfText(page.ops, x + 6, page.y - 10, 5.9, 'F2', label.toUpperCase(), '#5b7488');
        const rendered = wrapText(value || '-', 7.2, colW - 12)[0] || '-';
        pdfText(page.ops, x + 6, page.y - 22, 7.2, 'F2', rendered, '#152939');
      });
      page.y -= 33;
    }
    page.y -= 3;
  }

  function drawTerms() {
    miniHeader('LEGAL ACKNOWLEDGEMENTS & INITIALS', 15);
    let col = 0;
    const gap = 14;
    const colW = (usableWidth - gap) / 2;
    const termSize = (record.sections || []).length > 7 ? 5.9 : 6.25;
    const leading = termSize + 1.15;
    const headingSize = 7.4;
    const columnTop = page.y;
    page.colY = [columnTop, columnTop];

    function moveToNextColumn(height) {
      if (page.colY[col] - height >= pageSize.bottom) return;
      if (col === 0) {
        col = 1;
        return;
      }
      newPage();
      col = 0;
      page.colY = [page.y, page.y];
    }

    (record.sections || []).forEach((section, index) => {
      const textWidth = colW - 16;
      const lines = wrapText(section.text || '', termSize, textWidth);
      const height = Math.max(48, 22 + lines.length * leading + 12);
      moveToNextColumn(height);
      const x = pageSize.left + col * (colW + gap);
      const yTop = page.colY[col];
      pdfRect(page.ops, x, yTop - height, colW, height, '#ffffff', '#c8d8e5', .65);
      pdfRect(page.ops, x, yTop - height, 4, height, '#1589cf');
      pdfText(page.ops, x + 9, yTop - 12, headingSize, 'F2', `${String(index + 1).padStart(2, '0')}  ${section.title || 'Acknowledgement'}`, '#123a5b');
      pdfRect(page.ops, x + colW - 50, yTop - 24, 42, 19, '#f7fbfe', '#8eafc5', .65);
      pdfText(page.ops, x + colW - 45, yTop - 12, 4.9, 'F2', 'INITIALS', '#5d7d94');
      if (section.initialsRequired && initials) {
        const ratio = initials.width / initials.height;
        const maxW = 32, maxH = 10;
        let w = maxW, h = w / ratio;
        if (h > maxH) { h = maxH; w = h * ratio; }
        pdfImage(page.ops, 'Initials', x + colW - 45 + (34 - w) / 2, yTop - 23 + (10 - h) / 2, w, h);
      } else if (!section.initialsRequired) {
        pdfText(page.ops, x + colW - 37, yTop - 21, 5.2, 'F1', 'N/A', '#6f8496');
      }
      let y = yTop - 28;
      lines.forEach(line => { pdfText(page.ops, x + 9, y, termSize, 'F1', line, '#34495c'); y -= leading; });
      page.colY[col] -= height + 7;
    });
    page.y = Math.min(...page.colY) - 10;
  }

  function drawSignature() {
    const needed = 106;
    ensure(needed + 12);
    miniHeader('ELECTRONIC SIGNATURE', 15);
    ensure(needed);
    pdfRect(page.ops, pageSize.left, page.y - 88, usableWidth, 82, '#f8fbfd', '#c8d8e5', .75);
    pdfText(page.ops, pageSize.left + 10, page.y - 18, 7.2, 'F2', 'CONSENT', '#145c8d');
    const consent = record.template.signature.consentText || '';
    wrapText(consent, 6.8, 235).slice(0, 4).forEach((line, index) => pdfText(page.ops, pageSize.left + 10, page.y - 31 - index * 8.2, 6.8, 'F1', line, '#20374a'));
    pdfText(page.ops, pageSize.left + 10, page.y - 68, 6.4, 'F2', `${(record.template.signature.typedLabel || 'Typed Signature').toUpperCase()}:`, '#5b7488');
    pdfText(page.ops, pageSize.left + 99, page.y - 68, 7.2, 'F2', record.typedSignature || '-', '#172a3b');
    pdfText(page.ops, pageSize.left + 10, page.y - 80, 6.4, 'F2', `${(record.template.signature.dateLabel || 'Date').toUpperCase()}:`, '#5b7488');
    pdfText(page.ops, pageSize.left + 99, page.y - 80, 7.2, 'F2', record.signatureDate || '-', '#172a3b');
    const sigX = pageSize.left + 316;
    pdfText(page.ops, sigX, page.y - 18, 7.2, 'F2', 'DRAWN SIGNATURE', '#145c8d');
    pdfRect(page.ops, sigX, page.y - 76, 200, 47, '#ffffff', '#8eb5ce', .75);
    if (signature) {
      const ratio = signature.width / signature.height;
      const maxW = 188, maxH = 36;
      let w = maxW, h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
      pdfImage(page.ops, 'Signature', sigX + 6 + (188 - w) / 2, page.y - 70 + (36 - h) / 2, w, h);
    }
    page.y -= 100;
  }

  newPage();
  drawIntro();
  drawDetailCards();
  drawTerms();
  drawSignature();

  pages.forEach((item, index) => {
    pdfText(item.ops, 36, 24, 6.5, 'F1', 'Axon Performance - Digital Contract', '#6c8295');
    pdfText(item.ops, 516, 24, 6.5, 'F1', `Page ${index + 1} of ${pages.length}`, '#6c8295');
  });

  const cleanBuilder = new PdfBuilder();
  const f1 = cleanBuilder.addText('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const f2 = cleanBuilder.addText('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const lId = logo ? cleanBuilder.addStream(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, logo.bytes) : null;
  const iId = initials ? cleanBuilder.addStream(`<< /Type /XObject /Subtype /Image /Width ${initials.width} /Height ${initials.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, initials.bytes) : null;
  const sId = signature ? cleanBuilder.addStream(`<< /Type /XObject /Subtype /Image /Width ${signature.width} /Height ${signature.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, signature.bytes) : null;
  const contentIds = pages.map(item => cleanBuilder.addStream('', ascii(item.ops.join('\n'))));
  const pagesPlaceholder = cleanBuilder.addText('<< >>');
  const res2 = `<< /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> /XObject << ${lId ? `/Logo ${lId} 0 R` : ''} ${iId ? `/Initials ${iId} 0 R` : ''} ${sId ? `/Signature ${sId} 0 R` : ''} >> >>`;
  const pageRefs = contentIds.map(contentId => cleanBuilder.addText(`<< /Type /Page /Parent ${pagesPlaceholder} 0 R /MediaBox [0 0 612 792] /Resources ${res2} /Contents ${contentId} 0 R >>`));
  cleanBuilder.objects[pagesPlaceholder - 1] = ascii(`<< /Type /Pages /Kids [${pageRefs.map(id => `${id} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`);
  const catalogId = cleanBuilder.addText(`<< /Type /Catalog /Pages ${pagesPlaceholder} 0 R >>`);
  return cleanBuilder.build(catalogId);
}
async function downloadPdfContract(record) { const blob = await createContractPdf(record); const slug = (record.fields['Full Legal Name'] || 'contract').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); downloadBlob(blob, `axon-${slug || 'contract'}-${record.id}.pdf`); }

async function notifyRecord(record, recipientEmail = recipient) {
  if (!recipientEmail) return { ok: false, skipped: true, message: 'No automated recipient is saved.' };
  try { const response = await fetch('/.netlify/functions/notify-contract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: recipientEmail, record }) }); const payload = await response.json().catch(() => ({})); return { ok: Boolean(response.ok && payload.ok), message: payload.error || '' }; }
  catch { return { ok: false, message: 'Notification service is unavailable until deployed to Netlify.' }; }
}

$('#waiverForm').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const config = currentConfig();
  if (!form.reportValidity()) return;
  if (!initialsData || initialsData.length < 300) { alert('Draw your initials first.'); return; }
  if (!allInitialsApplied(config)) { alert('Apply initials to every required legal acknowledgement.'); return; }
  if (!signatureData || signatureData.length < 300) { alert('Draw your full signature in black ink.'); return; }
  const fd = new FormData(form); const record = {
    id: `AX-${Date.now().toString(36).toUpperCase()}`,
    submittedAt: new Date().toLocaleString(), type: selectedType, badge: config.badge,
    fields: fieldValues(fd, config), sections: clone(config.sections),
    typedSignature: textSafe(fd.get('typedSignature')), signatureDate: textSafe(fd.get('signatureDate')),
    eConsent: fd.get('eConsent') === 'on', initialsImage: initialsData, signatureImage: signatureData,
    template: clone({ badge: config.badge, description: config.description, short: config.short, signature: config.signature })
  };
  records.unshift(record); latestRecord = record; persist();
  const slug = (record.fields['Full Legal Name'] || 'contract').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  try { await downloadPdfContract(record); downloadText(contractText(record), `axon-${slug || 'contract'}-${record.id}.txt`); $('#successCopy').textContent = 'Your structured PDF contract and TXT backup have downloaded on this device.'; }
  catch { $('#successCopy').textContent = 'Your contract was saved locally. Use Download PDF Again to retry the PDF export.'; }
  notifyRecord(record).then(result => { record.notificationStatus = result.ok ? 'Sent' : (result.skipped ? 'Not configured' : 'Failed'); persist(); });
  dialog($('#contractDialog'), false); dialog($('#successDialog'), true); form.reset();
});
$('#openPdf').addEventListener('click', () => { if (latestRecord) downloadPdfContract(latestRecord); });
$('#finish').addEventListener('click', () => dialog($('#successDialog'), false));

// Smart admin board
function typeSummary(config) { return `${config.badge} · ${config.fields.length} field${config.fields.length === 1 ? '' : 's'} · ${config.sections.length} sections`; }
function renderTypeList() {
  $('#typeList').innerHTML = Object.entries(waiverTypes).map(([name, config]) => `<button type="button" class="${name === editorTypeName ? 'active' : ''}" data-edit-type="${escapeHtml(name)}"><span class="type-dot" style="--type-color:${colorForTheme(config.theme)}"></span><span><b>${escapeHtml(name)}</b><small>${escapeHtml(typeSummary(config))}</small></span><em>›</em></button>`).join('');
  $$('[data-edit-type]').forEach(button => button.addEventListener('click', () => { editorTypeName = button.dataset.editType; activeTab = 'overview'; renderAdminWorkspace(); renderTypeList(); }));
}
function activeDraft() { return waiverTypes[editorTypeName]; }
function setDraftValue(path, value) { const parts = path.split('.'); let target = activeDraft(); for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]]; target[parts.at(-1)] = value; }
function labelInput(label, value, path, options = {}) { const type = options.type || 'text'; const isArea = options.area; return `<label class="editor-label">${escapeHtml(label)}${options.help ? `<small>${escapeHtml(options.help)}</small>` : ''}${isArea ? `<textarea data-path="${escapeHtml(path)}">${escapeHtml(value || '')}</textarea>` : type === 'select' ? `<select data-path="${escapeHtml(path)}">${options.options.map(item => `<option value="${item.value}" ${item.value === value ? 'selected' : ''}>${item.label}</option>`).join('')}</select>` : `<input data-path="${escapeHtml(path)}" type="${type}" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(options.placeholder || '')}" />`}</label>`; }
function bindDraftInputs(root = $('#editorPanels')) { $$('[data-path]', root).forEach(input => input.addEventListener('input', () => { const value = input.type === 'checkbox' ? input.checked : input.value; setDraftValue(input.dataset.path, value); renderTypeList(); })); }
function renderOverviewPanel(config) {
  return `<section class="editor-panel" data-panel="overview"><div class="board-grid"><article class="editor-card"><h4>Tile & pathway copy</h4>${labelInput('Waiver type name', editorTypeName, 'nameDraft', { placeholder: 'Visible tile title' })}${labelInput('Badge / category', config.badge, 'badge')}${labelInput('Tile description', config.description, 'description', { area: true, help: 'Shown on the iPad carousel.' })}</article><article class="editor-card"><h4>Contract heading</h4>${labelInput('Short agreement subtitle', config.short, 'short', { placeholder: 'Shown under the contract heading' })}${labelInput('Accent theme', config.theme, 'theme', { type: 'select', options: [{value:'blue',label:'Axon Blue'},{value:'amber',label:'Day Pass Amber'},{value:'teal',label:'Tour Teal'},{value:'violet',label:'Client Violet'},{value:'coral',label:'Coral'}] })}${labelInput('PDF document title', config.signature.pdfTitle, 'signature.pdfTitle', { placeholder: 'Digital Contract' })}<div class="add-row"><span>Live changes remain a draft until you tap Save Changes.</span></div></article></div></section>`;
}
function renderFieldsPanel(config) {
  return `<section class="editor-panel" data-panel="fields" hidden><div class="editor-card"><h4>Signer-facing fields</h4><p class="helper-copy">Every label, placeholder, field type, and requirement can be edited here. This is exactly what the prospect sees before signing.</p><div class="field-list">${config.fields.map((item, index) => `<article class="smart-card"><div class="smart-card-head"><b>FIELD ${String(index + 1).padStart(2, '0')}</b><div class="smart-card-tools"><button type="button" data-move-field="${index}:up" aria-label="Move field up">↑</button><button type="button" data-move-field="${index}:down" aria-label="Move field down">↓</button><button type="button" data-remove-field="${index}" aria-label="Remove field">×</button></div></div><div class="smart-card-grid">${labelInput('Label', item.label, `fields.${index}.label`)}${labelInput('Type', item.type, `fields.${index}.type`, { type:'select', options:[{value:'text',label:'Text'},{value:'email',label:'Email'},{value:'tel',label:'Phone'},{value:'date',label:'Date'},{value:'textarea',label:'Long text'}] })}<label class="editor-label">Required<input type="checkbox" data-path="fields.${index}.required" ${item.required ? 'checked' : ''} /></label>${labelInput('Placeholder / field hint', item.placeholder, `fields.${index}.placeholder`, { placeholder:'Guidance visible inside field', help:'This prospect-facing text appears inside the field.', area:true })}</div></article>`).join('')}</div><div class="add-row"><span>Add only the information needed for this waiver type.</span><button id="addField" type="button">＋ ADD SIGNER FIELD</button></div></div></section>`;
}
function renderTermsPanel(config) {
  return `<section class="editor-panel" data-panel="terms" hidden><div class="board-grid"><article class="editor-card"><h4>Initials language</h4>${labelInput('Section heading instruction', config.signature.initialsInstruction, 'signature.initialsInstruction', { area:true, help:'Visible above the initials workflow.' })}${labelInput('Initials pad heading', config.signature.initialsTitle, 'signature.initialsTitle')}${labelInput('Initials pad help', config.signature.initialsHelp, 'signature.initialsHelp', { area:true })}</article><article class="editor-card"><h4>Agreement sections</h4><p class="helper-copy">Each card becomes a legally structured section in the prospect's agreement and PDF, with a dedicated initials box.</p><div class="section-editor-list">${config.sections.map((item, index) => `<article class="smart-card"><div class="smart-card-head"><b>SECTION ${String(index + 1).padStart(2, '0')}</b><div class="smart-card-tools"><button type="button" data-move-section="${index}:up" aria-label="Move section up">↑</button><button type="button" data-move-section="${index}:down" aria-label="Move section down">↓</button><button type="button" data-remove-section="${index}" aria-label="Remove section">×</button></div></div><div class="smart-card-grid">${labelInput('Section title', item.title, `sections.${index}.title`)}<label class="editor-label">Initials required<input type="checkbox" data-path="sections.${index}.initialsRequired" ${item.initialsRequired ? 'checked' : ''} /></label>${labelInput('Full legal text', item.text, `sections.${index}.text`, { area:true, help:'This exact text is shown to the prospect and embedded in the PDF contract.' })}</div></article>`).join('')}</div><div class="add-row"><span>Add a new acknowledgement for this waiver type.</span><button id="addSection" type="button">＋ ADD SECTION</button></div></article></div></section>`;
}
function renderSignaturePanel(config) {
  return `<section class="editor-panel" data-panel="signature" hidden><div class="board-grid"><article class="editor-card"><h4>Electronic consent copy</h4>${labelInput('Consent checkbox text', config.signature.consentText, 'signature.consentText', { area:true, help:'Appears next to the electronic-signature checkbox.' })}${labelInput('Consent support text', config.signature.consentDescription, 'signature.consentDescription', { area:true, help:'Appears directly above the typed and drawn signature fields.' })}</article><article class="editor-card"><h4>Signature field labels</h4>${labelInput('Typed signature label', config.signature.typedLabel, 'signature.typedLabel')}${labelInput('Typed signature placeholder', config.signature.typedPlaceholder, 'signature.typedPlaceholder')}${labelInput('Date field label', config.signature.dateLabel, 'signature.dateLabel')}${labelInput('Drawn signature heading', config.signature.drawnLabel, 'signature.drawnLabel')}${labelInput('Submit button text', config.signature.submitText, 'signature.submitText')}</article></div></section>`;
}
function renderAdminWorkspace() {
  const config = activeDraft(); if (!config) return;
  $('#editorActiveType').textContent = editorTypeName;
  const existingNameDraft = config.nameDraft || editorTypeName;
  config.nameDraft = existingNameDraft;
  $('#editorPanels').innerHTML = `${renderOverviewPanel(config)}${renderFieldsPanel(config)}${renderTermsPanel(config)}${renderSignaturePanel(config)}`;
  $$('.editor-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === activeTab));
  $$('.editor-panel').forEach(panel => panel.hidden = panel.dataset.panel !== activeTab);
  bindDraftInputs(); bindSmartControls();
}
function move(array, index, direction) { const target = index + direction; if (target < 0 || target >= array.length) return; [array[index], array[target]] = [array[target], array[index]]; }
function bindSmartControls() {
  $('#addField')?.addEventListener('click', () => { activeDraft().fields.push(field(uid('field'), 'New field', 'text', 'Enter response', false)); renderAdminWorkspace(); });
  $('#addSection')?.addEventListener('click', () => { activeDraft().sections.push({ id: uid('section'), title: 'New acknowledgement', text: 'Enter the legal acknowledgement text shown to the prospect.', initialsRequired: true }); renderAdminWorkspace(); });
  $$('[data-remove-field]').forEach(button => button.addEventListener('click', () => { activeDraft().fields.splice(Number(button.dataset.removeField), 1); renderAdminWorkspace(); }));
  $$('[data-remove-section]').forEach(button => button.addEventListener('click', () => { activeDraft().sections.splice(Number(button.dataset.removeSection), 1); renderAdminWorkspace(); }));
  $$('[data-move-field]').forEach(button => button.addEventListener('click', () => { const [index, direction] = button.dataset.moveField.split(':'); move(activeDraft().fields, Number(index), direction === 'up' ? -1 : 1); renderAdminWorkspace(); }));
  $$('[data-move-section]').forEach(button => button.addEventListener('click', () => { const [index, direction] = button.dataset.moveSection.split(':'); move(activeDraft().sections, Number(index), direction === 'up' ? -1 : 1); renderAdminWorkspace(); }));
}
function saveActiveType() {
  const config = activeDraft(); const newName = (config.nameDraft || editorTypeName).trim();
  if (!newName) { alert('Enter a waiver type name.'); return; }
  if (!config.fields.length) { alert('Keep at least one signer field.'); return; }
  if (!config.sections.length) { alert('Keep at least one legal acknowledgement section.'); return; }
  delete config.nameDraft;
  if (newName !== editorTypeName) { delete waiverTypes[editorTypeName]; waiverTypes[newName] = config; editorTypeName = newName; selectedType = newName; }
  persist(); renderTypeList(); renderTiles(); renderAdminWorkspace();
}
function newType() {
  const baseName = 'New Waiver Type'; let name = baseName; let number = 2; while (waiverTypes[name]) { name = `${baseName} ${number++}`; }
  waiverTypes[name] = normalizeType({ badge:'NEW TYPE', description:'New digital agreement pathway.', short:'New agreement', theme:'blue', fields:[field('fullName','Full Legal Name','text','Enter full legal name',true)], sections:clone(DEFAULT_SECTIONS), signature:clone(DEFAULT_SIGNATURE) }); editorTypeName = name; selectedType = name; activeTab = 'overview'; renderTypeList(); renderTiles(); renderAdminWorkspace();
}
function duplicateActiveType() {
  const base = clone(activeDraft()); let name = `${editorTypeName} Copy`; let number = 2; while (waiverTypes[name]) name = `${editorTypeName} Copy ${number++}`; waiverTypes[name] = base; editorTypeName = name; selectedType = name; renderTypeList(); renderTiles(); renderAdminWorkspace();
}
function deleteActiveType() {
  if (Object.keys(waiverTypes).length === 1) { alert('Keep at least one waiver type.'); return; }
  if (confirm(`Delete ${editorTypeName}? Completed contracts are not removed.`)) { delete waiverTypes[editorTypeName]; editorTypeName = Object.keys(waiverTypes)[0]; selectedType = editorTypeName; persist(); renderTypeList(); renderTiles(); renderAdminWorkspace(); }
}
function setNotifyStatus(message, type = '') { const node = $('#notifyStatus'); node.textContent = message; node.className = `status-copy ${type}`; }
function refreshAdmin() { editorTypeName = waiverTypes[editorTypeName] ? editorTypeName : Object.keys(waiverTypes)[0]; $('#notifyRecipient').value = recipient; setNotifyStatus(recipient ? `Recipient saved: ${recipient}. Add this address to ALLOWED_NOTIFY_EMAILS in Netlify before live delivery.` : 'Local preview: add a recipient, then follow the Netlify deployment instructions.'); renderTypeList(); renderAdminWorkspace(); }

$('#openAdmin').addEventListener('click', () => { $('#adminPassword').value = ''; $('#adminError').textContent = ''; dialog($('#adminLoginDialog'), true); });
$('#closeAdminLogin').addEventListener('click', () => dialog($('#adminLoginDialog'), false));
$('#unlockAdmin').addEventListener('click', () => { if ($('#adminPassword').value === '1307!') { dialog($('#adminLoginDialog'), false); refreshAdmin(); dialog($('#adminDialog'), true); } else $('#adminError').textContent = 'Incorrect staff code.'; });
$('#closeAdmin').addEventListener('click', () => dialog($('#adminDialog'), false));
$('#addType').addEventListener('click', newType);
$('#duplicateType').addEventListener('click', duplicateActiveType);
$('#deleteType').addEventListener('click', deleteActiveType);
$('#saveType').addEventListener('click', saveActiveType);
$$('.editor-tab').forEach(tab => tab.addEventListener('click', () => { activeTab = tab.dataset.tab; renderAdminWorkspace(); }));
$('#saveRecipient').addEventListener('click', () => { const value = $('#notifyRecipient').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(value)) { setNotifyStatus('Enter a valid email address.', 'error'); return; } recipient = value; persist(); setNotifyStatus(`Recipient saved: ${recipient}. Add it to ALLOWED_NOTIFY_EMAILS before sending live notifications.`, 'success'); });
$('#sendTest').addEventListener('click', async () => { const value = $('#notifyRecipient').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(value)) { setNotifyStatus('Save a valid recipient first.', 'error'); return; } recipient = value; persist(); setNotifyStatus('Sending test notification…'); const test = { id:'AX-TEST', submittedAt:new Date().toLocaleString(), type:'System Test', badge:'TEST', fields:{'Full Legal Name':'Axon Performance test notification'}, sections:[], eConsent:true, template:{signature:DEFAULT_SIGNATURE} }; const result = await notifyRecord(test); setNotifyStatus(result.ok ? 'Test sent successfully.' : `Test failed: ${result.message || 'Check Netlify variables.'}`, result.ok ? 'success' : 'error'); });
$('#exportRecordsTxt').addEventListener('click', () => downloadText(records.map(contractText).join('\n\n' + '-'.repeat(88) + '\n\n'), 'axon-performance-contract-records.txt'));
$('#exportRecordsPdf').addEventListener('click', async () => { if (!records.length) { alert('There are no local contracts to export yet.'); return; } const button = $('#exportRecordsPdf'); button.textContent = 'EXPORTING…'; button.disabled = true; try { for (const record of records.slice(0, 20)) await downloadPdfContract(record); } finally { button.textContent = 'EXPORT ALL AS PDF'; button.disabled = false; } });
$('#downloadTemplate').addEventListener('click', () => downloadText(JSON.stringify(waiverTypes, null, 2), 'axon-performance-waiver-template.json'));
$('#uploadTemplate').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; try { const incoming = JSON.parse(await file.text()); if (!incoming || typeof incoming !== 'object') throw new Error('Invalid template'); waiverTypes = Object.fromEntries(Object.entries(incoming).map(([name, cfg]) => [name, normalizeType(cfg)])); selectedType = Object.keys(waiverTypes)[0]; editorTypeName = selectedType; persist(); refreshAdmin(); renderTiles(); setNotifyStatus('Template uploaded and normalized for this device.', 'success'); } catch { setNotifyStatus('Template could not be loaded. Upload a valid Axon template JSON.', 'error'); } event.target.value = ''; });
$('#openDeploymentInfo').addEventListener('click', () => dialog($('#deploymentDialog'), true));
$('#closeDeploymentInfo').addEventListener('click', () => dialog($('#deploymentDialog'), false));

renderTiles();
