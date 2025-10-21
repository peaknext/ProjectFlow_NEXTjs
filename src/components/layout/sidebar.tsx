"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  BarChart3,
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SyncStatusFooter } from "@/components/layout/sync-status-footer"

const mainNavigation = [
  {
    name: "แดชบอร์ด",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "งาน",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "โปรเจค",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "รายงาน",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "บุคลากร",
    href: "/personnel",
    icon: Users,
  },
]

// Mock workspace data - จะเชื่อมกับ API ภายหลัง
const workspaces = [
  {
    id: 1,
    name: "กลุ่มภารกิจด้านพัฒนาการ",
    icon: Building2,
    children: [
      { id: 11, name: "โครงการพัฒนาระบบสารสนเทศโรงพยาบาล" },
      { id: 12, name: "โครงการปรับปรุงโครงสร้างพื้นฐานไอที" },
      { id: 13, name: "โครงการอบรมเจ้าหน้าที่" },
    ],
  },
  {
    id: 2,
    name: "กลุ่มภารกิจด้านบริการระบบเภสัชกรรม",
    icon: Building2,
    children: [
      { id: 21, name: "โครงการระบบจัดการคลังยา" },
      { id: 22, name: "โครงการตรวจสอบปฏิสัมพันธ์ยา" },
      { id: 23, name: "โครงการควบคุมยาเสพติด" },
      { id: 24, name: "โครงการติดตามการใช้ยา" },
    ],
  },
  {
    id: 3,
    name: "กลุ่มภารกิจด้านระบบฐานข้อมูลและโครงการพิเศษ",
    icon: Building2,
    children: [
      { id: 31, name: "โครงการฐานข้อมูลผู้ป่วย" },
      { id: 32, name: "โครงการ Data Warehouse" },
      { id: 33, name: "โครงการ Business Intelligence" },
    ],
  },
  {
    id: 4,
    name: "กลุ่มภารกิจด้านเทคโนโลยีสารสนเทศ",
    icon: Building2,
    children: [
      { id: 41, name: "โครงการ Cloud Migration" },
      { id: 42, name: "โครงการ Security Enhancement" },
      { id: 43, name: "โครงการ Network Infrastructure" },
      { id: 44, name: "โครงการ Backup & Recovery" },
    ],
  },
  {
    id: 5,
    name: "กลุ่มภารกิจด้านบริการและสนับสนุน",
    icon: Building2,
    children: [
      { id: 51, name: "โครงการ Help Desk System" },
      { id: 52, name: "โครงการ IT Asset Management" },
    ],
  },
  {
    id: 6,
    name: "กลุ่มภารกิจด้านวิจัยและพัฒนา",
    icon: Building2,
    children: [
      { id: 61, name: "โครงการ AI สำหรับการวินิจฉัยโรค" },
      { id: 62, name: "โครงการ Telemedicine" },
      { id: 63, name: "โครงการ IoT ในโรงพยาบาล" },
    ],
  },
  {
    id: 7,
    name: "กลุ่มภารกิจด้านคุณภาพและมาตรฐาน",
    icon: Building2,
    children: [
      { id: 71, name: "โครงการ ISO Certification" },
      { id: 72, name: "โครงการ Quality Improvement" },
    ],
  },
  {
    id: 8,
    name: "กลุ่มภารกิจด้านการเงินและบัญชี",
    icon: Building2,
    children: [
      { id: 81, name: "โครงการระบบการเงิน" },
      { id: 82, name: "โครงการระบบบัญชี" },
      { id: 83, name: "โครงการจัดซื้อจัดจ้าง" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<number[]>([1])

  const toggleWorkspace = (id: number) => {
    setExpandedWorkspaces((prev) =>
      prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Main Navigation - Fixed */}
      <nav className="flex flex-col gap-2 px-4 pt-4 pb-4">
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  isActive
                    ? "bg-primary text-white hover:bg-primary/90 hover:text-white"
                    : "hover:bg-primary/10"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium text-base">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Workspace Section Header - Fixed */}
      <div className="bg-muted px-4 py-2 border-y">
        <div className="text-xs font-semibold uppercase tracking-wider">
          WORKSPACE
        </div>
      </div>

      {/* Workspace List - Scrollable */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-2 space-y-1">
          {workspaces.map((workspace) => (
            <div key={workspace.id}>
              <button
                className="w-full flex items-start gap-2 h-auto py-2 px-3 text-left hover:bg-accent rounded-md transition-colors"
                onClick={() => toggleWorkspace(workspace.id)}
              >
                {expandedWorkspaces.includes(workspace.id) ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                )}
                <workspace.icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm break-words flex-1 min-w-0">
                  {workspace.name}
                </span>
              </button>

              {/* Children projects */}
              {expandedWorkspaces.includes(workspace.id) &&
                workspace.children.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {workspace.children.map((child) => (
                      <Link key={child.id} href={`/projects/${child.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-auto py-2 whitespace-normal"
                        >
                          <span className="text-sm break-words text-left w-full">
                            {child.name}
                          </span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer - Fixed with Sync Status */}
      <SyncStatusFooter />
    </div>
  )
}
