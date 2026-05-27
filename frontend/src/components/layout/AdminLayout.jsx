import React, { useState } from 'react'
import { Menu, X, BarChart3, FileText, Image, Users, Settings } from 'lucide-react'

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin' },
    { icon: FileText, label: 'Posts', href: '/admin/posts' },
    { icon: Image, label: 'Media', href: '/admin/media' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && <h2 className="font-bold text-lg">Tayama CMS</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="mt-8">
          {menuItems.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800 transition-colors"
            >
              <Icon size={24} />
              {sidebarOpen && <span>{label}</span>}
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout