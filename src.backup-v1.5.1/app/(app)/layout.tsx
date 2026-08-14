import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-x-hidden print:overflow-visible">
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 print:m-0 print:max-w-none print:p-0">
            <div className="animate-in">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
