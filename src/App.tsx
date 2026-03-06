import { ConfigProvider, Layout, Menu, theme, Button, Dropdown, Avatar, Space, message } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  StockOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  SwapOutlined,
  FileTextOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import zhCN from 'antd/locale/zh_CN';

import Dashboard from './pages/Dashboard';
import StoreManagement from './pages/StoreManagement';
import ProductManagement from './pages/ProductManagement';
import InventoryOverview from './pages/InventoryOverview';
import PurchaseInbound from './pages/PurchaseInbound';
import SalesOutbound from './pages/SalesOutbound';
import StoreTransfer from './pages/StoreTransfer';
import StockWarning from './pages/StockWarning';
import StockCounting from './pages/StockCounting';
import StockAdjustment from './pages/StockAdjustment';
import TurnoverAnalysis from './pages/TurnoverAnalysis';
import ShortageStatistics from './pages/ShortageStatistics';

import SupplierManagement from './pages/SupplierManagement';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';

const { Header, Content, Sider } = Layout;

function MainLayout({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '工作台' },
    {
      key: 'basic',
      icon: <SettingOutlined />,
      label: '基础信息',
      children: [
        { key: '/stores', label: '门店管理' },
        { key: '/products', label: '商品管理' },
        { key: '/suppliers', label: '供应商管理' },
        { key: '/users', label: '用户管理' },
      ],
    },
    {
      key: 'inventory',
      icon: <StockOutlined />,
      label: '库存业务',
      children: [
        { key: '/inbound', label: '采购入库' },
        { key: '/outbound', label: '销售出库' },
        { key: '/transfer', label: '跨店调拨' },
        { key: '/counting', label: '库存盘点' },
        { key: '/adjustment', label: '报损报溢' },
      ],
    },
    {
      key: 'stats',
      icon: <BarChartOutlined />,
      label: '统计分析',
      children: [
        { key: '/stock-overview', label: '库存总览' },
        { key: '/turnover', label: '周转率分析' },
        { key: '/warning', label: '临期预警' },
        { key: '/shortage', label: '缺货统计' },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} theme="light" className="shadow-sm">
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <span className={`font-bold text-indigo-600 transition-all ${collapsed ? 'text-xl' : 'text-lg'}`}>
            {collapsed ? 'IMS' : '连锁零售库存系统'}
          </span>
        </div>
        <Menu
          theme="light"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="bg-white p-0 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center">
            <span className="text-gray-500">欢迎回来，{user?.real_name || '管理员'}</span>
          </div>
          <div className="flex items-center gap-4">
            <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }] }}>
              <Space className="cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span>{user?.username || 'Admin'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-4 p-6 bg-white rounded-lg shadow-sm overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stores" element={<StoreManagement />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/suppliers" element={<SupplierManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/stock-overview" element={<InventoryOverview />} />
            <Route path="/inbound" element={<PurchaseInbound />} />
            <Route path="/outbound" element={<SalesOutbound />} />
            <Route path="/transfer" element={<StoreTransfer />} />
            <Route path="/counting" element={<StockCounting />} />
            <Route path="/adjustment" element={<StockAdjustment />} />
            <Route path="/turnover" element={<TurnoverAnalysis />} />
            <Route path="/shortage" element={<ShortageStatistics />} />
            <Route path="/warning" element={<StockWarning />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/*"
            element={user ? <MainLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
