import Link from "next/link";

import HomePage from "./home/page";

export default function RootPage() {
  return (
    <>
      <HomePage />
      <Link
        href="/workflow-generator"
        className="fixed left-6 bottom-6 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
      >
        Workflow Generator →
      </Link>
    </>
  );
}
