import Link from 'next/link';

export const metadata = { title: 'Application received | SastoKinBech' };

export default function SellerThanks() {
  return <main className="section thank-you seller-thanks">
    <span className="success-icon">✓</span>
    <p className="eyebrow">SELLER APPLICATION RECEIVED</p>
    <h1>Thank you for<br/><em>reaching out.</em></h1>
    <p>Our team will review your shop and first product details, then contact you about the next step.</p>
    <Link className="button" href="/">Back to SastoKinBech ↗</Link>
  </main>;
}
