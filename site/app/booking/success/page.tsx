export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Received!</h1>
        <p className="text-slate-500 text-base">
          Thank you — your payment is confirmed. You&rsquo;ll receive a confirmation email shortly.
        </p>
        <a href="/" className="mt-8 inline-block bg-sky-500 hover:bg-sky-400 text-white font-semibold px-6 py-2 rounded-full transition-colors text-sm">
          Back to Home
        </a>
      </div>
    </div>
  );
}
