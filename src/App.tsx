import { useEffect, useState } from 'react'
import { ConfigProvider, Layout, Menu, Badge, Button, App as AntApp, theme, Avatar, Space, Typography, Divider, Tooltip } from 'antd'
import { 
  Settings2, 
  ClipboardCheck, 
  Wrench, 
  AlertTriangle, 
  FileSpreadsheet, 
  User as UserIcon, 
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { useEquipmentStore } from './store/useStore'
import EquipmentListPage from './pages/EquipmentListPage'
import InspectionPage    from './pages/InspectionPage'
import SparePartsPage    from './pages/SparePartsPage'
import FailurePage       from './pages/FailurePage'
import LoginPage         from './pages/LoginPage'
import { authService }   from './utils/authService'
import type { User }      from './types'

const { Header, Sider, Content } = Layout
const { Text, Title } = Typography

type ViewKey = 'list' | 'insp' | 'spare' | 'fail'

const THEME_COLORS = {
  primary: '#4C9C2E',
  primaryDark: '#3a7a22',
  forest: '#2d5f1b',
  forestLight: '#3d7a25',
  paper: '#D1D5DB',
  bg: '#F3F4F6', // Lighter background
  gradient: 'linear-gradient(135deg, #4C9C2E 0%, #3a7a22 100%)'
}

const NAV: { key: ViewKey; label: string; sub: string; Icon: any; roles?: string[] }[] = [
  { key: 'list',  label: 'Danh sách thiết bị',   sub: 'Equipment List', Icon: Settings2, roles: ['admin', 'staff', 'user'] },
  { key: 'insp',  label: 'Kiểm tra bảo trì',     sub: 'Inspection',     Icon: ClipboardCheck, roles: ['admin', 'staff'] },
  { key: 'spare', label: 'Quản lý phụ tùng',     sub: 'Spare Parts',    Icon: Wrench, roles: ['admin', 'staff'] },
  { key: 'fail',  label: 'Báo cáo sự cố',       sub: 'Failure Logs',    Icon: AlertTriangle, roles: ['admin', 'staff', 'user'] },
]

function AppInner() {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser())
  const [view, setView] = useState<ViewKey>('list')
  const [collapsed, setCollapsed] = useState(false)
  
  // Update view if user role doesn't allow current view
  useEffect(() => {
    if (user) {
      const currentNav = NAV.find(n => n.key === view)
      if (currentNav?.roles && !currentNav.roles.includes(user.role)) {
        setView('list')
      }
    }
  }, [user, view])

  const { equipment, saveEquipment, deleteEquipment, exportExcel } = useEquipmentStore()
  const { message } = AntApp.useApp()

  if (!user) {
    return <LoginPage onLogin={(loggedUser) => setUser(loggedUser)} />
  }

  const handleLogout = () => {
    if (confirm('Bạn có muốn đăng xuất khỏi hệ thống?')) {
      authService.logout()
      setUser(null)
    }
  }

  const filteredNav = NAV.filter(n => !n.roles || n.roles.includes(user.role))

  const handleSave = (eq: Parameters<typeof saveEquipment>[0]) => {
    saveEquipment(eq)
    message.success('Đã lưu dữ liệu thành công!')
  }

  const handleDelete = (id: string) => {
    deleteEquipment(id)
    message.warning('Đã xóa bản ghi thiết bị')
  }

  const currentPage = NAV.find(n => n.key === view)

  return (
    <Layout style={{ minHeight: '100vh', background: THEME_COLORS.bg }}>
      {/* ── Sidebar ── */}
      <Sider
        width={250}
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{ 
          background: THEME_COLORS.primaryDark, 
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          border: 'none',
          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s'
        }}
        breakpoint="lg"
        collapsedWidth={60}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo Area */}
          <div style={{ 
            padding: collapsed ? '15px 0' : '15px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
          }}>
            <div style={{ textAlign: collapsed ? 'center' : 'left' }}>
              <img src="./images/logoW.png" alt="VINATech" style={{ height: collapsed ? 20 : 50, marginBottom: 8, display: 'inline-block', transition: 'all 0.2s' }} />
              {!collapsed && (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Equipment Management System
                </div>
              )}
            </div>
          </div>
          <hr/>

          {/* Navigation Menu */}
          <div style={{ flex: 1 }}>
            <Menu
              mode="inline"
              theme="dark"
              selectedKeys={[view]}
              onClick={({ key }) => setView(key as ViewKey)}
              style={{ background: 'transparent', border: 'none' }}
              items={filteredNav.map(n => ({
                key: n.key,
                icon: (
                  <Tooltip title={collapsed ? n.label : ''} placement="right">
                    <span><n.Icon size={20} /></span>
                  </Tooltip>
                ),
                label: (
                  <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 4 }}>
                    {n.label}
                    {n.key === 'list' && !collapsed && (
                      <Badge
                        count={equipment.length}
                        size="small"
                        style={{ marginLeft: 12, background: THEME_COLORS.primary, border: 'none', color: 'white' }}
                      />
                    )}
                  </span>
                ),
              }))}
            />
          </div>

          {/* User Section at Bottom */}
          <div style={{ 
            padding: collapsed ? '5px' : '8px', 
            background: 'rgba(255,255,255,0.05)', 
            borderTop: '1px solid rgba(255,255,255,0.1)',
            margin: collapsed ? '8px' : ' 8px',
            borderRadius: 16,
            transition: 'all 0.2s'
          }}>
            <Space align="center" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between' }}>
              <Space size={collapsed ? 0 : 8}>
                <Avatar 
                  size={collapsed ? 36 : 40} 
                  icon={<UserIcon size={collapsed ? 18 : 20} />} 
                  style={{ background: THEME_COLORS.primary, color: 'white', flexShrink: 0 }}
                />
                {!collapsed && (
                  <div className="flex flex-col truncate max-w-[120px]">
                    <Text style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white' }} className="truncate" title={user.name}>{user.name}</Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }} className="truncate">{user.role}</Text>
                  </div>
                )}
              </Space>
              {!collapsed && (
                <Tooltip title="Đăng xuất">
                  <Button 
                    type="text" 
                    shape="circle" 
                    icon={<LogOut size={16} color="rgba(255,255,255,0.6)" />} 
                    onClick={handleLogout}
                  />
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      </Sider>

      {/* ── Main Layout ── */}
      <Layout style={{ 
        marginLeft: collapsed ? 60 : 250, 
        minHeight: '100vh', 
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s' 
      }}>
        {/* Top Header */}
        <Header
          style={{
            background: 'white',
            padding: '0 24px',
            height: 60,
            lineHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 800, color: THEME_COLORS.forest }}>
              {currentPage?.label}
            </Title>
            {!collapsed && (
              <>
                <Divider type="vertical" style={{ height: 24, margin: '0 12px', background: '#E5E7EB' }} />
                <Space style={{ color: '#6B7280', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{currentPage?.sub}</span>
                  <ChevronRight size={14} />
                  <span style={{ color: THEME_COLORS.primary }}>VINATech VINA</span>
                </Space>
              </>
            )}
          </div>
        </Header>

        {/* ── Content Area ── */}
        <Content style={{ padding: '15px 20px', overflowY: 'auto' }}>
          <div className="fade-in">
            {view === 'list'  && <EquipmentListPage equipment={equipment} onSave={handleSave} onDelete={handleDelete} user={user} />}
            {view === 'insp'  && <InspectionPage    equipment={equipment} user={user} />}
            {view === 'spare' && <SparePartsPage     equipment={equipment} user={user} />}
            {view === 'fail'  && <FailurePage        equipment={equipment} user={user} />}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: THEME_COLORS.primary,
          colorSuccess: '#4C9C2E',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 12,
          fontSize: 14,
          controlHeight: 40,
        },
        components: {
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(255, 255, 255, 0.1)',
            darkItemColor: 'rgba(255, 255, 255, 0.65)',
            darkItemSelectedColor: '#FFFFFF',
            itemPaddingInline: 16,
            itemBorderRadius: 12,
            fontSize: 15,
          },
          Table: {
            headerBg: '#F9FAFB',
            headerColor: '#374151',
            fontSize: 13,
            padding: 16,
          },
          Button: {
            fontWeight: 700,
            borderRadius: 10,
            controlHeight: 40,
          },
          Card: {
            borderRadiusLG: 16,
          }
        },
      }}
    >
      <AntApp>
        <AppInner />
      </AntApp>
    </ConfigProvider>
  )
}
