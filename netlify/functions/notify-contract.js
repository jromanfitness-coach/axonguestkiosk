function html(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}
function validEmail(value = '') { return /^\S+@\S+\.\S+$/.test(value); }

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ ok:false, error:'Method not allowed.' }) };
  try {
    const { recipient, record = {} } = JSON.parse(event.body || '{}');
    const to = String(recipient || '').trim().toLowerCase();
    const allowList = (process.env.ALLOWED_NOTIFY_EMAILS || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
    if (!validEmail(to)) return { statusCode: 400, body: JSON.stringify({ ok:false, error:'Invalid notification recipient.' }) };
    if (!allowList.includes(to)) return { statusCode: 403, body: JSON.stringify({ ok:false, error:'Recipient is not in ALLOWED_NOTIFY_EMAILS.' }) };
    if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) return { statusCode: 503, body: JSON.stringify({ ok:false, error:'Resend is not configured in Netlify environment variables.' }) };

    const tableRows = Object.entries(record.fields || {}).map(([label, value]) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #dde8f0;color:#587086;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em">${html(label)}</td><td style="padding:10px 12px;border-bottom:1px solid #dde8f0;color:#132638;font-weight:700">${html(value || '—')}</td></tr>`).join('');
    const payload = {
      from: process.env.FROM_EMAIL,
      to: [to],
      subject: `Axon Performance - Signed ${record.type || 'digital contract'} (${record.id || 'new agreement'})`,
      html: `<div style="margin:0;padding:28px;background:#05090d;font-family:Arial,Helvetica,sans-serif"><div style="max-width:700px;margin:auto;overflow:hidden;border-radius:18px;background:#ffffff"><div style="padding:26px 28px;background:linear-gradient(135deg,#062e50,#1589cf);color:#f8f3e7"><div style="font-size:11px;letter-spacing:2px;font-weight:900;color:#a7e5fa">AXON PERFORMANCE</div><h1 style="margin:9px 0 0;font-size:27px">Signed contract received</h1><p style="margin:7px 0 0;color:#d7edf7">${html(record.type || 'Digital contract')} - ${html(record.id || '')}</p></div><div style="padding:25px"><p style="margin-top:0;color:#526a7e;line-height:1.45">A signed digital agreement was completed on ${html(record.submittedAt || '')}.</p><table width="100%" cellspacing="0" cellpadding="0">${tableRows}</table><div style="margin-top:18px;padding:14px;border-left:4px solid #1589cf;background:#edf7fc;color:#244e6d;font-size:13px"><b>Capture status:</b> electronic consent accepted, each required initials section applied, and black-ink drawn signature captured. The kiosk automatically downloads the full structured PDF contract to the signing device.</div></div></div></div>`
    };
    const response = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { statusCode: 502, body: JSON.stringify({ ok:false, error: result.message || 'Email provider rejected the send.' }) };
    return { statusCode: 200, body: JSON.stringify({ ok:true, id:result.id }) };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:'Unable to prepare notification.' }) };
  }
};
