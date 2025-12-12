import React from "react";

const VerifiedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-2xl font-semibold mb-4">Email verified ✅</h1>
      <p className="text-lg text-slate-700 mb-6">
        Your email has been verified. You can now log in.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Go to login
      </a>
    </div>
  );
};

export default VerifiedPage;
