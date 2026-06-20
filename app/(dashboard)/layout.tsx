import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-warm-white">
      <Sidebar />
      <main className="ml-[240px] min-h-full p-8">{children}</main>
    </div>
  );
}
