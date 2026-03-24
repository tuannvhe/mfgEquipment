import { useEffect, useState } from 'react'
import { ConfigProvider, Layout, Menu, Badge, Button, App as AntApp, theme, Avatar, Space, Typography, Divider, Tooltip, Spin, Modal } from 'antd'
import { 
  Settings2, 
  ClipboardCheck, 
  Wrench, 
  AlertTriangle, 
  User as UserIcon, 
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { useEquipmentStore } from './store/useStore'
import EquipmentListPage from './pages/EquipmentListPage'
import FailurePage       from './pages/FailurePage'
import LoginPage         from './pages/LoginPage'
import { authService }   from './utils/authService'
import type { User }      from './types'
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
const { Header, Sider, Content } = Layout
const { Text, Title } = Typography
dayjs.locale('vi');
type ViewKey = 'list' | 'insp' | 'spare' | 'fail'
import { Routes, Route, useNavigate, useLocation, BrowserRouter } from 'react-router-dom';
import EquipmentView from './components/EquipmentView'; // Đảm bảo file này tồn tại

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
  { key: 'fail',  label: 'Báo cáo sự cố',       sub: 'Failure Logs',    Icon: AlertTriangle, roles: ['admin', 'staff', 'user'] },
]

function AppInner() {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser())
  const [view, setView] = useState<ViewKey>('list')
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  // Tìm dòng 46 và sửa lại như sau:
const { 
  equipment = [], 
  loading, 
  totalCount, 
  currentPage: activePage, // Đổi tên ở đây để tránh trùng lặp
  fetchEquipment,
  saveEquipment, 
  pageSize,
  deleteEquipment ,
  stats
} = useEquipmentStore();
  const { message } = AntApp.useApp()
  
  // Update view if user role doesn't allow current view
  useEffect(() => {
    if (user) {
      const currentNav = NAV.find(n => n.key === view)
      if (currentNav?.roles && !currentNav.roles.includes(user.role)) {
        setView('list')
      }
    }
  }, [user, view])

  if (!user) {
    return <LoginPage onLogin={(loggedUser) => setUser(loggedUser)} />
  }
  if (loading && equipment.length === 0) {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-semibold">
      Đang tải hệ thống...
    </div>
  )
}


const handleLogout = () => {
  Modal.confirm({
    title: 'Xác nhận đăng xuất',
    icon: <LogOut size={22} className="text-red-500" />,
    content: 'Bạn có chắc chắn muốn thoát khỏi hệ thống quản lý thiết bị?',
    
    // ĐƯA RA GIỮA MÀN HÌNH
    centered: true, 
    
    okText: 'Đăng xuất',
    cancelText: 'Hủy',
    
    // Tùy chỉnh thêm để đồng bộ giao diện
    okButtonProps: { 
      danger: true, 
      className: 'rounded-xl h-10 font-bold' 
    },
    cancelButtonProps: { 
      className: 'rounded-xl h-10 font-semibold' 
    },
    
    // Style cho bản thân cái Modal (bo góc mạnh hơn)
    className: 'custom-confirm-modal',
    
    onOk: () => {
      authService.logout();
      setUser(null);
    },
  });
};

  const filteredNav = NAV.filter(n => !n.roles || n.roles.includes(user.role))

  const handleSave = async (eq: Parameters<typeof saveEquipment>[0]) => {
  try {
    const res = await saveEquipment(eq);
    return res || true; // Đảm bảo trả về giá trị TRUTHY
  } catch (err) {
    return null; // Trả về FALSY khi lỗi
  }
}
  const handleDelete = (id: string) => {
    deleteEquipment(id)
    //message.warning('Đã xóa bản ghi thiết bị')
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
            // Thay selectedKeys={[view]} bằng location.pathname để Menu sáng đúng theo URL
            selectedKeys={[location.pathname.split('/')[1] || 'list']} 
            onClick={({ key }) => {
              // setView(key as ViewKey); <-- XÓA DÒNG NÀY
              navigate(`/${key}`); // THÊM DÒNG NÀY: Điều hướng URL thực tế
            }}
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
    background: 'rgba(255, 255, 255, 0.8)', // Trong suốt 80%
    backdropFilter: 'blur(10px)', // Làm mờ phía sau
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
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

        <Content style={{ padding: '15px 20px', overflowY: 'auto', position: 'relative', height: '100%' }}>
  
         {/* Layer Loading: Sử dụng FIXED thay vì ABSOLUTE */}
          {loading && (
            <div style={{
              position: 'fixed', // Quan trọng nhất: Cố định với màn hình
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              background: 'rgba(243, 244, 246, 0.4)', // Giảm độ mờ xuống một chút cho nhẹ nhàng
              zIndex: 9999, // Đảm bảo nằm trên cả Sidebar và Header
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center', // Căn giữa theo cả chiều ngang và dọc
              backdropFilter: 'blur(4px)', // Tăng độ mờ nền để tập trung vào thông báo
            }}>
              <div className="animate-in zoom-in duration-300">
                <div className="p-8 bg-white/90 rounded-[2rem] shadow-2xl border border-white flex flex-col items-center min-w-[200px]">
                  <Spin size="large" />
                  <Text strong style={{ 
                    marginTop: 20, 
                    color: THEME_COLORS.primary,
                    letterSpacing: '1px',
                    fontSize: '17px'
                  }}>
                    ĐANG ĐỒNG BỘ HỆ THỐNG
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#94a3b8', marginTop: 4 }}>
                    Vui lòng đợi trong giây lát
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* Nội dung trang: Khi loading thì làm mờ và khóa tương tác */}
          <div 
            className="transition-all duration-200" 
            style={{ 
              opacity: loading ? 0.3 : 1,
              filter: loading ? 'blur(2px)' : 'none',
              pointerEvents: loading ? 'none' : 'auto' 
            }}
          >
            <Routes>
              <Route path="/list" element={
                <EquipmentListPage 
                  equipment={equipment} 
                  totalItems={totalCount}
                  stats={stats} 
                  currentPage={activePage}
                  pageSize={pageSize}
                  fetchEquipment={fetchEquipment}
                  onSave={handleSave} 
                  onDelete={handleDelete} 
                  user={user} 
                />
              } />
              
              <Route path="/fail" element={<FailurePage equipment={equipment} user={user} />} />

              {/* ĐƯỜNG DẪN QUAN TRỌNG ĐỂ QUÉT QR */}
              <Route path="/equipment/view/:id" element={<EquipmentView />} />

              {/* Mặc định nếu không khớp route nào thì về list */}
              <Route path="/" element={<EquipmentListPage 
                  equipment={equipment} 
                  totalItems={totalCount}
                  stats={stats} 
                  currentPage={activePage}
                  pageSize={pageSize}
                  fetchEquipment={fetchEquipment}
                  onSave={handleSave} 
                  onDelete={handleDelete} 
                  user={user} 
                />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
    <ConfigProvider
    locale={viVN}
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
            darkItemSelectedBg: THEME_COLORS.primary, // Đổi màu nền xanh đậm hơn
            darkItemColor: 'rgba(255, 255, 255, 0.65)',
            darkItemSelectedColor: '#FFFFFF',
            itemMarginInline: 12, // Tạo khoảng cách với viền Sider
            itemMarginBlock: 8,
            itemBorderRadius: 10,
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
    </BrowserRouter>
  )
}
