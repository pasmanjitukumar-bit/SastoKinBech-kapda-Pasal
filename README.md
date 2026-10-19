# SastoKinBech — Cash On Delivery funnel

Next.js App Router + Tailwind CSS for the SastoKinBech cash-on-delivery store. Production hosting uses Vercel; local development uses port 3016.

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3016. To preview the full checkout without credentials, set `DEMO_MODE=true` in `.env.local`, then restart the server. Demo confirmations are explicitly labeled and do not send emails or save orders. Demo mode is disabled in production even if the variable is true. Set it to false to test real orders.

## Catalog and design

Edit `lib/catalog.mjs` for product names, prices, images and FAQs. The three price pairs were interpreted as Floral Rs. 2,999 → 1,999; Golden Rs. 3,999 → 2,999; Classic Rs. 2,499 → 1,499. Confirm these assignments before publishing. Only sarees are shown because those are the supplied photographs; add genuine men's and kids' products and photographs to expand the collection. All seven images are converted to lossless PNG, preserving native resolution; the smaller supplied images cannot gain real detail through enlargement. Gallery descriptions are editorial names, not verified fabric specifications. Reviews are explicitly marked fictional samples; replace them with real customer reviews before launch. No reels section exists because no links were provided.

## Seller applications

The “Sell with us” page at `/sell` lets a shop submit its contact details and a first product listing. Applications are validated and emailed to `BUSINESS_EMAIL`; the applicant receives an acknowledgement. The shop owner reviews the application and adds approved inventory to `lib/catalog.mjs` and `public/products/` before it appears in the public store. Applications require the same Google and SMTP environment variables as order processing. This is an application and review workflow, not seller accounts or automatic product publishing.

## Google Sheets setup

The configured spreadsheet has a branded title and subtitle above its order table. The `oder` tab's header is on row 5 and orders begin on row 6. Keep the following columns in this order; the technical fingerprint column is hidden after S:

```text
Order ID	Date & Time (Nepal)	Customer Name	Phone Number	Email Address	Exact Location	Product Name / Options	Quantity	Price Per Piece (NPR)	Total Price (NPR)	Payment Method	Order Status	Notes	Subtotal (NPR)	Delivery (NPR)	Delivery Area	Business Email	Customer Email	Request Fingerprint
```

Set `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB_NAME`, and `GOOGLE_SERVICE_ACCOUNT_EMAIL`. The service account must have Editor access. Keep row 5 as the table header and do not move the columns. Existing title and subtitle rows may stay above it. Do not sort individual columns independently; use the table filter.

For a new spreadsheet, enable Google Sheets API, create a service account and key, and share the sheet with the service account as Editor. Store the private key only in `.env.local` or Vercel Secret variables, using literal `\\n` escapes if needed. Never commit key files or environment files.

## Gmail SMTP setup

Set `BUSINESS_EMAIL`, `EMAIL_FROM`, and `EMAIL_REPLY_TO` to `pasmanjitukumar@gmail.com`. Set `BRAND_NAME=SastoKinBech`. Use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` as your Gmail address, and `SMTP_PASS` as a Gmail App Password from an account with two-step verification. Port 587 uses required STARTTLS. This project uses SMTP; `EMAIL_SERVICE_API_KEY` is reserved and unused. A normal Gmail account password is not the SMTP credential.

## Order processing

Checkout POSTs name, phone, email, exact location, product ID, quantity, delivery area, optional preferences and a random request reference to `/api/order`. The server ignores client prices and calculates totals from the catalog, including Rs. 100 inside Kathmandu Valley or Rs. 150 outside. Quantity is restricted to integers 1–20. Customer input is validated and escaped in emails; Sheets uses RAW writes to avoid formula execution. Private credentials and the spreadsheet ID stay server-side.

The backend saves a New Order row, sends the business HTML email, records that stage, sends the customer HTML email, and records that stage. It responds with success only after all stages complete. Thank-you details are stored in session storage and contain no contact details. On a partial email failure, checkout stays visible and reports the saved order ID. Retry without changing details resumes remaining stages. Changing details requires reloading checkout for a fresh reference.

Retry limits: Google Sheets is not a transactional database. The in-process lock prevents concurrent processing within one server instance; a simultaneous identical request across multiple Vercel instances can still race. SMTP acceptance followed by a failed Sheets marker write can also lead to a repeated email on retry. For strict distributed exactly-once order creation, add a transactional database with a unique request key and an email outbox before high-volume deployment. SMTP acceptance does not guarantee inbox delivery. This implementation must not be represented as guaranteeing exactly-once delivery.

## Verification

Run `npm test` and `npm run build`. Tests verify validation, authoritative prices, write-before-email sequencing, retry behavior, partial failure recovery and reference conflicts using fake services. They do not verify real credentials.

For an end-to-end live test: configure credentials, turn demo mode off, restart, place a single quantity-1 order using an email address you control, check the A:S row, verify both Gmail and customer inboxes/spam folders, and verify thank-you totals. Retry the same completed request to confirm no new row or emails. To test failures, use invalid credentials: checkout must display an error and remain on the form. Restore credentials afterward. Do not use other people's contact information for testing.

## Vercel later

Import the GitHub repository `pasmanjitukumar-bit/SastoKinBech-kapda-Pasal` into Vercel with the Next.js preset. This repository root is the project root (`.`). Add `.env.example` values in Vercel Project Settings → Environment Variables. Replace both example domain values with the assigned HTTPS production domain, supply newly rotated Google and Gmail credentials, set `SMTP_PORT=587`, and set `DEMO_MODE=false`. Store the private key as a multiline value or escaped `\n`. Build with `npm run build`; deploy. The API uses Node.js runtime and a 60-second maximum duration, subject to your Vercel plan. Use HTTPS, replace sample testimonials, confirm product availability and policy copy, and repeat the live end-to-end order test before sharing the site.

References: https://nextjs.org/docs/app/getting-started/route-handlers and https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append

## Current deployment status

The deployed checkout requires all ten order service variables in the target Vercel environment. The Sheet ID, tab name and service account email are configured for Production and Preview. Add a newly rotated `GOOGLE_PRIVATE_KEY` as a Secret in Production and change `SMTP_PASS` to a newly rotated Gmail App Password saved as a Secret. Never reuse credentials pasted into chat. After saving, redeploy and verify with an order using an email address you control. Unit tests do not validate live Sheets access or email delivery.
