"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Search, ChevronDown, User, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Mock user data - จะเชื่อมกับ API ภายหลัง
const currentUser = {
  name: "นพ.เกียรติศักดิ์ พรหมแสนคา",
  email: "pkornext@gmail.com",
  role: "Admin",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  department: "กลุ่มภารกิจด้านพัฒนาการ",
};

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="flex h-16 items-center px-6 justify-between">
        {/* Logo - Left */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold flex-shrink-0"
        >
          <Image
            src="/ProjectFlowLogo.svg"
            alt="ProjectFlows"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="text-lg">ProjectFlows</span>
        </Link>

        {/* Center - Search & Quick Filters */}
        <div className="flex items-center gap-4 flex-1 justify-center max-w-3xl mx-auto">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ค้นหา..."
              className="pl-10 bg-muted/50"
            />
          </div>

          {/* Quick Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="text-sm">Quick Filters</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>กรองข้อมูล</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>ผู้รับผิดชอบ</DropdownMenuItem>
              <DropdownMenuItem>สถานะ</DropdownMenuItem>
              <DropdownMenuItem>ความสำคัญ</DropdownMenuItem>
              <DropdownMenuItem>วันสิ้นสุด</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side - Notifications, Profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-base">การแจ้งเตือน</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {/* Notification items */}
                {[
                  {
                    id: 1,
                    type: "task",
                    title: 'งาน: "ซ่อม Widget เมื่อไม่มีหน้าที่เกินกำหนด"',
                    description: "จะครบกำหนดในอีก 4 วัน",
                    time: "12 ชั่วโมงที่แล้ว",
                    unread: true,
                  },
                  {
                    id: 2,
                    type: "task",
                    title: 'งาน: "เพิ่มการบันทึก DepartmentID"',
                    description: "จะครบกำหนดในอีก 4 วัน",
                    time: "12 ชั่วโมงที่แล้ว",
                    unread: true,
                  },
                  {
                    id: 3,
                    type: "comment",
                    user: "นพ.เกียรติศักดิ์ พรหมแสนคา",
                    title: "ได้แอบมาบอก",
                    description: 'งาน: "MOPH ERP" ให้กับคุณ',
                    time: "1 วันที่แล้ว",
                    unread: false,
                  },
                  {
                    id: 4,
                    type: "comment",
                    user: "นพ.เกียรติศักดิ์ พรหมแสนคา",
                    title: "ได้แอบมาบอก",
                    description: 'งาน: "ปรับแก้รา RCM" ให้กับคุณ',
                    time: "1 วันที่แล้ว",
                    unread: false,
                  },
                  {
                    id: 5,
                    type: "comment",
                    user: "นพ.เกียรติศักดิ์ พรหมแสนคา",
                    title: "ได้แอบมาบอก",
                    description: 'งาน: "ระบบเว็บไซต์สำหรับรอง Wordpress" ให้กับคุณ',
                    time: "1 วันที่แล้ว",
                    unread: false,
                  },
                ].map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 ${
                      notification.unread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        {notification.type === "task" ? (
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        ) : (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                            <AvatarFallback>N</AvatarFallback>
                          </Avatar>
                        )}
                        {notification.unread && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {notification.user && (
                          <p className="font-semibold text-sm mb-0.5">
                            {notification.user} {notification.title}
                          </p>
                        )}
                        {notification.type === "task" && (
                          <p className="font-medium text-sm mb-0.5">{notification.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <button className="text-sm text-primary hover:underline w-full text-center">
                  ข้อมูลการกำหนดทั้งหมด
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[290px]">
              <div className="flex items-center gap-4 p-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser.email}
                  </p>
                  <Badge variant="outline" className="mt-1.5 text-xs">
                    {currentUser.role}
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem className="py-3 px-4 pl-5">
                  <User className="h-4 w-4 mr-3" />
                  ตั้งค่าโปรไฟล์
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="py-3 px-4 pl-5"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Moon className="h-4 w-4 mr-3" />
                  <span className="flex-1">สลับธีม</span>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                  />
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem
                  className="text-red-600 py-3 px-4 pl-5 cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
