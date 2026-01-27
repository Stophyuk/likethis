'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavChild {
  href: string
  label: string
}

interface NavItem {
  href: string
  label: string
  icon: string
  children?: NavChild[]
}

interface NavMenuProps {
  items: NavItem[]
}

export function NavMenu({ items }: NavMenuProps) {
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  // Find which parent item is active based on current path
  const getActiveParent = () => {
    for (const item of items) {
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.href) {
            return item.href
          }
        }
      }
      if (pathname === item.href) {
        return item.href
      }
    }
    return null
  }

  const activeParent = getActiveParent()

  const handleToggle = (href: string) => {
    setExpandedItem(expandedItem === href ? null : href)
  }

  const isExpanded = (item: NavItem) => {
    if (expandedItem === item.href) return true
    // Auto-expand if a child is active
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }

  return (
    <nav className="flex-1 p-4 space-y-1">
      {items.map((item) => (
        <div key={item.href}>
          {/* Parent item */}
          {item.children ? (
            <button
              onClick={() => handleToggle(item.href)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeParent === item.href || isExpanded(item)
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded(item) ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )}

          {/* Children */}
          {item.children && isExpanded(item) && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    pathname === child.href
                      ? 'text-gray-900 bg-gray-100 font-medium'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

// Mobile navigation with horizontal scroll
export function MobileNavMenu({ items }: NavMenuProps) {
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const isActive = (item: NavItem) => {
    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }

  return (
    <div className="space-y-2 px-2 pb-2">
      {/* Main nav items */}
      <div className="flex overflow-x-auto gap-1 pb-1">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => {
              if (item.children) {
                setExpandedItem(expandedItem === item.href ? null : item.href)
              }
            }}
            className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isActive(item)
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.children ? (
              <span>{item.icon} {item.label}</span>
            ) : (
              <Link href={item.href}>
                {item.icon} {item.label}
              </Link>
            )}
          </button>
        ))}
      </div>

      {/* Expanded submenu */}
      {expandedItem && (
        <div className="flex overflow-x-auto gap-1 pl-4">
          {items
            .find(i => i.href === expandedItem)
            ?.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`flex-shrink-0 px-2 py-1 text-xs rounded transition-colors ${
                  pathname === child.href
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {child.label}
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
