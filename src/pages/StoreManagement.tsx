import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Statistic, Button, Input, Space, Tag, Modal, Form, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../services/api';

const StoreManagement: React.FC = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await api.get('/stores');
      setStores(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        address: values.address,
        contact_person: values.contact_person,
        phone: values.phone,
        status: values.status
      };

      if (editingId) {
        await api.put(`/stores/${editingId}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/stores', payload);
        message.success('添加成功');
      }
      setIsModalVisible(false);
      fetchStores();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/stores/${id}`);
      message.success('删除成功');
      fetchStores();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: '门店ID', dataIndex: 'id', key: 'id' },
    { title: '门店名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-medium">{text}</span> },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '运营中' : '已停业'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">门店信息管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增门店</Button>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card className="bg-indigo-50 border-indigo-100">
            <Statistic title="总门店数" value={stores.length} prefix={<ShopOutlined />} styles={{ content: { color: '#4f46e5' } }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="bg-green-50 border-green-100">
            <Statistic title="运营中" value={stores.filter((s: any) => s.status === 'active').length} styles={{ content: { color: '#16a34a' } }} />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={stores}
        rowKey="id"
        loading={loading}
        className="shadow-sm rounded-lg"
      />

      <Modal
        title={editingId ? "编辑门店" : "新增门店"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="门店名称" rules={[{ required: true, message: '请输入门店名称' }]}>
            <Input prefix={<ShopOutlined className="text-gray-400" />} placeholder="例如：朝阳旗舰店" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input prefix={<EnvironmentOutlined className="text-gray-400" />} placeholder="详细地址" />
          </Form.Item>
          <Form.Item name="contact_person" label="联系人">
            <Input placeholder="联系人姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}>
            <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="手机号" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select options={[{ label: '运营中', value: 'active' }, { label: '已停业', value: 'inactive' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoreManagement;
