import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import api from '../services/api';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    api.get('/stores').then(setStores);
    // Mocking users since we only have admin/manager in seed
    setUsers([
      { id: 1, username: 'admin', real_name: '系统管理员', role: 'admin', store_name: '总部旗舰店', status: 'active' },
      { id: 2, username: 'manager_sh', real_name: '李店长', role: 'manager', store_name: '上海分店', status: 'active' },
    ]);
  }, []);

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { 
      title: '角色', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => {
        const roles: any = { admin: '总部管理员', manager: '门店店长', staff: '门店店员' };
        return <Tag color="blue">{roles[role] || role}</Tag>;
      }
    },
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '启用' : '禁用'}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link">权限配置</Button>
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">用户与权限管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>新增用户</Button>
      </div>
      <Table columns={columns} dataSource={users} rowKey="id" />
    </div>
  );
};

export default UserManagement;
