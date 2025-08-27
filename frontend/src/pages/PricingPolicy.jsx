import React from "react";

const PricingPolicy = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-gray-800">
      {/* Page Header */}
      <h1 className="text-4xl font-bold mb-6 text-center text-teal-700">
        Pricing Policy
      </h1>
      <p className="text-sm text-gray-500 mb-8 text-center">
        Effective Date: August 27, 2025
      </p>

      {/* Introduction */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
        <p>
          Romeja Wellness LLP, operating under the brand{" "}
          <strong>mWellnessBazaar (mwellnessbazaar.com)</strong>, maintains
          transparent, fair, and competitive pricing for wellness products,
          including supplements, fitness tools, and digital resources. This
          policy complies with the Consumer Protection Act, 2019 and the
          E-Commerce Rules, 2020, ensuring transparency, fairness, and consumer
          protection.
        </p>
      </section>

      {/* Sections */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          1. Pricing Structure & Transparency
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            All prices are in INR and exclusive of GST unless otherwise stated.
            Final checkout prices include taxes, shipping, and handling fees.
          </li>
          <li>
            Prices are based on production costs, supplier pricing, demand, and
            operational expenses.
          </li>
          <li>
            Predatory pricing practices (e.g., misleading flash sales) are
            prohibited.
          </li>
          <li>
            International orders may incur customs duties/import fees, clearly
            shown at checkout.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          2. Discounts, Promotions & Fair Practices
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Discounts, loyalty programs, and coupons are subject to terms
            (validity, minimum purchase, etc.) and cannot be combined unless
            specified.
          </li>
          <li>No misleading advertising or inflated “original” prices.</li>
          <li>
            Bulk/wholesale pricing is available for verified institutions
            (contact: <a
              href="mailto:metafitw@gmail.com"
              className="text-teal-600 underline"
            >
              metafitw@gmail.com
            </a>
            ).
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          3. Payment Processing & Security
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Accepted methods: credit/debit cards, UPI, net banking, digital
            wallets.
          </li>
          <li>
            Payments are processed via PCI DSS-compliant gateways for security.
          </li>
          <li>
            Billing errors (e.g., overcharges) will be rectified within 7
            working days.
          </li>
          <li>KYC verification may be required for high-value transactions.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          4. Price Adjustments & Notifications
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Prices may change due to market/economic factors but do not affect
            confirmed orders.
          </li>
          <li>
            Customers will be notified of major changes at least 7 days in
            advance (where feasible).
          </li>
          <li>No post-purchase price matching or adjustments.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Dispute Resolution</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            For pricing grievances, contact:{" "}
            <a
              href="mailto:metafitw@gmail.com"
              className="text-teal-600 underline"
            >
              metafitw@gmail.com
            </a>{" "}
            (acknowledged in 48 hours, resolved within 30 days).
          </li>
          <li>
            Unresolved matters may be escalated to consumer forums under Indian
            law.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          6. Limitation of Liability
        </h2>
        <p>
          Liability for pricing errors is limited to the product’s purchase
          price.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">7. Updates</h2>
        <p>
          This policy may be revised. Continued use of the site implies
          acceptance.
        </p>
      </section>
    </div>
  );
};

export default PricingPolicy;
