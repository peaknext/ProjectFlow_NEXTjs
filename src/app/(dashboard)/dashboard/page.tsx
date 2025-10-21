'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateTaskButton } from "@/components/common/create-task-button"
import { TrendingUp, CheckCircle2, AlertTriangle, Calendar as CalendarIcon, Settings2 } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">แดชบอร์ดของฉัน</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-2" />
            ตัวกรอง
          </Button>
          <CreateTaskButton onClick={() => {
            // TODO: Open create task modal
            console.log('Create task clicked');
          }} />
        </div>
      </div>

      {/* Stats Cards - 4 columns */}
      <div className="grid gap-6 grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">งานทั้งหมด</p>
                <p className="text-3xl font-bold">7</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500 font-medium">+12%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">งานที่เสร็จแล้ว</p>
                <p className="text-3xl font-bold">0</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">ไม่มีงานที่เกินกำหนด</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">งานเกินกำหนด</p>
                <p className="text-3xl font-bold">0</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">ไม่มีงานที่เกินกำหนด</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">งานสัปดาห์นี้</p>
                <p className="text-3xl font-bold">4</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">กำลังดำเนินการ</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Layout - 3 columns (2:1 ratio) */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column (2/3 width) */}
        <div className="col-span-2 space-y-8">
          {/* งานเกินกำหนด */}
          <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 dark:text-red-400 mb-1">งานเกินกำหนด</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">ไม่มีงานที่เกินกำหนด</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* งานของฉัน */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>งานของฉัน</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-xs">ทั้งหมด</Button>
                  <Button variant="ghost" size="sm" className="text-xs">กำลังผลักดัน</Button>
                  <Button variant="ghost" size="sm" className="text-xs">กำลังทำ</Button>
                  <Button variant="ghost" size="sm" className="text-xs">ไม่ผลักดันแล้ว</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Empty state */}
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">ไม่มีงานที่เกินกำหนด</p>
              </div>
            </CardContent>
          </Card>

          {/* งานของฉัน (list) */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>งานของฉัน</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  { title: "แก้ไขให้", date: "30 ต.ค. 2568", badge: "ทำงาน" },
                  { title: "ทดสอบแพลนฟอร์ม", date: "21 ต.ค. 2568", badge: "ทำงาน" },
                  { title: "ทดสอบระบบเปลี่ยนรูปแบบ", date: "30 ต.ค. 2568", badge: "ทำงาน" },
                  { title: "ทดสอบหน้าแสดงผลหลัก", date: "23 ต.ค. 2568", badge: "ทำงาน" },
                ].map((task, index) => (
                  <div key={index} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border-2 border-muted-foreground/30"></div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">โครงการ 1 Province 1 ICU ปี 2569</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{task.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ตุลาคม 2568</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simple calendar placeholder */}
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, i) => (
                  <div key={i} className="text-xs font-medium text-muted-foreground">{day}</div>
                ))}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <div
                    key={day}
                    className={`
                      py-1 rounded
                      ${day === 20 ? 'bg-primary text-white font-bold' : ''}
                      ${[12, 13, 14, 15, 16, 17, 18].includes(day) ? 'bg-muted' : ''}
                    `}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-muted-foreground">เกินกำหนด</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-muted-foreground">ครบกำหนด</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ความเคลื่อนไหวล่าสุด */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ความเคลื่อนไหวล่าสุด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  user: "เพิ่มความถังเห็นนึก DepartmentID",
                  action: "บทความถูสีทะเบิซัดไอส์ดีอริงไนต์ 'เพิ่มความถังเห็นนึก DepartmentID'",
                  time: "21 ชั่วโมงที่แล้ว",
                },
                {
                  user: "ชอบ Widget เมื่อไม่มีหน้าที่เกินกำหนด",
                  action: "บทความถูสีทะเบิซัดไอส์ดีอริงไนต์ 'ชอบ Widget เมื่อไม่มีหน้าที่เกินกำหนด'",
                  time: "21 ชั่วโมงที่แล้ว",
                },
              ].map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">N</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
