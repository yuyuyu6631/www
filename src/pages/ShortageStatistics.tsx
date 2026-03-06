import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Statistic, Tag, Button, Space } from 'antd';
import { WarningOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import api from '../services/api';

const ShortageStatistics: React.FC = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/inventory').then(res => {
      const inv = res as any[];
      const shortages = inv.filter((item: any) => item.quantity <= item.alert_threshold);
      setData(shortages as any);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">缺货/积压商品统计</h2>
        <Button type="primary">生成采购建议</Button>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Card className="bg-red-50" title={<span className="text-red-600">缺货商品统计</span>}>
            <Statistic title="当前缺货SKU数" value={data.length} prefix={<WarningOutlined />} styles={{ content: { color: '#cf1322' } }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="bg-blue-50" title={<span className="text-blue-600">积压商品统计</span>}>
            <Statistic title="积压SKU数" value={0} />
          </Card>
        </Col>
      </Row>

      <Card title="缺货商品列表">
        <Table
          columns={[
            { title: '门店', dataIndex: 'store_name', key: 'store_name' },
            { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
            { title: '当前库存', dataIndex: 'quantity', key: 'quantity', render: (v) => <span className="text-red-500 font-bold">{v}</span> },
            { title: '安全库存', dataIndex: 'alert_threshold', key: 'alert_threshold' },
            { title: '缺口数量', key: 'gap', render: (_, record: any) => record.alert_threshold - record.quantity },
            { title: '操作', key: 'op', render: () => <Button type="link">补货</Button> }
          ]}
          dataSource={data}
          rowKey={(record: any) => `${record.store_id}-${record.product_id}`}
        />
      </Card>
    </div>
  );
};

export default ShortageStatistics;
