import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, InputNumber, message, Row, Col, Divider } from 'antd';
import { PlusOutlined, SwapOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const StoreTransfer: React.FC = () => {
  const [stores, setStores] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/stores').then(setStores);
  }, []);

  const columns = [
    { title: '调拨单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '调出门店', dataIndex: 'from_store', key: 'from_store' },
    { title: '调入门店', dataIndex: 'to_store', key: 'to_store' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已完成' : '待审核'}
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
        <h2 className="text-xl font-bold">跨店调拨管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>创建调拨单</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={[]} 
        rowKey="id" 
        className="shadow-sm rounded-lg"
      />

      <Modal
        title="创建跨店调拨单"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="from_store_id" label="调出门店" rules={[{ required: true }]}>
                <Select options={stores.map((s: any) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={4} className="flex items-center justify-center pt-6">
              <SwapOutlined className="text-2xl text-gray-300" />
            </Col>
            <Col span={10}>
              <Form.Item name="to_store_id" label="调入门店" rules={[{ required: true }]}>
                <Select options={stores.map((s: any) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">商品明细</Divider>
          <Table
            size="small"
            pagination={false}
            columns={[
              { title: '商品', dataIndex: 'name', key: 'name' },
              { title: '调拨数量', dataIndex: 'qty', key: 'qty', render: () => <InputNumber min={1} /> },
              { title: '当前库存', dataIndex: 'current', key: 'current' },
              { title: '操作', key: 'op', render: () => <Button type="link" danger>移除</Button> }
            ]}
            dataSource={[]}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default StoreTransfer;
