# Axon Performance - iPad Digital Contract Kiosk

This is a self-contained, Netlify-ready iPad waiver portal using the supplied Axon logo assets **without altering them**.

## Refined capabilities
- iPad carousel with large waiver tiles: Waiver & Liability, Day Pass Waiver, Gym Tour, and Client Waiver.
- One-tap contract modal with black-ink initials and signature pads.
- A smart Admin Edit workspace protected by `1307!`.
- Field-level editing: label, type, placeholder, required status, reorder, remove, add.
- Agreement-level editing: exact legal title/text for every section, initials-required switch, reorder, remove, add.
- Signature-level editing: consent language, instructions, typed field labels, signature label, submit text, and PDF document title.
- Every signed record saves a snapshot of the exact text displayed to the prospect.
- Automatic PDF-only download after signing. The PDF uses a compressed two-page-oriented letter layout with Axon branding, full waiver text, legal initials beside each required section, signer data, consent, typed signature, and black-ink drawn signature.

## iPad use
1. Deploy to Netlify.
2. Open the deployed URL in Safari on the iPad.
3. Select **Share -> Add to Home Screen**.
4. For front-desk use, enable **Guided Access** in iPad Settings -> Accessibility -> Guided Access, then triple-click the side button while the kiosk is open.
5. Use landscape for the widest editing and signing experience. Portrait remains supported and uses a full-screen scrollable contract sheet.

## Admin Edit
1. Tap **ADMIN EDIT**.
2. Enter `1307!`.
3. Select an agreement pathway in the left-hand list.
4. Use the four smart-editing tabs:
   - **Overview:** tile title, category, description, and PDF heading.
   - **Signer Fields:** exact labels, placeholders, field types, required settings, order, and add/remove actions.
   - **Agreement & Initials:** every legal acknowledgement and the text around the initialing workflow.
   - **Signature & PDF:** the electronic-consent text, signature labels, and final submit wording.
5. Tap **SAVE CHANGES**. The carousel updates immediately.
6. Signed submissions appear in **Stored contracts**, where an admin can re-download individual PDFs or download all local PDFs again.

## Netlify deployment
1. Upload this entire folder to Netlify Drop or connect it to a Git repository.
2. `netlify.toml` already serves the static site and exposes the serverless function under `netlify/functions/notify-contract.js`.
3. Deploy once to confirm the kiosk loads.

## Optional automatic email notifications
The kiosk sends a branded notification through the included Netlify Function after a contract signs. Set these variables in **Netlify -> Site configuration -> Environment variables**:

```text
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=Axon Performance <contracts@your-verified-domain.com>
ALLOWED_NOTIFY_EMAILS=owner@yourdomain.com,manager@yourdomain.com
```

Then:
1. Verify the sender/domain in Resend.
2. Redeploy Netlify after adding variables.
3. Open **Admin Edit** and save an address that also appears in `ALLOWED_NOTIFY_EMAILS`.
4. Tap **SEND TEST**.

The PDF is generated locally and downloaded directly to the iPad because it includes the actual drawn signature image. The notification email contains the completed-contract summary. Automatic email attachment/storage of the PDF requires an additional secure backend such as S3, Supabase Storage, or a contract management API.

## Production hardening
The static version is ideal for a polished demo and kiosk interface but is not a complete immutable e-signature service. Before treating it as a long-term legal record system, add server-side staff authentication, encrypted database/object storage for originals, immutable audit logs, retention policies, and legal review of the waiver/e-signature process.

## PDF-only exports and local submissions
- The signing flow now automatically downloads the signed contract as PDF only.
- The signed record is also stored in the browser-local Admin Edit portal under **Stored contracts**.
- Admin can re-download an individual stored submission PDF or batch download recent local PDFs.
- Browser-local storage is convenient for the kiosk but should be paired with backend storage before relying on it as long-term legal retention.
