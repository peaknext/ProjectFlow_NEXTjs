import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { TaskPanel } from "@/components/task-panel";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { CreateProjectModal } from "@/components/modals/create-project-modal";
import { CreateUserModal } from "@/components/modals/create-user-modal";
import { EditUserModal } from "@/components/modals/edit-user-modal";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
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

        {/* Global Create Task Modal - Opens when UIStore.createTaskModal.isOpen = true */}
        <CreateTaskModal />

        {/* Global Create Project Modal - Opens when UIStore.createProjectModal.isOpen = true */}
        <CreateProjectModal />

        {/* Global Create User Modal - Opens when UIStore.createUserModal.isOpen = true */}
        <CreateUserModal />

        {/* Global Edit User Modal - Opens when UIStore.editUserModal.isOpen = true */}
        <EditUserModal />

        {/* Toast Notifications */}
        <Toaster
          toastOptions={{
            style: {
              fontFamily: "var(--font-sarabun), sans-serif",
            },
          }}
        />
      </div>
    </AuthGuard>
  );
}
