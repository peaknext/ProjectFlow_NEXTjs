"use client";

import { Bell, LogOut, Moon, User as UserIcon, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { FiscalYearFilter } from "@/components/filters/fiscal-year-filter";

/**
 * IT Service Top Bar
 *
 * Clean top bar for USER role without sidebar
 * Shows: Logo, App Name, Notifications, User Dropdown
 * Shows back button when not on IT Service portal page
 */
export function ITServiceTopBar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: notificationsData } = useNotifications();

  // Check if user is on profile or settings page (show back button)
  const showBackButton = pathname && !pathname.startsWith('/it-service');

  const unreadCount = notificationsData?.notifications?.filter(
    (n) => !n.isRead
  ).length || 0;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        {/* Back Button (show when not on IT Service portal) */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/it-service')}
            className="mr-2 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Logo + App Name */}
        <Link
          href="/it-service"
          className="flex items-center gap-2 font-semibold flex-shrink-0"
        >
          <Image
            src="/ProjectFlowLogo.svg"
            alt="ProjectFlows"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <div>
            <h1 className="text-lg font-semibold">IT Service</h1>
            <p className="text-xs text-muted-foreground font-normal">
              ProjectFlows
            </p>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side - Fiscal Year Filter, Notifications + User Dropdown */}
        <div className="flex items-center gap-3">
          {/* Fiscal Year Filter */}
          <div className="hidden md:flex">
            <FiscalYearFilter />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-4">
                <h3 className="font-semibold">แจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} ใหม่</Badge>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-auto">
                {notificationsData?.notifications?.slice(0, 5).map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="cursor-pointer p-4"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notif.createdAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                {(!notificationsData?.notifications ||
                  notificationsData.notifications.length === 0) && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    ไม่มีการแจ้งเตือน
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/notifications"
                  className="w-full cursor-pointer p-4 text-center"
                >
                  ดูทั้งหมด
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      user?.profileImageUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "default"}`
                    }
                    alt={user?.fullName || "User"}
                  />
                  <AvatarFallback>
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[290px]">
              <div className="flex items-center gap-4 p-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={
                      user?.profileImageUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "default"}`
                    }
                    alt={user?.fullName || "User"}
                  />
                  <AvatarFallback>
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user?.fullName || "Loading..."}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || ""}
                  </p>
                  {user?.department?.name && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.department.name}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-1.5 text-xs">
                    {user?.role || "USER"}
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="py-1">
                {/* Show "Back to IT Service" link when not on portal page */}
                {showBackButton && (
                  <DropdownMenuItem className="py-3 px-4 pl-5" asChild>
                    <Link href="/it-service">
                      <ArrowLeft className="h-4 w-4 mr-3" />
                      กลับหน้าหลัก IT Service
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="py-3 px-4 pl-5" asChild>
                  <Link href="/profile">
                    <UserIcon className="h-4 w-4 mr-3" />
                    ตั้งค่าโปรไฟล์
                  </Link>
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
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
