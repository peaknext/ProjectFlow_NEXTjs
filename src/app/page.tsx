import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <CardTitle className="text-4xl">ProjectFlow</CardTitle>
          <CardDescription className="text-lg">
            Next.js Project Management System - Migration in Progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Technology Stack */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Technology Stack</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Next.js 15</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="outline">React 19</Badge>
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Tailwind CSS</Badge>
              <Badge className="bg-green-500 hover:bg-green-600 text-white">shadcn/ui</Badge>
              <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Prisma</Badge>
              <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white">PostgreSQL</Badge>
            </div>
          </div>

          {/* Priority Colors from GAS */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Priority Colors (from GAS App)</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="priority-urgent">Urgent Priority</Badge>
              <Badge variant="outline" className="priority-high">High Priority</Badge>
              <Badge variant="outline" className="priority-normal">Normal Priority</Badge>
              <Badge variant="outline" className="priority-low">Low Priority</Badge>
            </div>
          </div>

          {/* API Status */}
          <div>
            <h2 className="text-lg font-semibold mb-3">API Status</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Database: PostgreSQL (Render.com)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Prisma Client: Generated</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>API Routes: Ready</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Authentication: Configured</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Permissions: RBAC (6 levels)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Tailwind CSS + shadcn/ui: Configured</span>
              </li>
            </ul>
          </div>

          {/* Available Endpoints */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Available Endpoints</h2>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code>/api/auth/login</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code>/api/auth/logout</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/api/users/me</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/api/tasks</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/api/health</code>
              </div>
            </div>
          </div>

          {/* Button Variants Test */}
          <div>
            <h2 className="text-lg font-semibold mb-3">UI Components Test</h2>
            <div className="flex flex-wrap gap-3">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          {/* Migration Progress */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <h3 className="font-semibold mb-2">Migration Progress</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Phase 1: Infrastructure & Core Setup
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Database Migration (19 tables)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>API Routes Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Tailwind + shadcn/ui Configuration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Theme Provider (Dark Mode Toggle)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">⏳</span>
                <span>Layout Components (Navbar, Sidebar)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">⏸️</span>
                <span>Task Management Views</span>
              </div>
            </div>
          </div>

          {/* Documentation Links */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              📖 Documentation: <code className="text-xs bg-muted px-2 py-1 rounded">/src/app/api/README.md</code>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              🧪 Test API: <code className="text-xs bg-muted px-2 py-1 rounded">/test-api.http</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
