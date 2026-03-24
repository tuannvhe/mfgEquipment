import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Button, Spin, Typography, message } from 'antd';
import { Printer, Loader2 } from 'lucide-react';
import api from '../utils/api';

const { Text } = Typography;
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Trả về gốc nếu không phải định dạng ngày
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};
const EquipmentView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const TITLE_BG = "bg-[#E7EFD8]";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        // Gọi API sử dụng instance đã cấu hình
        const response = await api.get(`/Detail/${id}`); 
        setData(response.data);
      } catch (error: any) {
        console.error("Lỗi khi lấy chi tiết:", error);
        if (error.response?.status === 404) {
          //message.error("Thiết bị không tồn tại trong hệ thống Vinatech");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ho_so_thiet_bi_${id}`,
  });
useLayoutEffect(() => {
  const sider = document.querySelector('.ant-layout-sider') as HTMLElement;
  const header = document.querySelector('.ant-layout-header') as HTMLElement;
  const content = document.querySelector('.ant-layout-content') as HTMLElement;
  const layout = document.querySelector('.ant-layout') as HTMLElement;

  const originalStyles = {
    siderDisplay: sider?.style.display,
    headerDisplay: header?.style.display,
    contentMargin: content?.style.margin,
    layoutBg: layout?.style.background
  };

  if (sider) {
    sider.style.display = 'none';
    sider.style.width = '0';
  }
  if (header) header.style.display = 'none';
  if (content) {
    content.style.setProperty('margin', '0', 'important');
    content.style.setProperty('padding', '0', 'important');
  }
  if (layout) {
    // Ép nền của toàn bộ khung Layout về trắng thay vì màu xám cũ (#525659)
    layout.style.setProperty('background', '#ffffff', 'important');
  }

  return () => {
    if (sider) {
      sider.style.display = originalStyles.siderDisplay || '';
      sider.style.width = '';
    }
    if (header) header.style.display = originalStyles.headerDisplay || '';
    if (content) content.style.margin = originalStyles.contentMargin || '';
    if (layout) layout.style.background = originalStyles.layoutBg || '';
  };
}, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Spin indicator={<Loader2 className="animate-spin" size={40} />} />
        <Text className="mt-4 text-slate-500 font-medium">Đang truy xuất hồ sơ gốc...</Text>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center">Không tìm thấy dữ liệu cho thiết bị này.</div>;

  return (
    <div className="equipment-view-wrapper p-4 bg-gray-100 min-h-screen">
      {/* <div className="no-print mb-4 flex justify-end gap-2">
         <Button type="primary" icon={<Printer size={16}/>} onClick={() => handlePrint()}>
            In Hồ Sơ (A4)
         </Button>
      </div> */}
      
      <div className="page-viewport">
        <div 
            ref={printRef} 
            className="print-container bg-white mx-auto shadow-lg"
            style={{ 
                width: '210mm', 
                minHeight: '297mm', // Thay minHeight bằng height để khớp A4
                padding: '10mm', 
                color: 'black',
                boxSizing: 'border-box' // Quan trọng: Để padding nằm TRONG 210mm
            }}
            >
          {/* SECTION 1: HEADER */}
          <table className="w-full border-collapse border-2 border-black text-[11px]">
            <tbody>
              <tr>
                <td rowSpan={2} className="border-2 border-black p-2 w-[18%] text-center">
                  <img src="/images/logoB.png" alt="VINATech" className="w-full max-h-12 object-contain" />
                </td>
                <td rowSpan={2} className="border-2 border-black text-center w-[52%]">
                  <h1 className="text-xl font-bold mb-0 leading-tight uppercase">MFG. EQUIPMENT RECORD</h1>
                  <p className="text-[10px] font-medium uppercase tracking-tight mt-1">Hồ sơ thiết bị sản xuất</p>
                </td>
                <td className={`border-2 border-black p-1 text-center font-bold ${TITLE_BG} w-[10%] text-[9px] leading-tight`}>PREPARED<br/>LẬP</td>
                <td className={`border-2 border-black p-1 text-center font-bold ${TITLE_BG} w-[10%] text-[9px] leading-tight`}>REVIEWED<br/>KIỂM TRA</td>
                <td className={`border-2 border-black p-1 text-center font-bold ${TITLE_BG} w-[10%] text-[10px] leading-tight`}>APPROVED<br/>PHÊ DUYỆT</td>
              </tr>
              <tr>
                <td className="border-2 border-black h-12 text-center align-bottom text-[9px] pb-1 uppercase font-semibold break-words">{data.preparedBy}</td>
                <td className="border-2 border-black h-12 text-center align-bottom text-[9px] pb-1 uppercase font-semibold break-words">{data.reviewedBy}</td>
                <td className="border-2 border-black h-12 text-center align-bottom text-[9px] pb-1 uppercase font-semibold break-words">{data.approvedBy}</td>
              </tr>
            </tbody>
          </table>

          {/* SECTION 2: MAIN INFO TABLE - Thêm table-fixed để kiểm soát độ rộng cột */}
          <table className="w-full border-collapse border-x-2 border-b-2 border-black text-[9px] table-fixed">
            <tbody>
              <tr className={`${TITLE_BG} font-bold text-center italic text-[11px]`}>
                <td colSpan={4} className="border border-black p-1">VINATECH VINA</td>
                <td colSpan={4} className="border border-black p-1 uppercase font-bold">Manufacturer / Nhà sản xuất</td>
              </tr>
              
              {/* Row 1 */}
              <tr>
                <td className={`border border-black p-1 ${TITLE_BG} text-center  leading-[1.1]`}>
                  <b className="block text-[9px] ">APPLIED MODEL NAME</b>
                  <span className="text-[7px] font-medium uppercase">Tên mô hình áp dụng</span>
                </td>
                <td colSpan={3} className="border border-black p-1 text-center uppercase text-[10px] font-semibold break-words">{data.appliedModelName || 'N/A'}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">MANUFACTURER NAME</b>
                  <span className="text-[7px] font-medium uppercase">Tên nhà sản xuất</span>
                </td>
                <td colSpan={3} className="border border-black p-1 text-center uppercase font-semibold break-words">{data.manufacturerName}</td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">OPERATING CONDITIONS</b>
                  <span className="text-[7px] font-medium uppercase">Điều kiện vận hành</span>
                </td>
                <td colSpan={3} className="border border-black p-1 text-center uppercase font-semibold break-words">{data.status || 'Good - Tốt'}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">EQUIPMENT TITLE</b>
                  <span className="text-[7px] font-medium uppercase">Tên gọi thiết bị</span>
                </td>
                <td colSpan={3} className="border border-black p-1 text-center font-semibold break-words">{data.manufacturerEquipmentTitle}</td>
              </tr>

              {/* Row 3 */}
              <tr>
                <td className={`border border-black p-1 ${TITLE_BG} text-center  leading-[1.1]`}>
                  <b className="block text-[9px]">CONTROL NUMBER</b>
                  <span className="text-[7px] font-medium uppercase">Số kiểm soát</span>
                </td>
                <td className="border border-black p-1 text-center text-[10px] break-words">{data.controlNumber}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">DATE OF INSTALLATION</b>
                  <span className="text-[7px] font-medium uppercase leading-none">Ngày lắp đặt</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold text-[10px]">{formatDate(data.dateOfInstallation)}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">MODEL</b>
                  <span className="text-[7px] font-medium uppercase">Tên mẫu</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.model}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">WEIGHT</b>
                  <span className="text-[7px] font-medium uppercase">Trọng lượng</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.weight}</td>
              </tr>

              {/* Row 4 */}
              <tr>
                <td className={`border border-black p-1 ${TITLE_BG} text-center  leading-[1.1]`}>
                  <b className="block text-[9px]">EQUIPMENT TITLE</b>
                  <span className="text-[7px] font-medium uppercase">Tên gọi thiết bị</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.equipmentTitle}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">INSTALLATION LOCATION</b>
                  <span className="text-[7px] font-medium uppercase leading-none">Địa điểm lắp đặt</span>
                </td>
                <td className="border border-black p-1 text-center uppercase font-semibold break-words">{data.installationLocation}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">SERIAL NO</b>
                  <span className="text-[7px] font-medium uppercase">Số Seri</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.serialNo}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">POWER</b>
                  <span className="text-[7px] font-medium uppercase">Nguồn điện</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.power}</td>
              </tr>

              {/* Row 5 */}
              <tr>
                <td className={`border border-black p-1 ${TITLE_BG} text-center  leading-[1.1]`}>
                  <b className="block text-[9px]">EQUIPMENT PRICE</b>
                  <span className="text-[7px] font-medium uppercase">Giá thiết bị</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.price?.toLocaleString() || 0}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">RESPONSIBLE PERSON</b>
                  <span className="text-[7px] font-medium uppercase leading-none">Người phụ trách</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.responsiblePerson}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">DATE OF MANUFACTURE</b>
                  <span className="text-[7px] font-medium uppercase leading-none">Ngày sản xuất</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold text-[10px]">{formatDate(data.dateOfManufacture)}</td>
                <td className={`border border-black p-1 ${TITLE_BG} text-center leading-[1.1]`}>
                  <b className="block text-[9px]">SIZE</b>
                  <span className="text-[7px] font-medium uppercase">Kích thước</span>
                </td>
                <td className="border border-black p-1 text-center font-semibold break-words">{data.size}</td>
              </tr>

              {/* Row 6: Photo Section - Tăng chiều cao lên một chút nếu cần */}
              <tr>
                <td colSpan={4} className="border border-black h-72 text-center align-middle overflow-hidden bg-white relative">
                  {data.images?.find((img: any) => img.type === false) ? (
                    <img src={data.images.find((img: any) => img.type === false).relativePath} className="h-full w-full object-contain mx-auto" alt="Machine" />
                  ) : (
                    <span className="text-gray-300 italic uppercase font-bold text-[10px]">Machine Photo</span>
                  )}
                </td>
                <td colSpan={4} className="border border-black h-72 text-center align-middle overflow-hidden bg-white relative">
                  {data.images?.find((img: any) => img.type === true) ? (
                    <img src={data.images.find((img: any) => img.type === true).relativePath} className="h-full w-full object-contain mx-auto" alt="Nameplate" />
                  ) : (
                    <span className="text-gray-300 italic uppercase font-bold text-[10px]">Nameplate Photo</span>
                  )}
                </td>
              </tr>

              {/* SECTION: BẢO TRÌ & PHỤ TÙNG */}
              <tr className={`${TITLE_BG} font-bold text-center italic text-[11px]`}>
                <td colSpan={4} className="border border-black p-1 uppercase">Periodic Inspection Items / Các hạng mục KT định kỳ</td>
                <td colSpan={4} className="border border-black p-1 uppercase">Spare Parts / Phụ tùng dự phòng</td>
              </tr>
              <tr className={`${TITLE_BG} text-center font-bold uppercase text-[8px] leading-tight h-8`}>
                <td className="border border-black">Inspection Interval<br/>Chu kỳ kiểm tra</td>
                <td colSpan={3} className="border border-black">Periodic Inspection Items<br/>Hạng mục kiểm tra định kỳ</td>
                <td className="border border-black">Part Name<br/>Tên linh kiện</td>
                <td className="border border-black">Part Number<br/>Số hiệu</td>
                <td className="border border-black">Specification<br/>Quy cách</td>
                <td className="border border-black">Quantity<br/>Số lượng</td>
              </tr>

              {data.spareParts?.map((spare: any, i: number) => {
                const inspection = data.periodicInspections?.[i];
                return (
                  <tr key={`row-${spare.id || i}`} className="h-7 text-[9px] text-center">
                    <td className="border border-black">{inspection?.inspectionInterval || ''}</td>
                    <td colSpan={3} className="border border-black px-2 text-left">{inspection?.periodicItems || ''}</td>
                    <td className="border border-black">{spare?.partName || ''}</td>
                    <td className="border border-black">{spare?.partNumber || ''}</td>
                    <td className="border border-black">{spare?.specification || ''}</td>
                    <td className="border border-black">{spare?.quantity > 0 ? spare.quantity : ''}</td>
                  </tr>
                );
              })}

              {/* SECTION: LỊCH SỬ HƯ HỎNG */}
              <tr className={`${TITLE_BG} text-center font-bold uppercase text-[8px] leading-tight h-8`}>
                <td className="border border-black">Date of Insp.<br/>Ngày kiểm tra/SC</td>
                <td colSpan={3} className="border border-black">Inspection Details<br/>Nội dung kiểm tra / Sự cố</td>
                <td className="border border-black">Failure History<br/>Lịch sử hư hỏng</td>
                <td className="border border-black">Replacement Parts<br/>Linh kiện thay thế</td>
                <td className="border border-black">Inspector<br/>Người kiểm tra</td>
                <td className="border border-black">Remarks<br/>Ghi chú</td>
              </tr>

              {data.spareParts?.map((historyItem: any, i: number) => {
                const inspectionItem = data.periodicInspections?.[i];
                if (!historyItem?.failureHistory && !inspectionItem?.inspectionDetails) return null;
                return (
                  <tr key={`history-${historyItem.id || i}`} className="h-8 text-center text-[9px]">
                    <td className="border border-black">{formatDate(inspectionItem?.dateOfInspection) || ''}</td>
                    <td colSpan={3} className="border border-black px-1 text-left">{inspectionItem?.inspectionDetails || ''}</td>
                    <td className="border border-black">{historyItem?.failureHistory || ''}</td>
                    <td className="border border-black">{historyItem?.replacementParts || ''}</td>
                    <td className="border border-black ">{historyItem?.inspector || ''}</td>
                    <td className="border border-black">{historyItem?.remarks || ''}</td>
                  </tr>
  );
})}
          </tbody>
        </table>
      </div>

      <style>{`
      /* Ngắt trang cho bảng */
  table {
    page-break-inside: auto;
  }
  
  tr {
    page-break-inside: avoid; /* Không cho phép ngắt ngang một hàng */
    page-break-after: auto;
  }

  /* Giữ cho Header bảng lặp lại ở đầu mỗi trang mới (tùy trình duyệt) */
  thead {
    display: table-header-group;
  }

  @media print {
    .print-container {
      height: auto !important; /* Khi in thì để chiều cao tự động theo nội dung */
      min-height: 297mm;
    }
  }
      /* 1. NỀN TRẮNG TOÀN BỘ */
      .equipment-view-wrapper {
        background-color: #ffffff !important; /* Đổi về màu trắng */
        width: 100%;
        margin: 0;
        padding: 0;
      }

      /* 2. CĂN GIỮA FORM TUYỆT ĐỐI */
      .page-viewport {
        display: flex;
        justify-content: center; /* Căn giữa theo chiều ngang */
        align-items: flex-start;
        width: 100%;
        padding-top: 40px;
        padding-bottom: 40px;
      }

      .print-container {
        width: 210mm;
        min-height: 297mm;
        padding: 10mm;
        color: black;
        box-sizing: border-box;
        border: 1px solid #f0f0f0; /* Viền nhẹ để phân biệt trên nền trắng */
      }

      .control-panel {
        position: fixed;
        top: 20px;
        right: 40px;
        z-index: 9999;
      }

      /* 3. XỬ LÝ KHI IN (KHÔNG THAY ĐỔI) */
      @media print {
        /* Ẩn mọi thứ khác */
        body * { visibility: hidden !important; }
        
        /* Hiển thị container in */
        .print-container, .print-container * { visibility: visible !important; }
        
        .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important; /* Cố định chiều rộng A4 */
            height: 297mm !important; /* Cố định chiều cao A4 */
            margin: 0 !important;
            padding: 10mm !important; /* Lề trong của nội dung so với mép giấy */
            border: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
            page-break-after: avoid;
            page-break-before: avoid;
        }

        /* Loại bỏ lề mặc định của trình duyệt */
        @page { 
            size: A4; 
            margin: 0; 
        }
        }
    `}</style>
    </div>
    </div>
  );
  
};

export default EquipmentView;