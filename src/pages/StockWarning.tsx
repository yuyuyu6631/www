import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Row, Col, Statistic, Progress, Space, Button } from 'antd';
import { AlertOutlined, ExportOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const StockWarning: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWarning = async () => {
      setLoading(true);
      try {
        const inv = await api.get('/inventory') as any[];
        // Mocking some warning data
        const warningData = inv.map((item: any) => ({
          ...item,
          expiry_date: dayjs().add(Math.floor(Math.random() * 60) - 10, 'day').format('YYYY-MM-DD'),
          days_left: Math.floor(Math.random() * 60) - 10
        }));
        setData(warningData);
      } finally {
        setLoading(false);
      }
    };
    fetchWarning();
  }, []);

  const columns = [
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '库存数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '到期日期', dataIndex: 'expiry_date', key: 'expiry_date' },
    { 
      title: '剩余天数', 
      dataIndex: 'days_left', 
      key: 'days_left',
      render: (days: number) => {
        let color = 'green';
        if (days <= 0) color = 'red';
        else if (days <= 30) color = 'orange';
        return <Tag color={color}>{days <= 0 ? `已过期 ${Math.abs(days)} 天` : `${days} 天`}</Tag>;
      }
    },
    {
      title: '风险等级',
      key: 'risk',
      render: (_: any, record: any) => {
        const percent = Math.max(0, Math.min(100, (30 - record.days_left) * 3.33));
        return <Progress percent={Math.round(percent)} size="small" status={record.days_left <= 0 ? 'exception' : 'active'} />;
      }
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertOutlined className="text-red-500" />
          临期/超期商品预警
        </h2>
        <Button icon={<ExportOutlined />}>导出预警列表</Button>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="bg-red-50 border-red-100">
            <Statistic title="已过期商品" value={data.filter((d: any) => d.days_left <= 0).length} styles={{ content: { color: '#cf1322' } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="bg-orange-50 border-orange-100">
            <Statistic title="30天内临期" value={data.filter((d: any) => d.days_left > 0 && d.days_left <= 30).length} styles={{ content: { color: '#d46b08' } }} />
          </Card>
        </Col>
      </Row>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey={(record: any) => `${record.store_id}-${record.product_id}`}
        loading={loading}
        className="shadow-sm rounded-lg"
      />
    </div>
  );
};

export default StockWarning;
