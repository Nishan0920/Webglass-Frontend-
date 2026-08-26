import React, { useState } from "react";
import { createPortal } from "react-dom";

const GetSupport = ({ onClose }) => {
  const [showNumbers, setShowNumbers] = useState(false);

  const phoneNumbers = ["9779800000000", "9779811111111", "9779822222222"];

  const handleClose = () => {
    setShowNumbers(false);

    if (onClose) {
      onClose();
    }
  };

  const supportModal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-visible rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close support"
          className="absolute right-4 top-4 z-[10000] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>

        {}
        <div className="rounded-t-2xl bg-gradient-to-b from-blue-50 to-white px-6 pb-8 pt-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Get Support</h1>

          <p className="mt-2 text-sm text-gray-500">
            We're here to help. Get in touch with our support team.
          </p>
        </div>

        {}
        <div className="px-6 pb-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">
              How can we help you?
            </h2>

            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-blue-600" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {}
            <div className="flex min-h-[250px] flex-col rounded-xl border border-gray-200 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
                ✉️
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Contact Support
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Can't find what you're looking for? Send us a message and we'll
                get back to you.
              </p>

              <button
                type="button"
                className="mt-auto w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Contact Us
              </button>
            </div>

            {}
            <div className="flex min-h-[250px] flex-col rounded-xl border border-gray-200 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
                💬
              </div>

              <h3 className="text-lg font-semibold text-gray-900">WhatsApp</h3>

              <p className="mt-2 text-sm text-gray-500">
                Contact us directly through WhatsApp using one of our support
                numbers.
              </p>

              {}
              <div className="relative mt-auto">
                <button
                  type="button"
                  onClick={() => setShowNumbers((previous) => !previous)}
                  className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  {showNumbers ? "Hide Numbers" : "Contact To"}
                </button>

                {}
                {showNumbers && (
                  <div
                    className="absolute bottom-full left-0 z-[100] mb-2 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="mb-2 text-left text-xs font-medium text-gray-500">
                      Select WhatsApp Number
                    </p>

                    <div className="space-y-2">
                      {phoneNumbers.map((number) => (
                        <a
                          key={number}
                          href={`https://wa.me/${number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 hover:text-blue-600"
                        >
                          {number}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(supportModal, document.body);
};

export default GetSupport;
