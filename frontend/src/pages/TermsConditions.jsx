// src/pages/TermsConditions.jsx
import React from "react";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Terms & Conditions
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective Date: August 27, 2025
        </p>

        {/* Section 1 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            1. Acceptance
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              By using this site, you agree to these terms. Users must be 18+
              years old.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            2. Products & Use
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              Information is for wellness purposes only; not medical advice.
              Consult professionals before use.
            </li>
            <li>Accuracy is ensured but variations may occur.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            3. Orders & Payments
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Orders are binding contracts upon confirmation.</li>
            <li>We may cancel due to stock or technical issues.</li>
            <li>
              Payments are processed securely, with explicit consent required.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            4. Intellectual Property & Conduct
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              All site content belongs to Romeja Wellness LLP. Unauthorized use
              prohibited.
            </li>
            <li>Fraudulent or unlawful activities are forbidden.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            5. Liability & Indemnity
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Liability is limited to order value.</li>
            <li>
              Customers indemnify mWellnessBazaar against misuse-related claims.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            6. Dispute Resolution
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Goverened by Indian law. Jurisdiction: Udaipur, Rajasthan.</li>
            <li>
              Grievance redressal:{" "}
              <a
                href="mailto:metafitw@gmail.com"
                className="text-blue-600 hover:underline"
              >
                metafitw@gmail.com
              </a>{" "}
              (resolved within 30 days).
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            7. Updates
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              Terms may be revised; continued use of the site means acceptance.
            </li>
          </ul>
        </section>

      </div>
    </div>
  );
}
