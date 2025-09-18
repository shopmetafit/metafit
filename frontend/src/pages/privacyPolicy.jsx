// src/pages/PrivacyPolicy.jsx
import React from "react";

export default function privacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective Date: August 27, 2025
        </p>

        {/* Section 1 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            1. Data Collection
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>We collect personal data (e.g., name, address) with explicit consent.</li>
            
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            2. Use & Sharing
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Data is used for orders, marketing (opt-in), and fraud prevention.</li>
            <li>Shared only with trusted partners, never sold.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            3. Security & Rights
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Data is stored securely with encryption.</li>
            <li>Customers can request access or deletion of their data.</li>
            <li>Breaches, if any, will be reported as per Indian law.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            4. Cookies & Children’s Privacy
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Cookies help improve experience; can be managed by users.</li>
            <li>No data is knowingly collected from children under 13.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            5. Updates
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Changes will be posted online.</li>
            <li>
              Queries:{" "}
              <a
                href="mailto:metafitw@gmail.com"
                className="text-blue-600 hover:underline"
              >
                metafitw@gmail.com
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
