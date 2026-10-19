import Link from 'next/link';

export const metadata = {
  title: 'Sell with SastoKinBech',
  description: 'Apply to become a SastoKinBech seller and submit your first product for review.',
};

export default async function SellPage({ searchParams }) {
  const params = await searchParams;
  const error = typeof params?.error === 'string' ? params.error : '';
  return <main className="section seller-page">
    <Link className="text-link" href="/#collection">← Back to the collection</Link>
    <section className="seller-intro">
      <p className="eyebrow">GROW YOUR CLOTHING BUSINESS</p>
      <h1>Bring your shop<br/>to <em>SastoKinBech.</em></h1>
      <p>Tell us about your shop and submit one product to get started. Our team will review your details and contact you about the next step.</p>
    </section>
    <div className="seller-layout">
      <form className="seller-form" action="/api/seller-application" method="post">
        <h2>Your shop</h2>
        <div className="form-grid">
          <label>Shop name<input name="shopName" required minLength={2} maxLength={100} autoComplete="organization" placeholder="Your shop name"/></label>
          <label>Your name<input name="contactName" required minLength={2} maxLength={100} autoComplete="name" placeholder="Contact person"/></label>
          <label>Phone number<input name="phone" required type="tel" pattern="(\+977[ -]?)?[0-9 -]{7,15}" maxLength={25} autoComplete="tel" placeholder="98XXXXXXXX"/></label>
          <label>Email address<input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="you@example.com"/></label>
          <label>City or district<input name="location" required minLength={2} maxLength={160} placeholder="e.g. Kathmandu"/></label>
          <label>What do you sell?<input name="categories" required minLength={2} maxLength={200} placeholder="e.g. sarees, kurtis, shirts"/></label>
        </div>
        <h2 className="seller-product-heading">Your first product</h2>
        <div className="form-grid">
          <label>Product name<input name="productName" required minLength={2} maxLength={120} placeholder="Product name"/></label>
          <label>Price (NPR)<input name="productPrice" required inputMode="decimal" pattern="[0-9,]+(\.[0-9]{1,2})?" maxLength={20} placeholder="1999"/></label>
          <label className="full">Product description<textarea name="productDescription" required minLength={10} maxLength={1000} placeholder="Describe the design, available sizes, colors and other useful details."/></label>
          <label className="full">Product photo link (optional)<input name="productImage" type="url" maxLength={1000} placeholder="https://…"/><small>Or email the photo to pasmanjitukumar@gmail.com after submitting.</small></label>
        </div>
        <label className="seller-honeypot" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
        <p className="delivery-note">Submitting an application does not publish a product automatically. We review each shop and listing, then contact you by phone or email.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button wide" type="submit">Send seller application <span>↗</span></button>
      </form>
      <aside className="seller-aside">
        <p className="eyebrow">A SIMPLE START</p>
        <h3>Three easy steps</h3>
        <ol><li><span>01</span><div><strong>Share your details</strong><p>Tell us who you are and what your shop sells.</p></div></li><li><span>02</span><div><strong>Send a first listing</strong><p>Include a product name, price, description and a photo link if you have one.</p></div></li><li><span>03</span><div><strong>We’ll get in touch</strong><p>Our team will review your application and confirm the next steps.</p></div></li></ol>
        <a href="mailto:pasmanjitukumar@gmail.com">Questions? Email our team ↗</a>
      </aside>
    </div>
  </main>;
}
