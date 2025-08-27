// src/pages/ShippingPolicy.jsx
import React from "react";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Shipping Policy</h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective Date: August 27, 2025
        </p>

        {/* Introduction */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Introduction</h2>
          <p className="text-gray-600">
            mWellnessBazaar ensures safe, timely delivery of products, in
            compliance with the Consumer Protection Act, 2019 and E-Commerce
            Rules, 2020.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            1. Shipping Eligibility & Methods
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              We ship within India and select international destinations via
              partners (e.g., India Post, Delhivery).
            </li>
            <li>
              Digital products are delivered instantly by secure email/download
              link.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            2. Processing & Timelines
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Orders processed within 2–3 working days post-payment.</li>
            <li>
              Deliveries: 10–20 working days (India); international orders may
              take longer due to customs.
            </li>
            <li>Tracking details are shared via email.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            3. Shipping Costs
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              Fees depend on weight, destination, and method, shown at checkout.
            </li>
            <li>
              Free shipping may apply for promotional thresholds (e.g., orders
              over ₹1,000).
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            4. Risk Transfer
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Risk of loss passes to customers once handed to courier.</li>
            <li>We assist with transit-damage claims.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            5. Modifications & Cancellations
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Address changes not possible post-shipment.</li>
            <li>
              Pre-shipment modifications allowed if requested within 1 hour of
              order.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            6. Grievances
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              Contact{" "}
              <a
                href="mailto:metafitw@gmail.com"
                className="text-blue-600 hover:underline"
              >
                metafitw@gmail.com
              </a>
              . Complaints acknowledged within 48 hours, resolved within 30
              days.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            7. Force Majeure
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              Delays from uncontrollable events (e.g., natural disasters) are
              not our liability, but updates will be shared promptly.
            </li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">8. Updates</h2>
          <p className="text-gray-600">
            Revisions will be posted on our website.
          </p>
        </section>

      </div>
    </div>
  );
}
