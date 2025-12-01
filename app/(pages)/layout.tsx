import { TopNav } from "@/components/layout/TopNav";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <TopNav />
      {/* 
        We don't add padding/container here because some pages might want full width (like a dashboard).
        We let the pages handle their own inner layout constraints (max-w, px, etc).
      */}
      {children}
    </div>
  );
}



