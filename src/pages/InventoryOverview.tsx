import React, { useState, useEffect } from 'react';
import { Table, Select, Card, Row, Col, Statistic, Tag, Space, Input } from 'antd';
import { StockOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import api from '../services/api';

const InventoryOverview: React.FC = () => {
  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invData, storeData] = await Promise.all([
        api.get('/inventory', { params: { store_id: selectedStore } }),
        api.get('/stores')
      ]);
      setInventory(invData);
      setStores(storeData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStore]);

  const columns = [
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '条码', dataIndex: 'barcode', key: 'barcode' },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    { 
      title: '当前库存', 
      dataIndex: 'quantity', 
      key: 'quantity',
      render: (val: number, record: any) => (
        <span className={val <= record.alert_threshold ? 'text-red-500 font-bold' : ''}>
          {val}
        </span>
      )
    },
    { title: '预警阈值', dataIndex: 'alert_threshold', key: 'alert_threshold' },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => (
        record.quantity <= record.alert_threshold ? 
        <Tag color="error">库存不足</Tag> : 
        <Tag color="success">充足</Tag>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">库存实时总览</h2>
        <Space>
          <Select 
            placeholder="筛选门店" 
            style={{ width: 200 }} 
            allowClear
            onChange={setSelectedStore}
            options={stores.map((s: any) => ({ label: s.name, value: s.id }))}
          />
          <Input prefix={<SearchOutlined />} placeholder="搜索商品" style={{ width: 200 }} />
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={inventory} 
        rowKey={(record: any) => `${record.store_id}-${record.product_id}`}
        loading={loading}
        className="shadow-sm rounded-lg"
      />
    </div>
  );
};

export default InventoryOverview;
