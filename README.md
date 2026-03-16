# VINATech – Hệ Thống Quản Lý Thiết Bị

Ứng dụng quản lý thiết bị sản xuất xây dựng với **Vite + React + Ant Design + Tailwind CSS + Lucide Icons**.

## Stack

| Thư viện | Vai trò |
|---|---|
| **Vite + React 18** | Build tool & UI framework |
| **Ant Design 5** | UI Components (Table, Modal, Form, Tabs, Switch...) |
| **Tailwind CSS 3** | Utility-first styling |
| **Lucide React** | Icon library |

## Cài đặt & Chạy

```bash
# 1. Cài dependencies
npm install

# 2. Chạy development server
npm run dev
```

Mở trình duyệt tại **http://localhost:5173**

## Build production

```bash
npm run build
npm run preview
```

## Cấu trúc thư mục

```
src/
├── components/
│   ├── StatusBadge.jsx     # Badge trạng thái (Tailwind)
│   ├── Sidebar.jsx         # Sidebar navigation (Lucide icons + Tailwind)
│   ├── AddEquipModal.jsx   # Modal thêm thiết bị (Ant Design Form)
│   ├── InspModal.jsx       # Modal ghi kiểm tra (Ant Design Form)
│   └── DetailModal.jsx     # Modal chi tiết (Ant Design Modal + Tabs)
├── data/
│   └── data.js             # Dữ liệu mẫu
├── pages/
│   ├── Dashboard.jsx       # Ant Design Table + Tailwind stat cards
│   ├── Equipment.jsx       # Ant Design Table
│   ├── Inspection.jsx      # Ant Design Table
│   └── OtherPages.jsx      # Parts, Incidents, Locations, Users, Settings
├── App.jsx                 # Root component + routing
├── main.jsx                # Entry + Ant Design ConfigProvider
└── index.css               # Tailwind directives + AntD overrides
```
