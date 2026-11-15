# PROJECT AUDIT — EMPTY SHOP

## 1. Cấu trúc dự án

```
projectname/
├── server/           Node.js + Express + MongoDB (port 3000)
│   ├── api/admin.js  REST: login, CRUD category/product/customer/order
│   ├── api/customer.js REST: login/signup, categories, products, checkout, orders
│   ├── models/Models.js   Mongoose schemas
│   └── models/*DAO.js     Data access layer
├── client-customer/  React CRA (proxied to server:3000)
│   └── src/
│       ├── components/   22 components
│       ├── contexts/     MyContext, MyProvider (cart, auth, toast)
│       ├── hooks/        useReveal, useCountUp, usePointerLight, useThemeTransition
│       ├── styles/theme.css  ~514 dòng CSS — dark theme
│       └── utils/        CartUtil, formatMoney, getImageSrc, withRouter, …
└── client-admin/     React CRA (proxied to server:3000)
    └── src/
        ├── components/   13 components
        ├── styles/theme.css  ~150+ dòng CSS — admin theme
        └── utils/        formatMoney
```

## 2. Schema hiện tại (server/models/Models.js)

**ProductSchema**: `name, price, image, cdate, category` — **CHƯA có trường `specs`**

**OrderSchema**: `cdate, total, status (PENDING|APPROVED|CANCELED), customer{}, items[]`

## 3. Danh sách file sẽ sửa

### server/
| File | Thay đổi |
|------|----------|
| `models/Models.js` | Thêm `specs: [{ label: String, value: String }]` vào ProductSchema |
| `api/admin.js` | POST/PUT /products: nhận và lưu `specs` |

### client-customer/src/
| File | Thay đổi |
|------|----------|
| `components/HomeComponent.js` | Thêm banner Ưu đãi cuối tuần, 4 ô cam kết cửa hàng, cải thiện footer đa cột |
| `components/ProductDetailComponent.js` | Viết lại hoàn toàn: 2 cột, ảnh thumbnail, hover zoom, tabs, wishlist (localStorage), sản phẩm khác, sold, breadcrumb |
| `components/MycartComponent.js` | Thêm layout thẻ card mobile-friendly (giữ nguyên logic) |
| `components/MenuComponent.js` | Điều chỉnh mobile header: brand giữa, hamburger trái, cart phải (đã có hamburger, cần đặt lại thứ tự flex) |
| `components/ui/ProductCard.js` | Thêm nút yêu thích (localStorage) |
| `styles/theme.css` | Thêm CSS cho banner, store features, footer đa cột, detail page, mobile cart |

### client-admin/src/
| File | Thay đổi |
|------|----------|
| `components/LoginComponent.js` | Viết lại: split-screen (trái = brand panel, phải = form) |
| `components/HomeComponent.js` | Thêm doanh thu (đơn APPROVED), top 3 bán chạy, biểu đồ doanh thu SVG |
| `components/ProductComponent.js` | Viết lại: full-width table, nút Sửa/Xóa inline, lọc danh mục, nút "+ Thêm sản phẩm", phân trang số |
| `components/ProductDetailComponent.js` | Thêm phần nhập specs (mảng label/value) |
| `styles/theme.css` | CSS cho split-screen login, dashboard mới, bảng sản phẩm mới |

## 4. Những gì KHÔNG thay đổi
- Backend logic: auth, JWT, cart checkout, order status update
- Contexts: MyContext, MyProvider
- Hooks: useReveal, useCountUp, usePointerLight
- Các component không liên quan: Signup, Active, Myorders, Myprofile, Category (admin), Customer (admin), Order (admin)
- Các UI atoms: Toast, Loading, ErrorState, EmptyState, ConfirmDialog, PasswordInput, ThemeToggle

## 5. Phân tích gap so với ảnh tham chiếu

### Ảnh 1 — Trang chủ (desktop)
| Mục | Hiện tại | Cần làm |
|-----|----------|---------|
| Hero "Nổi bật" | Có, dạng hình tròn orbit | Điều chỉnh eyebrow label "NỔI BẬT", giữ hình tròn |
| Thanh danh mục chip | Có nhưng là section riêng | Đặt ngay dưới hero (chip: iPad, iPhone, Macbook, Airpods, AppleWatch) |
| Sản phẩm mới (4 thẻ) | Hiện chỉ 2 thẻ (slice 1-2) | Lấy 4 sản phẩm (topNew(4)) |
| Banner "Ưu đãi cuối tuần" | ❌ Chưa có | Thêm mới — full-width, nền đỏ rượu |
| 4 ô cam kết | ❌ Chưa có | Thêm mới — Chính hãng, Bảo hành, Giao hàng, Hỗ trợ KH |
| Bán chạy nhất | Có nhưng layout dọc | Giữ, cải thiện khoảng cách "Xem tất cả" |
| Footer đa cột | Chỉ 1 dòng text | Thêm 3 cột: Cửa hàng, Hỗ trợ, Tài khoản |

### Ảnh 2 — Chi tiết sản phẩm (desktop)
| Mục | Hiện tại | Cần làm |
|-----|----------|---------|
| 2 cột card | ❌ Plain text rows | Viết lại 2 cột trong glass card |
| Ảnh thumbnail | ❌ | Thêm 1-3 thumbnail nhỏ bên dưới ảnh chính |
| Hover zoom | ❌ | Thêm zoom bằng CSS transform |
| Breadcrumb (Apple · iPhone) | ❌ | Thêm brand · category |
| Sold count | ❌ | Lấy từ API /products/hot |
| Tabs Bảo hành/Đổi trả/Vận chuyển | ❌ | Thêm tab tĩnh |
| Wishlist (tim) | ❌ | Thêm, lưu localStorage |
| Sản phẩm khác | ❌ | Gọi /products/hot, lọc bỏ sản phẩm hiện tại |
| Tab Thông số | ❌ | Hiện nếu có specs |

### Ảnh 3 — Mobile (3 màn hình)
| Mục | Hiện tại | Cần làm |
|-----|----------|---------|
| Header: hamburger trái, brand giữa, cart phải | Có hamburger nhưng brand trái | Đảo thứ tự flex |
| Drawer menu | Có nhưng dropdown top | Giữ nguyên, kiểm tra ổn |
| Trang chủ 2 cột | Chưa đúng | Điều chỉnh product-list grid 2 cột ở mobile |
| Chi tiết 1 cột mobile | Có (860px) | Kiểm tra ok |
| Giỏ hàng: thẻ card thay bảng | Table layout | Thêm responsive card layout |

### Ảnh 4 — Đăng nhập admin
| Mục | Hiện tại | Cần làm |
|-----|----------|---------|
| Split-screen (trái branding, phải form) | Centered form | Viết lại layout |
| Form: Tên đăng nhập + Mật khẩu | Có | Giữ nguyên trường, style lại |

### Ảnh 5 — Dashboard admin
| Mục | Hiện tại | Cần làm |
|-----|----------|---------|
| 4 stat: Doanh thu, Đơn hàng, Khách hàng, Sản phẩm | 4 stat khác (pending, total, products, customers) | Thay Doanh thu (sum total đơn APPROVED) + giữ 3 cái còn lại |
| Biểu đồ doanh thu theo ngày | ❌ | SVG line chart đơn giản từ dữ liệu orders thật |
| Top 3 bán chạy | ❌ | Lấy /api/admin/products + join với orders |
| Đơn gần đây với 3 trạng thái | Có (5 đơn) | Giữ, style badge Chờ/Đã/Đã hủy |

### Ảnh 6 — Quản lý sản phẩm admin
| Mục | Hiện tại | Cần làm |
|-----|----------|---------|
| Full-width table (không split) | 2-panel: list + form cạnh nhau | Chuyển thành full-width, form thành modal/inline edit |
| Nút "+ Thêm sản phẩm" trên cùng-phải | ❌ | Thêm |
| Thanh tìm kiếm + lọc danh mục | Có search, chưa có filter danh mục | Thêm dropdown lọc |
| Cột: Sản phẩm, Danh mục, Giá, Đã bán, Thao tác (Sửa / Xóa) | Có nhưng khác cột | Điều chỉnh |
| Phân trang số (1 2 3) | Trước/Sau | Thêm trang số |

## 6. Kế hoạch thực hiện

**Bước A** (server): Thêm specs vào Model + API

**Bước B** (customer — desktop): Sửa ProductDetailComponent → HomeComponent → ProductCard (wishlist)

**Bước C** (customer — CSS): theme.css: footer, banner, detail, wishlist

**Bước D** (customer — mobile): MenuComponent header order, MycartComponent card layout

**Bước E** (admin): LoginComponent → HomeComponent → ProductComponent + ProductDetailComponent

**Bước F** (specs data): Script backup + điền specs vào DB (sau khi search thông số)

---

> **Dừng tại đây — Chờ bạn xem xét và phê duyệt trước khi sửa code.**
