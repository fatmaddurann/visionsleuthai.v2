import React from "react";

export default function ContactPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded shadow">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">İletişim</h1>
        <div className="space-y-4 text-center">
          <p className="text-lg text-gray-700">
            Bizimle iletişime geçmek için aşağıdaki bilgileri kullanabilirsiniz:
          </p>
          <div className="flex flex-col items-center space-y-2">
            <span className="font-semibold">E-posta:</span>
            <a href="mailto:info@visionsleuth.com" className="text-blue-600 hover:underline">info@visionsleuth.com</a>
          </div>
          <div className="flex flex-col items-center space-y-2 mt-4">
            <span className="font-semibold">Telefon:</span>
            <a href="tel:+905312775292" className="text-blue-600 hover:underline">+90 531 277 52 92</a>
          </div>
        </div>
      </div>
    </div>
  );
} 