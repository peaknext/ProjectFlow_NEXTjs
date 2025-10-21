import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { TaskPanel } from "@/components/task-panel"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
            {children}
          </main>
        </div>

        {/* Global Task Panel - Opens when UIStore.taskPanel.isOpen = true */}
        <TaskPanel />
      </div>
    </AuthGuard>
  )
}
