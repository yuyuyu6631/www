import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, DatePicker, InputNumber, message, Divider, Row, Col, Input } from 'antd';
import { PlusOutlined, ScanOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const PurchaseInbound: React.FC = () => {
  const [inboundList, setInboundList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      const [s, p] = await Promise.all([api.get('/stores'), api.get('/products')]);
      setStores(s);
      setProducts(p);
    };
    fetchData();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const columns = [
    { title: '单据号', dataIndex: 'order_no', key: 'order_no' },
    { title: '入库门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '入库日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已入库' : '待审核'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link">详情</Button>
          {record.status === 'pending' && <Button type="link" icon={<CheckCircleOutlined />}>审核</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">采购入库管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建入库单</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={inboundList} 
        rowKey="id" 
        className="shadow-sm rounded-lg"
      />

      <Modal
        title="创建采购入库单"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="store_id" label="入库门店" rules={[{ required: true }]}>
                <Select options={stores.map((s: any) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label="入库日期" initialValue={dayjs()}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider orientation="left">商品明细</Divider>
          
          <div className="mb-4">
            <Button icon={<ScanOutlined />}>扫码添加商品</Button>
          </div>

          <Table
            size="small"
            pagination={false}
            columns={[
              { title: '商品', dataIndex: 'name', key: 'name' },
              { title: '数量', dataIndex: 'qty', key: 'qty', render: () => <InputNumber min={1} defaultValue={1} /> },
              { title: '批次号', dataIndex: 'batch', key: 'batch', render: () => <Input placeholder="批次" /> },
              { title: '有效期', dataIndex: 'expiry', key: 'expiry', render: () => <DatePicker /> },
              { title: '操作', key: 'op', render: () => <Button type="link" danger>移除</Button> }
            ]}
            dataSource={[]}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseInbound;
