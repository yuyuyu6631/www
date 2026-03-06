import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, InputNumber, message, Row, Col, Divider, Input } from 'antd';
import { PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import api from '../services/api';

const SalesOutbound: React.FC = () => {
  const [stores, setStores] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/stores').then(setStores);
  }, []);

  const columns = [
    { title: '出库单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '出库门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '销售渠道', dataIndex: 'channel', key: 'channel', render: (c: string) => <Tag color={c === 'online' ? 'blue' : 'purple'}>{c === 'online' ? '线上' : '线下'}</Tag> },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已出库' : '待处理'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link">详情</Button>
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">销售出库管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>创建出库单</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={[]} 
        rowKey="id" 
        className="shadow-sm rounded-lg"
      />

      <Modal
        title="创建销售出库单"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="store_id" label="出库门店" rules={[{ required: true }]}>
                <Select options={stores.map((s: any) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel" label="销售渠道" initialValue="offline">
                <Select options={[{ label: '线上', value: 'online' }, { label: '线下', value: 'offline' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">商品明细</Divider>
          <Table
            size="small"
            pagination={false}
            columns={[
              { title: '商品', dataIndex: 'name', key: 'name' },
              { title: '出库数量', dataIndex: 'qty', key: 'qty', render: () => <InputNumber min={1} /> },
              { title: '可用库存', dataIndex: 'available', key: 'available' },
              { title: '单价', dataIndex: 'price', key: 'price' },
              { title: '操作', key: 'op', render: () => <Button type="link" danger>移除</Button> }
            ]}
            dataSource={[]}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default SalesOutbound;
