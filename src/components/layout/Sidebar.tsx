'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Map,
  TrendingUp,
  GitCompare,
  AlertTriangle,
  FileText,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  {
    href: '/',
    icon: LayoutDashboard,
    label: 'Overview',
    description: 'Dashboard summary',
  },
  {
    href: '/geographic',
    icon: Map,
    label: 'Geographic',
    description: 'Heat maps by state',
  },
  {
    href: '/macro',
    icon: TrendingUp,
    label: 'Macro Trends',
    description: 'Economic correlations',
  },
  {
    href: '/backtesting',
    icon: GitCompare,
    label: 'Backtesting',
    description: 'Predicted vs actual',
  },
  {
    href: '/pre-chargeoff',
    icon: AlertTriangle,
    label: 'Pre-Charge-Off',
    description: 'Warning signals',
  },
  {
    href: '/reports',
    icon: FileText,
    label: 'AI Reports',
    description: 'Generate reports',
  },
  {
    href: '/data',
    icon: Database,
    label: 'Data Explorer',
    description: 'View all data',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
        'bg-card border-r border-border',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CE</span>
            </div>
            <span className="font-semibold text-lg">CECL Monitor</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CE</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg hover:bg-accent transition-colors',
            collapsed && 'absolute -right-3 top-6 bg-card border border-border shadow-sm'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item group',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="glass-card p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              CECL Committee Dashboard
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Demo with synthetic data
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
