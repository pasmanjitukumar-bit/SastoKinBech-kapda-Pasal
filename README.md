# SastoKinBech — Cash On Delivery funnel

Next.js App Router + Tailwind CSS. Local development only; nothing has been published.

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3016. To preview the full checkout without credentials, set `DEMO_MODE=true` in `.env.local`, then restart the server. Demo confirmations are explicitly labeled and do not send emails or save orders. Demo mode is disabled in production even if the variable is true. Set it to false to test real orders.

## Catalog and design

Edit `lib/catalog.mjs` for product names, prices, images and FAQs. The three price pairs were interpreted as Floral Rs. 2,999 → 1,999; Golden Rs. 3,999 → 2,999; Classic Rs. 2,499 → 1,499. Confirm these assignments before publishing. Only sarees are shown because those are the supplied photographs; add genuine men's and kids' products and photographs to expand the collection. All seven images are converted to lossless PNG, preserving native resolution; the smaller supplied images cannot gain real detail through enlargement. Gallery descriptions are editorial names, not verified fabric specifications. Reviews are explicitly marked fictional samples; replace them with real customer reviews before launch. No reels section exists because no links were provided.

## Google Sheets setup

1. Create a Google Spreadsheet. Name its tab `Orders` (or set `GOOGLE_SHEET_TAB_NAME` to the exact tab name).
2. Paste this tab-separated header into cell A1:

```text
Order ID	Date & Time	Customer Name	Phone Number	Email Address	Exact Location	Product Name	Quantity	Price Per Piece	Total Price	Payment Method	Order Status	Notes	Request Fingerprint	Business Email Sent	Customer Email Sent
```

The first 13 columns are your requested order fields. The final three track retries; keep them in place. You may hide columns N:P. Do not sort individual columns independently. For reliable row markers, avoid sorting or deleting order rows while submissions are running; use filter views instead.

3. Freeze row 1. Make it bold, white text on dark green, add alternating row colors, format H:J as numbers, and use Data → Create a filter. Format column B as plain text (it stores ISO UTC timestamps).
4. Select L2:L, then Data → Data validation → Dropdown. Add `New Order`, `Order Confirmed`, `Order Ongoing`, `Delivered`, `Cancelled`; assign colors. Select reject invalid input.
5. The Sheet ID is the segment between `/d/` and `/edit` in its URL.
6. In Google Cloud Console, create a project, enable Google Sheets API, create a service account, and create a JSON key. Copy its `client_email` to `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `private_key` to `GOOGLE_PRIVATE_KEY` in `.env.local`. Store a quoted private key with literal `\n` escapes; the backend converts them to real newlines. Never commit the JSON key or environment files.
7. Share your spreadsheet with the service account email as Editor. Set `GOOGLE_SHEET_ID` and the exact `GOOGLE_SHEET_TAB_NAME`. No API key or public sharing is needed.

## Gmail SMTP setup

Set `BUSINESS_EMAIL`, `EMAIL_FROM`, and `EMAIL_REPLY_TO` to `pasmanjitukumar@gmail.com`. Set `BRAND_NAME=SastoKinBech`. Use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` as your Gmail address, and `SMTP_PASS` as a Gmail App Password from an account with two-step verification. Port 587 uses required STARTTLS. This project uses SMTP; `EMAIL_SERVICE_API_KEY` is reserved and unused. A normal Gmail account password is not the SMTP credential.

## Order processing

Checkout POSTs name, phone, email, exact location, product ID, quantity, delivery area, optional preferences and a random request reference to `/api/order`. The server ignores client prices and calculates totals from the catalog, including Rs. 100 inside Kathmandu Valley or Rs. 150 outside. Quantity is restricted to integers 1–20. Customer input is validated and escaped in emails; Sheets uses RAW writes to avoid formula execution. Private credentials and the spreadsheet ID stay server-side.

The backend saves a New Order row, sends the business HTML email, records that stage, sends the customer HTML email, and records that stage. It responds with success only after all stages complete. Thank-you details are stored in session storage and contain no contact details. On a partial email failure, checkout stays visible and reports the saved order ID. Retry without changing details resumes remaining stages. Changing details requires reloading checkout for a fresh reference.

Retry limits: Google Sheets is not a transactional database. The in-process lock prevents concurrent processing within one server instance; a simultaneous identical request across multiple Vercel instances can still race. SMTP acceptance followed by a failed Sheets marker write can also lead to a repeated email on retry. For strict distributed exactly-once order creation, add a transactional database with a unique request key and an email outbox before high-volume deployment. SMTP acceptance does not guarantee inbox delivery. This implementation must not be represented as guaranteeing exactly-once delivery.

## Verification

Run `npm test` and `npm run build`. Tests verify validation, authoritative prices, write-before-email sequencing, retry behavior, partial failure recovery and reference conflicts using fake services. They do not verify real credentials.

For an end-to-end live test: configure credentials, turn demo mode off, restart, place a single quantity-1 order using an email address you control, check the A:P row, verify both Gmail and customer inboxes/spam folders, and verify thank-you totals. Retry the same completed request to confirm no new row or emails. To test failures, use invalid credentials: checkout must display an error and remain on the form. Restore credentials afterward. Do not use other people's contact information for testing.

## Vercel later

Push this directory to a private repository and import it into Vercel with the Next.js preset. If this project sits in a larger repository, choose `sasto-funnel` as Root Directory. Add all `.env.example` variables in project settings, using the real domain for `NEXT_PUBLIC_SITE_URL` and `FRONTEND_URL`; set `DEMO_MODE=false`. Store the private key as multiline text or escaped `\n`. Build with `npm run build`; deploy. The API uses Node.js runtime and a 60-second maximum duration, subject to your Vercel plan. Use HTTPS, replace sample testimonials, confirm product availability and policy copy, and repeat the live end-to-end order test before sharing the site.

References: https://nextjs.org/docs/app/getting-started/route-handlers and https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append

## Current connection setup

The local environment now uses the supplied service account and Gmail app password, stored only in ignored `.env.local`. Demo mode is off. Gmail uses port 587 with required STARTTLS. Business notifications go to `pasmanjitukumar@gmail.com`; customer confirmations go to the checkout email address. Connection-test emails are labeled and are not orders.

The authorized order destination is a dedicated `SastoKinBech Orders` tab inside the supplied spreadsheet. Run `node scripts/setup-orders-sheet.mjs` after the service account has Editor access. It creates or formats only that tab and validates existing headers before changing them. Other tabs remain unchanged. The setup includes a plum header, white/blush alternating rows, frozen header and order ID column, filters, status dropdowns with conditional colors, NPR currency formats, Nepal-local sortable dates, and hidden technical retry columns.

The updated A:S schema appends `Delivery Fee`, `Delivery Area`, and `Color / Size Preferences` to the original A:P columns. The blank Notes column remains available for staff. Date & Time is now a numeric Sheets serial in Nepal local time, displayed as `dd mmm yyyy, hh:mm`.

Safe connection diagnostics: `node scripts/check-sheet-permissions.mjs` reports Google's `canEdit` flag. `node preflight.mjs` checks Sheets reading and Gmail login without sending emails. `node scripts/test-email-connection.mjs` sends two clearly labeled connection-test emails to the business address; run only when deliberately testing email delivery. On this Windows host, start Node with trusted system CAs if needed: `$env:NODE_USE_SYSTEM_CA='1'` before running the scripts or dev server. Certificate checking remains enabled.

The service account must have Editor access on the exact spreadsheet ID. A successful read or public link does not prove write access. Until setup succeeds, API submission must return an error rather than claim a completed order.
 
## Live setup verified

The current local configuration uses the supplied SastoKinBech spreadsheet and its dedicated SastoKinBech Orders tab. The service account has Editor access. The order flow was run successfully: a labeled integration test row was written, both email delivery steps were recorded as sent, and the test row was marked Cancelled with a do-not-fulfil note. Both test messages went to the supplied business inbox. Rotate the credentials shared in chat before deployment.
