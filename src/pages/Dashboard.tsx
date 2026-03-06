import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Select, Space, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { StockOutlined, MoneyCollectOutlined, AlertOutlined } from '@ant-design/icons';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 按照文档：获取各门店库存总量
        // const overview = await api.get('/statistics/inventory-overview');
        const data = await api.get('/dashboard/stats');
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">库存概览工作台</h2>
      
      <Row gutter={16}>
        <Col span={8}>
          <Card className="bg-blue-50 border-blue-100 shadow-sm">
            <Statistic 
              title="全渠道库存总量" 
              value={stats?.totalQuantity} 
              prefix={<StockOutlined />} 
              styles={{ content: { color: '#1d4ed8' } }} 
            />
            <div className="text-xs text-blue-400 mt-2">实时同步各门店数据</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
            <Statistic 
              title="库存总金额 (元)" 
              value={stats?.totalValue} 
              precision={2}
              prefix={<MoneyCollectOutlined />} 
              styles={{ content: { color: '#059669' } }} 
            />
            <div className="text-xs text-emerald-400 mt-2">基于最新入库价计算</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="bg-amber-50 border-amber-100 shadow-sm">
            <Statistic 
              title="库存预警商品" 
              value={3} 
              prefix={<AlertOutlined />} 
              styles={{ content: { color: '#d97706' } }} 
            />
            <div className="text-xs text-amber-400 mt-2">需尽快补货</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="各门店库存分布" className="shadow-sm">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.storeStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" name="库存数量" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="最近入库动态" className="shadow-sm">
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div>
                    <div className="text-sm font-medium">采购入库 - 矿泉水</div>
                    <div className="text-xs text-gray-400">总部旗舰店 | 2024-03-04</div>
                  </div>
                  <Tag color="green">+120</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
