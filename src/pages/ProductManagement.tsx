import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Form, Select, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, BarcodeOutlined } from '@ant-design/icons';
import api from '../services/api';

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/products');
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns = [
    { title: '条码', dataIndex: 'barcode', key: 'barcode', render: (text: string) => <code className="bg-gray-100 px-1 rounded">{text}</code> },
    { title: '商品名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-medium">{text}</span> },
    { title: '分类', dataIndex: 'category_name', key: 'category_name' },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    { title: '保质期(天)', dataIndex: 'expiry_days', key: 'expiry_days' },
    { title: '单价', dataIndex: 'price', key: 'price', render: (val: number) => `¥${val.toFixed(2)}` },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">编辑</Button>
          <Button type="link" danger>下架</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">商品信息管理</h2>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="搜索商品名称/条码" style={{ width: 250 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>新增商品</Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={products} 
        rowKey="id" 
        loading={loading}
        className="shadow-sm rounded-lg"
      />

      <Modal
        title="新增商品"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="barcode" label="商品条码" rules={[{ required: true }]}>
                <Input prefix={<BarcodeOutlined />} placeholder="扫码或输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
                <Input placeholder="商品全称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category_id" label="所属分类">
                <Select placeholder="选择分类" options={[{ label: '食品饮料', value: 1 }, { label: '日用百货', value: 2 }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spec" label="规格型号">
                <Input placeholder="如：500ml*24瓶" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="零售价">
                <Input type="number" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiry_days" label="保质期(天)">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManagement;
