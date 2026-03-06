import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, InputNumber, Row, Col, Divider, Card, Statistic } from 'antd';
import { PlusOutlined, DiffOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const StockCounting: React.FC = () => {
  const [stores, setStores] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/stores').then(setStores);
  }, []);

  const columns = [
    { title: '盘点单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '盘点门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '盘点日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已完成' : '进行中'}
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
        <h2 className="text-xl font-bold">库存盘点管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>创建盘点单</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={[]} 
        rowKey="id" 
        className="shadow-sm rounded-lg"
      />

      <Modal
        title="创建盘点单"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="store_id" label="选择盘点门店" rules={[{ required: true }]}>
            <Select options={stores.map((s: any) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Divider orientation="left">盘点明细</Divider>
          <div className="text-gray-400 text-center py-8 border border-dashed rounded">
            选择门店后将自动带出该门店所有商品
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StockCounting;
