import React from 'react'
import { ReactNode } from 'react'
import { FileText } from "lucide-react"

interface HeaderProps {
  icon?: ReactNode;
  activeTab?: 'dashboard' | 'sops' | 'workflows' | 'settings';
}

export function Header({ icon = <FileText />, activeTab = 'dashboard' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
        {React.cloneElement(icon as React.ReactElement, { 
          className: "h-6 w-6 text-emerald-600" 
        })}
        <span className="text-lg font-semibold">AI Finance Ops Assistant</span>
      </div>
      <nav className="ml-auto flex gap-4">
        {['dashboard', 'sops', 'workflows', 'settings'].map((tab) => (
          <a 
            key={tab}
            className={`text-sm font-medium ${activeTab === tab ? 'text-emerald-600' : ''}`} 
            href={`/${tab === 'dashboard' ? '' : tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </a>
        ))}
      </nav>
    </header>
  )
} 