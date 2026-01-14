import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="text-3xl font-extrabold">Privacy Policy</div>
      <div className="mt-3 text-gray-700 leading-relaxed">
        <p className="mt-3">
          We collect information you submit in the app such as name, phone number, email, city, job role, and job description.
          This information is used to display job postings and allow users to contact the poster.
        </p>
        <p className="mt-3">
          We do not guarantee identity verification. Users should be cautious when sharing personal information and contacting others.
        </p>
        <p className="mt-3">
          Data may be removed automatically after a limited time period. Some information can remain in local device cache.
        </p>
        <p className="mt-3">
          If you want your data removed immediately, contact the app owner.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link to="/terms" className="flex-1 text-center bg-gray-50 border rounded-2xl py-3 font-extrabold text-gray-800">
          Terms
        </Link>
        <Link to="/" className="flex-1 text-center bg-green-600 text-white rounded-2xl py-3 font-extrabold">
          Back to App
        </Link>
      </div>
    </div>
  );
}
