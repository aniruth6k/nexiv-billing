// src/app/dashboard/page.tsx
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import RecentBills from "./components/RecentBills";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="p-6 space-y-6">
          <StatsCards />
          <RecentBills />
        </main>
      </div>
    </div>
  );
}
