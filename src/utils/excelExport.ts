import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Equipment } from '../types';

export const exportToExcel = async (data: Equipment[], fileName: string = 'EquipmentList.xlsx') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Danh sách thiết bị');

  // Define Columns
  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 5 },
    { header: 'Tên thiết bị', key: 'eqtitle', width: 30 },
    { header: 'Model', key: 'model', width: 20 },
    { header: 'S/N', key: 'serial', width: 20 },
    { header: 'Số kiểm soát', key: 'ctrlnum', width: 15 },
    { header: 'Loại', key: 'eqtype', width: 20 },
    { header: 'Vị trí', key: 'location', width: 15 },
    { header: 'Trạng thái', key: 'opcond', width: 15 },
    { header: 'Nhà sản xuất', key: 'mfgname', width: 20 },
    { header: 'Người phụ trách', key: 'person', width: 20 },
    { header: 'Ngày lắp đặt', key: 'instdate', width: 15 },
    { header: 'Giá trị', key: 'value', width: 15 },
    { header: 'Model áp dụng', key: 'appmodel', width: 20 },
    { header: 'Ngày sản xuất', key: 'mfgdate', width: 15 },
    { header: 'Trọng lượng', key: 'weight', width: 12 },
    { header: 'Công suất', key: 'power', width: 15 },
    { header: 'Kích thước', key: 'size', width: 20 },
    { header: 'Địa chỉ sản xuất', key: 'makeraddr', width: 35 },
  ];

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D5F1B' }, // Forest Green matching App theme
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }, // White text
      size: 11,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 25;

  // Add Data
  data.forEach((item, index) => {
    const row = worksheet.addRow({
      stt: index + 1,
      eqtitle: item.eqtitle || '',
      model: item.model || '',
      serial: item.serial || '',
      ctrlnum: item.ctrlnum || '',
      eqtype: item.eqtype || '',
      location: item.location || '',
      opcond: item.opcond === 'Good' ? 'Tốt' : item.opcond === 'Warning' ? 'Theo dõi' : 'Hỏng/Sửa',
      mfgname: item.mfgname || '',
      person: item.person || '',
      instdate: item.instdate || '',
      value: item.value || '',
      appmodel: item.appmodel || '',
      mfgdate: item.mfgdate || '',
      weight: item.weight || '',
      power: item.power || '',
      size: item.size || '',
      makeraddr: item.makeraddr || '',
    });

    // Style data row
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
};
