import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, Select, Input, Table, Button, 
  message, notification, Tag, InputNumber, Radio, Divider 
} from 'antd';
import api from '../utils/api';
import { Search, SearchIcon } from 'lucide-react';

interface Props {
  visible: boolean;
  onCancel: () => void;
  // onSelect nhận về: dữ liệu linh kiện, số lượng chọn, và tên kho lấy hàng
  onSelect: (
    record: any, 
    quantity: number, 
    storage: string, 
    sparePartCode: string, 
    workCenterCode: string
  ) => void;
  initialWC?: string;
  isQueryMode?: boolean;
}

interface SparePartRecord {
  sparePartCode: string;
  sparePartName: string;
  sparePartSpec01?: string;
  currentStock1Qty: number; // Tồn kho 1
  currentStock2Qty: number; // Tồn kho 2
  totalStockQty: number;    // Tổng tồn
  basicUnit?: string;
  qty?: string | number; 
  stockName?: string;
}

const SparePartModal = ({ visible, onCancel, onSelect, initialWC, isQueryMode = false  }: Props) => {
  const [wc, setWc] = useState<string | undefined>(initialWC);
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<SparePartRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SparePartRecord | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<'stock1' | 'stock2'>('stock1');
  const [tempQty, setTempQty] = useState<number>(1);
  
  const emptyRender = (
  <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-[24px] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-700">
    {/* Icon Search với hiệu ứng nhảy bounce */}
    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 animate-bounce">
      <Search size={32} className="text-slate-300" />
    </div>

    {/* Thông báo chính */}
    <h3 className="text-lg font-bold text-slate-700">Không tìm thấy linh kiện</h3>
    
    {/* Thông báo phụ */}
    <p className="text-slate-400 mt-1 text-center text-xs px-10">
      Vui lòng kiểm tra lại mã linh kiện hoặc chọn xưởng (WC) khác
    </p>

    {/* Nút reset tìm kiếm trong Modal */}
    {searchText && (
      <Button 
        onClick={() => {
          setSearchText('');
          setData([]);
        }} 
        className="mt-4 h-9 px-6 rounded-xl font-bold bg-slate-200 text-slate-600 border-none hover:bg-slate-300 transition-colors"
      >
        XÓA TÌM KIẾM
      </Button>
    )}
  </div>
);
  // --- HÀM CLEAR DỮ LIỆU ---
const resetStates = () => {
    // Chỉ reset những thứ cần thiết sau khi đóng hẳn
    setSearchText('');
    setData([]);
    setLoading(false);
    setSelectedRecord(null);
  };

  const handleSearch = useCallback(async (targetWc?: string, targetSearch?: string) => {
    // Ưu tiên targetWc truyền vào, sau đó đến state wc
    const activeWc = targetWc !== undefined ? targetWc : wc;
    const activeSearch = targetSearch !== undefined ? targetSearch : searchText;

    // Nếu không có WC và không phải mode truy vấn thì mới chặn
    if (!activeWc && !isQueryMode) {
      message.warning("Vui lòng chọn xưởng (WC) trước khi tìm kiếm!");
      setData([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/Replacement/lookup', {
        params: { wc: activeWc, q: activeSearch }
      });
      setData(res.data || []);
    } catch (error) {
      message.error("Không thể tải dữ liệu linh kiện");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [wc, searchText, isQueryMode]);

  useEffect(() => {
    if (visible) {
      // Chỉ set một lần khi mở modal
      setWc(initialWC);
      if (initialWC) {
        handleSearch(initialWC, ''); 
      }
    } else {
      // Khi đóng modal thì xóa trắng dữ liệu để lần sau mở lại không bị "nháy" dữ liệu cũ
      setData([]);
      setSearchText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  
  const handleRowClick = (record: SparePartRecord) => {
    // 1. Nếu là Chế độ Tìm kiếm/Lọc (isQueryMode = true)
    if (isQueryMode) {
      // Trả dữ liệu về ngay, không hiện modal chọn số lượng/kho
      onSelect(record, 0, "", record.sparePartCode, wc || "");
      onCancel();
      return;
    }

    // 2. Nếu là Chế độ Nhập liệu (Replacement)
    if (record.totalStockQty <= 0) {
      notification.warning({
        message: 'Hết linh kiện',
        description: `Linh kiện "${record.sparePartName}" hiện không còn trong kho.`,
      });
      return;
    }

    setSelectedRecord(record);
    setTempQty(1);
    setSelectedStorage(record.currentStock1Qty > 0 ? 'stock1' : 'stock2');
    setQtyModalVisible(true);
  };

  const confirmSelection = () => {
    if (selectedRecord && selectedRecord.sparePartCode && wc) { 
      const maxAvailable = selectedStorage === 'stock1' ? selectedRecord.currentStock1Qty : selectedRecord.currentStock2Qty;
      if (tempQty > maxAvailable) {
        message.error(`Số lượng vượt quá tồn kho khả dụng`);
        return;
      }
      onSelect(selectedRecord, tempQty, selectedStorage === 'stock1' ? 'Kho 1' : 'Kho 2', selectedRecord.sparePartCode, wc);
      setQtyModalVisible(false);
      onCancel(); 
    }
  };

 return (
    <>
      <Modal
        title={<div className="text-blue-600 font-bold text-lg">🔍 Tra cứu linh kiện thay thế</div>}
        open={visible}
        onCancel={onCancel}
        // --- QUAN TRỌNG: Clear dữ liệu sau khi đóng hẳn Modal ---
        afterClose={resetStates} 
        footer={null}
        width={1000}
        // Khuyên dùng true để DOM sạch sẽ hơn
        destroyOnClose={true} 
      >
        {/* Nội dung Modal chính */}
        <div className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
           <Select 
            style={{ width: 220 }} 
            placeholder="📍 Chọn xưởng (WC)"
            value={wc}
            allowClear
            // Khi clear WC thì xóa luôn data trong bảng
            onChange={(v) => { setWc(v); setData([]); }}
            options={[
              { label: 'Bắc Ninh (VVT_F1)', value: 'VVT_F1' },
              { label: 'Bắc Giang #1 (VVT_F2)', value: 'VVT_F2' },
              { label: 'Hà Nam (VVT_F3)', value: 'VVT_F3' },
              { label: 'Bắc Giang #2 (VVT_F4)', value: 'VVT_F4' },
            ]}
          />

          <Input 
            placeholder="Nhập mã hoặc tên linh kiện..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => handleSearch()}
            className="flex-1"
          />

          <Button 
            type="primary" 
            onClick={() => handleSearch()} 
            loading={loading}
            disabled={!wc}
          >
            Tìm kiếm
          </Button>
        </div>

        <Table
          dataSource={data}
          loading={loading}
          size="small"
          rowKey="sparePartCode"
          locale={{
            emptyText: emptyRender
          }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            className: record.totalStockQty > 0 
              ? 'cursor-pointer hover:bg-blue-50 transition-all' 
              : 'cursor-not-allowed bg-gray-50 opacity-60'
          })}
          columns={[
            { 
              title: 'Mã linh kiện', 
              dataIndex: 'sparePartCode', 
              width: 130,
              render: (text) => <b className="text-blue-700 font-mono">{text}</b>
            },
            { title: 'Tên linh kiện', dataIndex: 'sparePartName', ellipsis: true },
            { title: 'Quy cách', dataIndex: 'sparePartSpec01', ellipsis: true, className: 'text-gray-500 text-[11px]' },
            { 
              title: 'Kho 1', 
              dataIndex: 'currentStock1Qty', 
              width: 80, 
              align: 'center',
              render: (val) => <span className={val > 0 ? "text-green-600 font-bold" : "text-gray-300"}>{val || 0}</span>
            },
            { 
              title: 'Kho 2', 
              dataIndex: 'currentStock2Qty', 
              width: 80, 
              align: 'center',
              render: (val) => <span className={val > 0 ? "text-green-600 font-bold" : "text-gray-300"}>{val || 0}</span>
            },
            { 
              title: 'Tổng trong kho', 
              dataIndex: 'totalStockQty', 
              width: 90, 
              align: 'center',
              render: (val) => <Tag color={val > 0 ? 'blue' : 'default'} className="font-bold">{val || 0}</Tag>
            },
          ]}
        />
      </Modal>

      {/* MODAL PHỤ: CHỌN KHO & SỐ LƯỢNG */}
      {!isQueryMode && (
        <Modal
        title="Xác nhận số lượng & Kho lấy linh kiện"
        open={qtyModalVisible}
        onCancel={() => setQtyModalVisible(false)}
        onOk={confirmSelection}
        okText="Xác nhận"
        cancelText="Hủy"
        width={400}
        centered
        destroyOnClose
      >
        <div className="py-2">
          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <div className="font-bold text-blue-800">{selectedRecord?.sparePartCode}</div>
            <div className="text-sm text-blue-700">{selectedRecord?.sparePartName}</div>
          </div>

          <div className="space-y-4">
            {/* Chọn Kho */}
            <div>
              <div className="text-[11px] text-gray-400 mb-2 uppercase font-bold tracking-wider">1. Chọn kho xuất:</div>
              <Radio.Group 
                onChange={(e) => { setSelectedStorage(e.target.value); setTempQty(1); }} 
                value={selectedStorage} 
                className="w-full"
              >
                <div className="grid grid-cols-2 gap-2">
                  <Radio.Button 
                    value="stock1" 
                    disabled={!selectedRecord || selectedRecord.currentStock1Qty <= 0}
                    className="text-center h-auto py-2"
                  >
                    <div className="text-xs">Kho 1</div>
                    <div className="text-[10px] font-bold text-green-600">{selectedRecord?.currentStock1Qty || 0}</div>
                  </Radio.Button>
                  
                  <Radio.Button 
                    value="stock2" 
                    disabled={!selectedRecord || selectedRecord.currentStock2Qty <= 0}
                    className="text-center h-auto py-2"
                  >
                    <div className="text-xs">Kho 2</div>
                    <div className="text-[10px] font-bold text-green-600">{selectedRecord?.currentStock2Qty || 0}</div>
                  </Radio.Button>
                </div>
              </Radio.Group>
            </div>

            <Divider className="my-2" />

            {/* Nhập số lượng */}
            <div>
              <div className="text-[11px] text-gray-400 mb-2 uppercase font-bold tracking-wider">2. Số lượng cần lấy:</div>
              <div className="flex items-center gap-3">
                <InputNumber
                  min={1}
                  max={selectedStorage === 'stock1' ? selectedRecord?.currentStock1Qty : selectedRecord?.currentStock2Qty}
                  value={tempQty}
                  onChange={(val) => setTempQty(val || 1)}
                  className="w-full"
                  size="large"
                  autoFocus
                />
                <Tag className="py-1 px-3 bg-gray-100">{selectedRecord?.basicUnit || 'Cái'}</Tag>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      )}
    </>
  );
};

export default SparePartModal;