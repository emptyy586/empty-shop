/**
 * update-specs.js
 * Usage: node update-specs.js [--dry-run] [--id <productId>]
 *   --dry-run   Print what would be written, do not update DB
 *   --id <id>   Update only the product with this _id
 * Without --id, updates ALL products that have an entry in SPECS_DATA.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const targetId = (() => {
  const idx = args.indexOf('--id');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ── Specs database ──────────────────────────────────────────────────────────
const SPECS_DATA = {

  // ─── iPhones ───────────────────────────────────────────────────────────────
  '6288be503afd8004d22ad83a': { // iPhone X
    name: 'iPhone X',
    specs: [
      { label: 'Màn hình',      value: '5,8" Super Retina HD OLED, 2436 × 1125 px, 458 ppi' },
      { label: 'Chip',          value: 'Apple A11 Bionic (6 nhân)' },
      { label: 'RAM',           value: '3 GB' },
      { label: 'Bộ nhớ',        value: '64 GB hoặc 256 GB' },
      { label: 'Camera sau',    value: 'Kép 12 MP (góc rộng f/1.8 + tele f/2.4), OIS, Portrait Mode' },
      { label: 'Camera trước',  value: '7 MP TrueDepth, f/2.2, nhận diện khuôn mặt Face ID' },
      { label: 'Pin',           value: '2716 mAh, nghe gọi ~21 giờ, sạc không dây' },
      { label: 'Hệ điều hành',  value: 'iOS 11 (hỗ trợ tối đa iOS 16)' },
      { label: 'Cổng sạc',      value: 'Lightning' },
    ],
  },

  '6288bdda3afd8004d22ad823': { // iPhone 11 Pro Max
    name: 'iPhone 11 Pro Max',
    specs: [
      { label: 'Màn hình',      value: '6,5" Super Retina XDR OLED, 2688 × 1242 px, 458 ppi' },
      { label: 'Chip',          value: 'Apple A13 Bionic (6 nhân)' },
      { label: 'RAM',           value: '6 GB' },
      { label: 'Bộ nhớ',        value: '64 GB / 256 GB / 512 GB' },
      { label: 'Camera sau',    value: 'Ba 12 MP (góc rộng f/1.8 + tele f/2.0 + siêu rộng f/2.4), OIS, Night Mode' },
      { label: 'Camera trước',  value: '12 MP TrueDepth, f/2.2, Slow-Mo 120fps' },
      { label: 'Pin',           value: '3969 mAh, nghe gọi ~20 giờ, sạc không dây' },
      { label: 'Hệ điều hành',  value: 'iOS 13 (hỗ trợ tối đa iOS 17)' },
      { label: 'Cổng sạc',      value: 'Lightning' },
    ],
  },

  '6288be193afd8004d22ad828': { // iPhone 11 Pro
    name: 'iPhone 11 Pro',
    specs: [
      { label: 'Màn hình',      value: '5,8" Super Retina XDR OLED, 2436 × 1125 px, 458 ppi' },
      { label: 'Chip',          value: 'Apple A13 Bionic (6 nhân)' },
      { label: 'RAM',           value: '6 GB' },
      { label: 'Bộ nhớ',        value: '64 GB / 256 GB / 512 GB' },
      { label: 'Camera sau',    value: 'Ba 12 MP (góc rộng f/1.8 + tele f/2.0 + siêu rộng f/2.4), Night Mode' },
      { label: 'Camera trước',  value: '12 MP TrueDepth, f/2.2' },
      { label: 'Pin',           value: '3046 mAh, nghe gọi ~18 giờ, sạc không dây' },
      { label: 'Hệ điều hành',  value: 'iOS 13 (hỗ trợ tối đa iOS 17)' },
      { label: 'Cổng sạc',      value: 'Lightning' },
    ],
  },

  '6288be3d3afd8004d22ad833': { // iPhone 11
    name: 'iPhone 11',
    specs: [
      { label: 'Màn hình',      value: '6,1" Liquid Retina IPS LCD, 1792 × 828 px, 326 ppi' },
      { label: 'Chip',          value: 'Apple A13 Bionic (6 nhân)' },
      { label: 'RAM',           value: '4 GB' },
      { label: 'Bộ nhớ',        value: '64 GB / 128 GB / 256 GB' },
      { label: 'Camera sau',    value: 'Kép 12 MP (góc rộng f/1.8 + siêu rộng f/2.4), Night Mode' },
      { label: 'Camera trước',  value: '12 MP TrueDepth, f/2.2, Slow-Mo 120fps' },
      { label: 'Pin',           value: '3110 mAh, nghe gọi ~17 giờ, sạc không dây' },
      { label: 'Hệ điều hành',  value: 'iOS 13 (hỗ trợ tối đa iOS 17)' },
      { label: 'Cổng sạc',      value: 'Lightning' },
    ],
  },

  '6288be633afd8004d22ad841': { // iPhone XR
    name: 'iPhone XR',
    specs: [
      { label: 'Màn hình',      value: '6,1" Liquid Retina IPS LCD, 1792 × 828 px, 326 ppi' },
      { label: 'Chip',          value: 'Apple A12 Bionic (6 nhân)' },
      { label: 'RAM',           value: '3 GB' },
      { label: 'Bộ nhớ',        value: '64 GB / 128 GB / 256 GB' },
      { label: 'Camera sau',    value: '12 MP, f/1.8, OIS, Portrait Mode' },
      { label: 'Camera trước',  value: '7 MP TrueDepth, f/2.2, Face ID' },
      { label: 'Pin',           value: '2942 mAh, nghe gọi ~25 giờ, sạc không dây' },
      { label: 'Hệ điều hành',  value: 'iOS 12 (hỗ trợ tối đa iOS 17)' },
      { label: 'Cổng sạc',      value: 'Lightning' },
    ],
  },

  '6288be753afd8004d22ad848': { // iPhone XS
    name: 'iPhone XS',
    specs: [
      { label: 'Màn hình',      value: '5,8" Super Retina OLED, 2436 × 1125 px, 458 ppi' },
      { label: 'Chip',          value: 'Apple A12 Bionic (6 nhân)' },
      { label: 'RAM',           value: '4 GB' },
      { label: 'Bộ nhớ',        value: '64 GB / 256 GB / 512 GB' },
      { label: 'Camera sau',    value: 'Kép 12 MP (góc rộng f/1.8 + tele f/2.4), OIS, Smart HDR' },
      { label: 'Camera trước',  value: '7 MP TrueDepth, f/2.2, Face ID' },
      { label: 'Pin',           value: '2658 mAh, nghe gọi ~20 giờ, sạc không dây' },
      { label: 'Hệ điều hành',  value: 'iOS 12 (hỗ trợ tối đa iOS 17)' },
      { label: 'Cổng sạc',      value: 'Lightning' },
    ],
  },

  // ─── iPads ─────────────────────────────────────────────────────────────────
  '6288bd295ddf350614f2a916': { // iPad Pro — M4 11" (2024)
    name: 'iPad Pro 11" M4 (2024)',
    specs: [
      { label: 'Phiên bản',     value: 'iPad Pro 11" M4 (2024)' },
      { label: 'Màn hình',      value: '11" Ultra Retina XDR OLED, 2420 × 1668 px, 268 ppi, 1000 nit' },
      { label: 'Chip',          value: 'Apple M4 (9 nhân CPU, 10 nhân GPU)' },
      { label: 'RAM',           value: '8 GB (256/512 GB) hoặc 16 GB (1/2 TB)' },
      { label: 'Bộ nhớ',        value: '256 GB / 512 GB / 1 TB / 2 TB' },
      { label: 'Camera',        value: '12 MP góc rộng (4K) + LiDAR Scanner; 12 MP TrueDepth (nằm ngang, Center Stage)' },
      { label: 'Pin',           value: '~10 giờ dùng Wi-Fi' },
      { label: 'Hệ điều hành',  value: 'iPadOS 17' },
      { label: 'Kết nối',       value: 'Thunderbolt/USB4, Wi-Fi 6E (802.11ax), Bluetooth 5.3, 5G (tùy phiên bản)' },
    ],
  },

  '6288bc0940a1d1225e22805d': { // iPad Mini — Mini 6 (2021)
    name: 'iPad mini 6 (2021)',
    specs: [
      { label: 'Phiên bản',     value: 'iPad mini 6 (2021)' },
      { label: 'Màn hình',      value: '8,3" Liquid Retina IPS, 2266 × 1488 px, 326 ppi' },
      { label: 'Chip',          value: 'Apple A15 Bionic (6 nhân)' },
      { label: 'RAM',           value: '4 GB' },
      { label: 'Bộ nhớ',        value: '64 GB hoặc 256 GB' },
      { label: 'Camera',        value: '12 MP góc rộng (sau) + 12 MP siêu rộng (trước)' },
      { label: 'Pin',           value: '19,3 Wh, dùng Wi-Fi ~10 giờ' },
      { label: 'Hệ điều hành',  value: 'iPadOS 15' },
      { label: 'Kết nối',       value: 'USB-C (USB 3.1 Gen 2), Wi-Fi 6, Bluetooth 5.0' },
    ],
  },

  '6288bb8505f9bb7c9f45cc18': { // iPad Air — Air 5 M1 (2022)
    name: 'iPad Air 5 M1 (2022)',
    specs: [
      { label: 'Phiên bản',     value: 'iPad Air 5 M1 (2022)' },
      { label: 'Màn hình',      value: '10,9" Liquid Retina IPS, 2360 × 1640 px, 264 ppi' },
      { label: 'Chip',          value: 'Apple M1 (8 nhân)' },
      { label: 'RAM',           value: '8 GB' },
      { label: 'Bộ nhớ',        value: '64 GB hoặc 256 GB' },
      { label: 'Camera',        value: '12 MP góc rộng (sau) + 12 MP siêu rộng FaceTime (trước)' },
      { label: 'Pin',           value: '28,65 Wh, dùng Wi-Fi ~10 giờ' },
      { label: 'Hệ điều hành',  value: 'iPadOS 15' },
      { label: 'Kết nối',       value: 'USB-C (USB 3.1 Gen 2), Wi-Fi 6, Bluetooth 5.0' },
    ],
  },

  // ─── MacBooks ──────────────────────────────────────────────────────────────
  '6288be983afd8004d22ad851': { // Macbook 12
    name: 'MacBook 12" (2017)',
    specs: [
      { label: 'Phiên bản',     value: 'MacBook 12" Intel Core (2017)' },
      { label: 'Màn hình',      value: '12" Retina IPS, 2304 × 1440 px, 226 ppi' },
      { label: 'Chip',          value: 'Intel Core m3 / i5 / i7 (thế hệ 7, 2 nhân)' },
      { label: 'RAM',           value: '8 GB hoặc 16 GB LPDDR3' },
      { label: 'Ổ cứng',        value: '256 GB hoặc 512 GB SSD PCIe' },
      { label: 'Cổng kết nối',  value: '1 × USB-C (USB 3.1 Gen 1), 3,5 mm jack' },
      { label: 'Pin',           value: '41,4 Wh, ~10 giờ' },
      { label: 'Hệ điều hành',  value: 'macOS Sierra (hỗ trợ tối đa macOS Monterey)' },
      { label: 'Trọng lượng',   value: '0,92 kg' },
    ],
  },

  '6288beb73afd8004d22ad85b': { // Macbook Pro — 14" M4 (2024)
    name: 'MacBook Pro 14" M4 (2024)',
    specs: [
      { label: 'Phiên bản',     value: 'MacBook Pro 14" M4 (2024)' },
      { label: 'Màn hình',      value: '14,2" Liquid Retina XDR, 3024 × 1964 px, 254 ppi, ProMotion 120Hz' },
      { label: 'Chip',          value: 'Apple M4 (10 nhân CPU: 4P+6E, 10 nhân GPU)' },
      { label: 'RAM',           value: '24 GB hoặc 32 GB' },
      { label: 'Ổ cứng',        value: '512 GB / 1 TB / 2 TB SSD' },
      { label: 'Cổng kết nối',  value: '3 × Thunderbolt 5 (USB-C), HDMI 2.1, SD card, MagSafe 3, 3,5 mm' },
      { label: 'Pin',           value: '70 Wh, ~24 giờ phát video' },
      { label: 'Hệ điều hành',  value: 'macOS Sequoia' },
      { label: 'Trọng lượng',   value: '1,55 kg' },
    ],
  },

  '6288bea63afd8004d22ad856': { // Macbook Air — M2 (2022)
    name: 'MacBook Air M2 (2022)',
    specs: [
      { label: 'Phiên bản',     value: 'MacBook Air M2 13,6" (2022)' },
      { label: 'Màn hình',      value: '13,6" Liquid Retina IPS, 2560 × 1664 px, 224 ppi' },
      { label: 'Chip',          value: 'Apple M2 (8 nhân CPU, 8 nhân GPU)' },
      { label: 'RAM',           value: '8 GB / 16 GB / 24 GB' },
      { label: 'Ổ cứng',        value: '256 GB / 512 GB / 1 TB / 2 TB SSD' },
      { label: 'Cổng kết nối',  value: '2 × Thunderbolt/USB4, MagSafe 3, 3,5 mm jack' },
      { label: 'Pin',           value: '52,6 Wh, ~18 giờ phát video' },
      { label: 'Hệ điều hành',  value: 'macOS Ventura' },
      { label: 'Trọng lượng',   value: '1,24 kg' },
    ],
  },

  // ─── AirPods ───────────────────────────────────────────────────────────────
  '6af5a44e7338a05587091d2a': { // AirPods 5 (2026)
    name: 'AirPods 5 (2026)',
    specs: [
      { label: 'Chip',          value: 'Apple H2' },
      { label: 'Chống ồn',      value: 'Active Noise Cancellation, Transparency Mode, Adaptive Audio' },
      { label: 'Pin (tai)',      value: '~5 giờ nghe nhạc (ANC bật)' },
      { label: 'Pin (hộp)',      value: 'Sạc thêm ~22 giờ, tổng ~27 giờ' },
      { label: 'Kết nối',       value: 'Bluetooth 5.3' },
      { label: 'Chống nước',    value: 'Tai: IP57; Hộp sạc: IP54' },
      { label: 'Hộp sạc',       value: 'USB-C + sạc không dây (MagSafe / Qi)' },
    ],
  },

  '6af5a4ba7338a05587091d2c': { // AirPods Pro 3 (2025)
    name: 'AirPods Pro 3 (2025)',
    specs: [
      { label: 'Chip',          value: 'Apple H2 + UWB thế hệ 2 trong hộp sạc' },
      { label: 'Chống ồn',      value: 'Active Noise Cancellation, Transparency Mode, Adaptive Audio' },
      { label: 'Pin (tai)',      value: '~8 giờ nghe nhạc (ANC bật)' },
      { label: 'Pin (hộp)',      value: 'Sạc thêm ~24 giờ, tổng ~32 giờ' },
      { label: 'Kết nối',       value: 'Bluetooth 5.3' },
      { label: 'Chống nước',    value: 'Tai: IP54; Hộp sạc: IP54' },
      { label: 'Hộp sạc',       value: 'USB-C + sạc không dây (MagSafe / Qi)' },
    ],
  },

  '6af5a4f17338a05587091d2e': { // AirPods 4 (2024)
    name: 'AirPods 4 (2024)',
    specs: [
      { label: 'Chip',          value: 'Apple H2' },
      { label: 'Chống ồn',      value: 'Active Noise Cancellation (phiên bản ANC), Transparency Mode' },
      { label: 'Pin (tai)',      value: '~5 giờ nghe nhạc (ANC bật)' },
      { label: 'Pin (hộp)',      value: 'Sạc thêm ~20 giờ, tổng ~25 giờ' },
      { label: 'Kết nối',       value: 'Bluetooth 5.3' },
      { label: 'Chống nước',    value: 'Tai: IP54; Hộp sạc: IP54' },
      { label: 'Hộp sạc',       value: 'USB-C + sạc không dây (MagSafe / Qi)' },
    ],
  },

  '6af5a6d37338a05587091d30': { // AirPods Max 2 (2026)
    name: 'AirPods Max 2 (2026)',
    specs: [
      { label: 'Chip',          value: 'Apple H2 (mỗi tai một chip)' },
      { label: 'Chống ồn',      value: 'Active Noise Cancellation, Transparency Mode, Adaptive Audio' },
      { label: 'Pin',           value: '~20 giờ nghe nhạc (ANC bật)' },
      { label: 'Kết nối',       value: 'Bluetooth 5.3, USB-C (hỗ trợ audio kỹ thuật số 24-bit/48kHz)' },
      { label: 'Chống nước',    value: 'IPX4' },
      { label: 'Chất liệu',     value: 'Khung nhôm, đệm tai mesh dệt, vải headband' },
    ],
  },

  '6af5a7087338a05587091d32': { // AirPods Max (original, 2020)
    name: 'AirPods Max (2020)',
    specs: [
      { label: 'Chip',          value: 'Apple H1 (2 chip, mỗi tai một)' },
      { label: 'Chống ồn',      value: 'Active Noise Cancellation, Transparency Mode' },
      { label: 'Pin',           value: '~20 giờ nghe nhạc (ANC bật)' },
      { label: 'Kết nối',       value: 'Bluetooth 5.0, cổng Lightning' },
      { label: 'Chống nước',    value: 'IPX4' },
      { label: 'Chất liệu',     value: 'Khung thép không gỉ, đệm tai memory foam, vải headband' },
    ],
  },

  // ─── Apple Watch ───────────────────────────────────────────────────────────
  '6af5a8867338a05587091d34': { // Apple Watch 11 — Series 11 (2025)
    name: 'Apple Watch Series 11 (2025)',
    specs: [
      { label: 'Màn hình',      value: 'LTPO3 OLED luôn bật, 42mm hoặc 46mm, 2000 nit, 326 ppi' },
      { label: 'Chip',          value: 'Apple S10 SiP (64-bit dual-core)' },
      { label: 'Pin',           value: '~24 giờ (thông thường), ~38 giờ chế độ tiết kiệm' },
      { label: 'Chống nước',    value: 'WR50, lặn tới 6m (depth gauge)' },
      { label: 'Cảm biến',      value: 'ECG, SpO2, nhiệt độ da, nhịp tim quang học thế hệ 3' },
      { label: 'Kết nối',       value: 'Wi-Fi 6, Bluetooth 5.3, NFC, UWB thế hệ 2' },
      { label: 'Chất liệu vỏ',  value: 'Nhôm hoặc Titan' },
    ],
  },

  '6af5a9147338a05587091d36': { // Apple Watch 4 — Series 4 (2018)
    name: 'Apple Watch Series 4 (2018)',
    specs: [
      { label: 'Màn hình',      value: 'LTPO OLED, 40mm (1.57") hoặc 44mm (1.78")' },
      { label: 'Chip',          value: 'Apple S4 SiP (64-bit dual-core)' },
      { label: 'Pin',           value: '~18 giờ sử dụng thông thường' },
      { label: 'Chống nước',    value: 'WR50' },
      { label: 'Cảm biến',      value: 'ECG (điện tâm đồ lần đầu trên Apple Watch), nhịp tim quang học' },
      { label: 'Kết nối',       value: 'Wi-Fi 802.11b/g/n 2.4+5 GHz, Bluetooth 5.0, NFC' },
      { label: 'Chất liệu vỏ',  value: 'Nhôm, Thép không gỉ, hoặc Titan' },
    ],
  },

  '6af5a9307338a05587091d38': { // Apple Watch 9 — Series 9 (2023)
    name: 'Apple Watch Series 9 (2023)',
    specs: [
      { label: 'Màn hình',      value: 'LTPO3 OLED luôn bật, 41mm (1.69") hoặc 45mm (1.92")' },
      { label: 'Chip',          value: 'Apple S9 SiP (64-bit dual-core)' },
      { label: 'Pin',           value: '~18 giờ (thông thường), ~36 giờ chế độ tiết kiệm' },
      { label: 'Chống nước',    value: 'WR50' },
      { label: 'Cảm biến',      value: 'ECG, SpO2, nhiệt độ da, Double Tap gesture' },
      { label: 'Kết nối',       value: 'Wi-Fi 802.11b/g/n 2.4+5 GHz, Bluetooth 5.3, NFC' },
      { label: 'Chất liệu vỏ',  value: 'Nhôm (Starlight/Midnight/Pink/Red/Silver) hoặc Thép' },
    ],
  },

  '6af5a9427338a05587091d3a': { // Apple Watch 12 — Series 12 (2026)
    name: 'Apple Watch Series 12 (2026)',
    specs: [
      { label: 'Màn hình',      value: 'LTPO3 OLED luôn bật, 42mm hoặc 46mm, 2000 nit' },
      { label: 'Chip',          value: 'Apple S11 SiP (64-bit dual-core)' },
      { label: 'Pin',           value: '~24 giờ (thông thường), ~38 giờ chế độ tiết kiệm; sạc nhanh 15 phút đủ dùng ~12 giờ' },
      { label: 'Chống nước',    value: 'WR50' },
      { label: 'Cảm biến',      value: 'ECG, SpO2, nhiệt độ da, cảm biến nhịp tim' },
      { label: 'Kết nối',       value: 'Wi-Fi 6, Bluetooth 5.3, NFC' },
      { label: 'Chất liệu vỏ',  value: 'Nhôm hoặc Titan' },
    ],
  },

  '6af5a9597338a05587091d3c': { // Apple Watch Ultra 3 (2025)
    name: 'Apple Watch Ultra 3 (2025)',
    specs: [
      { label: 'Màn hình',      value: 'LTPO3 OLED luôn bật, 49mm (2.05"), 3000 nit' },
      { label: 'Chip',          value: 'Apple S10 SiP (64-bit dual-core)' },
      { label: 'Pin',           value: '~42 giờ (thông thường), ~72 giờ chế độ tiết kiệm; sạc 45 phút đạt 80%' },
      { label: 'Chống nước',    value: 'WR100 + EN13319, lặn tới 40m (giải trí)' },
      { label: 'Cảm biến',      value: 'ECG, SpO2, nhiệt độ da, độ cao, cảm biến gia tốc cao (High-g)' },
      { label: 'Kết nối',       value: 'Wi-Fi 6, Bluetooth 5.3, NFC, UWB, GPS L1+L5' },
      { label: 'Chất liệu vỏ',  value: 'Titan Aerospace Grade (49mm, ~61g)' },
    ],
  },
};

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const col = mongoose.connection.collection('products');
    const ids = targetId ? [targetId] : Object.keys(SPECS_DATA);

    for (const id of ids) {
      const entry = SPECS_DATA[id];
      if (!entry) { console.log(`No specs defined for id ${id}`); continue; }

      if (DRY_RUN) {
        console.log(`\n[DRY RUN] Would update: ${entry.name} (${id})`);
        console.log(JSON.stringify(entry.specs, null, 2));
        continue;
      }

      const result = await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { specs: entry.specs } }
      );
      if (result.matchedCount === 0) {
        console.log(`NOT FOUND: ${id} (${entry.name})`);
      } else {
        console.log(`Updated: ${entry.name} (${id}) — modifiedCount: ${result.modifiedCount}`);
      }
    }

    if (!DRY_RUN) {
      // Verify
      const updated = await col.find(
        { _id: { $in: ids.map(id => new ObjectId(id)) } },
        { projection: { name: 1, 'specs.label': 1 } }
      ).toArray();
      console.log('\nVerification:');
      updated.forEach(p => console.log(`  ${p.name}: ${p.specs?.length ?? 0} specs`));
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
