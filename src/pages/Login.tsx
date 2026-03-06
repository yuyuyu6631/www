import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Layout, Typography } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data = await api.post('/login', values);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('登录成功');
      onLoginSuccess(data.user);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Content className="w-full max-w-md p-4">
        <Card className="shadow-xl rounded-2xl border-0 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center -mx-6 -mt-6 mb-8">
            <ShopOutlined className="text-5xl text-white mb-4" />
            <Title level={3} className="!text-white !m-0">连锁零售库存管理系统</Title>
            <Text className="text-indigo-100">请登录您的账号以继续</Text>
          </div>
          
          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名!' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="用户名 (admin/manager)" 
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码 (admin123/manager123)"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="w-full h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 border-0 shadow-lg shadow-indigo-200"
                loading={loading}
              >
                立即登录
              </Button>
            </Form.Item>
            
            <div className="text-center text-gray-400 text-sm">
              演示账号: admin / admin123
            </div>
          </Form>
        </Card>
        
        <div className="mt-8 text-center text-gray-400 text-xs">
          © 2024 连锁零售门店库存管理系统 版权所有
        </div>
      </Content>
    </Layout>
  );
};

export default Login;
