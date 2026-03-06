import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, InputNumber, Row, Col, Divider, Input } from 'antd';
import { PlusOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../services/api';

const StockAdjustment: React.FC = () => {
  const [stores, setStores] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/stores').then(setStores);
  }, []);

  const columns = [
    { title: '单据号', dataIndex: 'order_no', key: 'order_no' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'loss' ? 'red' : 'green'}>{t === 'loss' ? '报损' : '报溢'}</Tag> },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已生效' : '待审核'}
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
        <h2 className="text-xl font-bold">报损报溢管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>新增单据</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={[]} 
        rowKey="id" 
        className="shadow-sm rounded-lg"
      />

      <Modal
        title="新增报损报溢单"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="单据类型" rules={[{ required: true }]}>
                <Select options={[{ label: '报损', value: 'loss' }, { label: '报溢', value: 'overflow' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="store_id" label="所属门店" rules={[{ required: true }]}>
                <Select options={stores.map((s: any) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="原因备注">
            <Input.TextArea rows={2} placeholder="请输入调整原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StockAdjustment;
