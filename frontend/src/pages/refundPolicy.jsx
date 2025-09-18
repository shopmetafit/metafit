// src/pages/refundPolicy.jsx
import React from "react";

export default function refundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Cancellation & Refund Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective Date: August 27, 2025
        </p>

        {/* Section 1 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            1. Cancellations
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>No cancellations are allowed.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            2. Refunds & Returns
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>No refunds/returns are allowed.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            3. Exceptions
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              Digital items: replacement if defective/unusable (within 7 days).
            </li>
            <li>
              Physical items: replacement if damaged, reported within 48 hours
              of delivery.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            4. Grievances
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>
              Complaints:{" "}
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

        {/* Section 5 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            5. Updates
          </h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Policy may change; updates will be posted online.</li>
          </ul>
        </section>

      </div>
    </div>
  );
}


