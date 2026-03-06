import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Statistic, Select, Space, DatePicker } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SwapOutlined, RiseOutlined } from '@ant-design/icons';
import api from '../services/api';

const TurnoverAnalysis: React.FC = () => {
  const data = [
    { name: '周一', rate: 12 },
    { name: '周二', rate: 15 },
    { name: '周三', rate: 10 },
    { name: '周四', rate: 18 },
    { name: '周五', rate: 25 },
    { name: '周六', rate: 30 },
    { name: '周日', rate: 28 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">商品周转率分析</h2>
        <Space>
          <DatePicker.RangePicker />
          <Select placeholder="商品分类" style={{ width: 150 }} options={[{ label: '食品饮料', value: 1 }]} />
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="平均周转率" value={18.5} suffix="%" prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col span={16}>
          <Card title="周转率趋势">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" name="周转率 (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="商品周转率排名">
        <Table
          columns={[
            { title: '排名', dataIndex: 'rank', key: 'rank' },
            { title: '商品名称', dataIndex: 'name', key: 'name' },
            { title: '周转率', dataIndex: 'rate', key: 'rate', render: (v) => `${v}%`, sorter: true },
            { title: '销售数量', dataIndex: 'sales', key: 'sales' },
            { title: '平均库存', dataIndex: 'avg_stock', key: 'avg_stock' },
          ]}
          dataSource={[
            { key: '1', rank: 1, name: '矿泉水 500ml', rate: 45, sales: 1200, avg_stock: 260 },
            { key: '2', rank: 2, name: '可乐 330ml', rate: 38, sales: 800, avg_stock: 210 },
          ]}
        />
      </Card>
    </div>
  );
};

export default TurnoverAnalysis;
