import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="text-3xl font-extrabold">Terms of Use</div>
      <div className="mt-3 text-gray-700 leading-relaxed">
        <p className="mt-3">
          The app provides a platform to publish and browse job postings. We are not responsible for the accuracy of postings,
          user behavior, payments, or disputes.
        </p>
        <p className="mt-3">
          Users must not post illegal, misleading, or harmful content. We may remove content if required.
        </p>
        <p className="mt-3">
          By using the app you agree to use it responsibly and comply with local laws and regulations.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link to="/privacy" className="flex-1 text-center bg-gray-50 border rounded-2xl py-3 font-extrabold text-gray-800">
          Privacy
        </Link>
        <Link to="/" className="flex-1 text-center bg-green-600 text-white rounded-2xl py-3 font-extrabold">
          Back to App
        </Link>
      </div>
    </div>
  );
}
