"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, User, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notifications";
import { FiscalYearFilter } from "@/components/filters/fiscal-year-filter";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

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

        {/* Center - Search */}
        {/* TODO: Global Search - To be implemented in next version
            - Search across tasks, projects, users
            - Advanced filters and search syntax
            - Search history and suggestions
            - Keyboard shortcut (Cmd/Ctrl + K)
        */}
        {/* <div className="flex items-center gap-4 flex-1 justify-center max-w-3xl mx-auto">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ค้นหา..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </div> */}

        {/* Right Side - Fiscal Year Filter, Notifications, Profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Fiscal Year Filter - Desktop only */}
          <div className="hidden md:flex">
            <FiscalYearFilter />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0"
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
                <DropdownMenuItem className="py-3 px-4 pl-5" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-3" />
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
