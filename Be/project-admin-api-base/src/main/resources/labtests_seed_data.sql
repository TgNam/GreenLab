-- =====================================================
-- SQL Script: Tạo bảng và seed data cho module Lab Tests
-- Mô tả: Quản lý xét nghiệm và gói xét nghiệm
-- =====================================================

-- =====================================================
-- 1. TẠO BẢNG
-- =====================================================

-- Bảng phân loại xét nghiệm
CREATE TABLE IF NOT EXISTS `test_category` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Mã loại xét nghiệm VD: HEMATOLOGY',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên loại VD: Huyết học',
  `description` TEXT COMMENT 'Mô tả chi tiết về loại xét nghiệm này',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái hoạt động: TRUE = đang sử dụng',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo bản ghi',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật cuối'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng loại mẫu xét nghiệm
CREATE TABLE IF NOT EXISTS `specimen_type` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Mã loại mẫu VD: SERUM',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên loại mẫu VD: Huyết thanh',
  `description` TEXT COMMENT 'Mô tả loại mẫu',
  `preparation_instruction` TEXT COMMENT 'Hướng dẫn chuẩn bị trước khi lấy mẫu VD: Nhịn ăn 8-12h',
  `storage_requirement` VARCHAR(200) COMMENT 'Yêu cầu bảo quản VD: Bảo quản lạnh 2-8C',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái hoạt động',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng đơn vị đo lường
CREATE TABLE IF NOT EXISTS `unit` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Mã đơn vị VD: G_DL',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên đầy đủ VD: Gram per Deciliter',
  `symbol` VARCHAR(10) COMMENT 'Ký hiệu VD: g/dL',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái hoạt động',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng loại giảm giá
CREATE TABLE IF NOT EXISTS `discount_type` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Mã: PERCENT, FIXED',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên: Giảm phần trăm, Giảm cố định',
  `calculation_method` ENUM('PERCENTAGE', 'FIXED') DEFAULT 'PERCENTAGE' COMMENT 'Phương thức tính: percentage(%) hoặc fixed(VND)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng danh mục gói xét nghiệm
CREATE TABLE IF NOT EXISTS `panel_category` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Mã danh mục VD: KIDNEY',
  `name` VARCHAR(200) NOT NULL COMMENT 'Tên đầy đủ VD: Chức năng thận',
  `slug` VARCHAR(200) UNIQUE NOT NULL COMMENT 'Đường dẫn VD: chuc-nang-than',
  `description` TEXT COMMENT 'Mô tả danh mục',
  `image_url` VARCHAR(500) COMMENT 'URL hình ảnh minh họa',
  `display_order` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị trên website',
  `is_featured` BOOLEAN DEFAULT FALSE COMMENT 'Hiển thị nổi bật trên trang chủ',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái hoạt động',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng thông tin xét nghiệm
CREATE TABLE IF NOT EXISTS `test` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã xét nghiệm VD: GLU001',
  `name` VARCHAR(300) NOT NULL COMMENT 'Tên đầy đủ VD: Định lượng Glucose [Mẫu]',
  `short_name` VARCHAR(100) COMMENT 'Tên viết tắt VD: Glucose',
  `description` TEXT COMMENT 'Mô tả chi tiết phương pháp và ý nghĩa',
  `method` VARCHAR(200) COMMENT 'Phương pháp xét nghiệm VD: Enzymatic',
  `test_category_id` INT NOT NULL COMMENT 'Loại xét nghiệm VD: Sinh hóa',
  `specimen_type_id` INT NOT NULL COMMENT 'Loại mẫu lấy VD: Huyết thanh',
  `unit_id` INT NOT NULL COMMENT 'Đơn vị VD: ml',
  `normal_value_min` DECIMAL(10,4) COMMENT 'Giá trị tối thiểu bình thường',
  `normal_value_max` DECIMAL(10,4) COMMENT 'Giá trị tối đa bình thường',
  `normal_value_text` VARCHAR(200) COMMENT 'Giá trị tham chiếu dạng text VD: < 200',
  `price` DECIMAL(12,0) NOT NULL DEFAULT 0 COMMENT 'Giá xét nghiệm VND',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái hoạt động',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`test_category_id`) REFERENCES `test_category` (`id`),
  FOREIGN KEY (`specimen_type_id`) REFERENCES `specimen_type` (`id`),
  FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng thông tin gói xét nghiệm
CREATE TABLE IF NOT EXISTS `panel` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã gói VD: PK001',
  `name` VARCHAR(300) NOT NULL COMMENT 'Tên đầy đủ VD: Gói xét nghiệm Chức năng thận',
  `short_description` VARCHAR(500) COMMENT 'Mô tả ngắn 1-2 câu',
  `panel_category_id` INT NOT NULL COMMENT 'Danh mục gói VD: Chức năng thận',
  `discount_type_id` INT COMMENT 'Loại giảm giá áp dụng',
  `test_count` INT DEFAULT 0 COMMENT 'Tổng số xét nghiệm trong gói (tự động cập nhật)',
  `original_price` DECIMAL(12,0) NOT NULL DEFAULT 0 COMMENT 'Giá chưa giảm',
  `selling_price` DECIMAL(12,0) NOT NULL DEFAULT 0 COMMENT 'Giá bán (đã giảm nếu có)',
  `discount_amount` DECIMAL(12,0) DEFAULT 0 COMMENT 'Số tiền được giảm',
  `discount_value` DECIMAL(10,2) COMMENT 'Phần trăm hoặc số tiền giảm',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`panel_category_id`) REFERENCES `panel_category` (`id`),
  FOREIGN KEY (`discount_type_id`) REFERENCES `discount_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng trung gian liên kết Panel và Test
CREATE TABLE IF NOT EXISTS `panel_test` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `panel_id` INT NOT NULL COMMENT 'ID gói xét nghiệm',
  `test_id` INT NOT NULL COMMENT 'ID xét nghiệm',
  `is_primary` BOOLEAN DEFAULT FALSE COMMENT 'Xét nghiệm chính ( TRUE = hiển thị nổi bật)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`panel_id`) REFERENCES `panel` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`test_id`) REFERENCES `test` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_panel_test` (`panel_id`, `test_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo indexes
CREATE INDEX idx_test_category ON test (test_category_id);
CREATE INDEX idx_test_specimen ON test (specimen_type_id);
CREATE INDEX idx_test_active ON test (is_active);
CREATE INDEX idx_panel_test_panel ON panel_test (panel_id);
CREATE INDEX idx_panel_test_test ON panel_test (test_id);

-- =====================================================
-- 2. SEED DATA - LOẠI GIẢM GIÁ
-- =====================================================

INSERT INTO `discount_type` (`code`, `name`, `calculation_method`) VALUES
('PERCENT', 'Giảm phần trăm', 'PERCENTAGE'),
('FIXED', 'Giảm cố định', 'FIXED');

-- =====================================================
-- 3. SEED DATA - ĐƠN VỊ ĐO LƯỜNG
-- =====================================================

INSERT INTO `unit` (`code`, `name`, `symbol`) VALUES
('G_DL', 'Gram / Decilit', 'g/dL'),
('MG_DL', 'Milligram / Decilit', 'mg/dL'),
('UMOL_L', 'Micromol / Litter', 'µmol/L'),
('MMOL_L', 'Millimol / Litter', 'mmol/L'),
('U_L', 'Unit / Litter', 'U/L'),
('NG_ML', 'Nanogram / Mililit', 'ng/mL'),
('PG_ML', 'Picogram / Mililit', 'pg/mL'),
('IU_ML', 'International Unit', 'IU/mL'),
('NONE', 'Không có', NULL);

-- =====================================================
-- 4. SEED DATA - LOẠI MẪU XÉT NGHIỆM
-- =====================================================

INSERT INTO `specimen_type` (`code`, `name`, `description`, `preparation_instruction`, `storage_requirement`) VALUES
('SERUM', 'Huyết thanh', 'Mẫu huyết thanh sau khi đông máu', 'Nhịn ăn 8-12 giờ trước khi lấy mẫu', 'Bảo quản lạnh 2-8°C'),
('BLOOD', 'Máu toàn phần', 'Máu toàn phần có chất chống đông', 'Không cần kiêng đặc biệt', 'Phân tích trong 4 giờ'),
('URINE', 'Nước tiểu', 'Mẫu nước tiểu', 'Lấy mẫu giữa dòng, buổi sáng', 'Bảo quản lạnh 2-8°C'),
('PLASMA_EDTA', 'Mẫu plasma (EDTA)', 'Máu có chất chống đông EDTA', 'Không cần kiêng đặc biệt', 'Bảo quản lạnh 2-8°C'),
('PLASMA_HEP', 'Mẫu plasma (Heparin)', 'Máu có chất chống đông Heparin', 'Không cần kiêng đặc biệt', 'Bảo quản lạnh 2-8°C'),
('CSF', 'Dịch não tủy', 'Dịch não tủy', 'Theo yêu cầu bác sĩ', 'Bảo quản lạnh 2-8°C'),
('SWAB', 'Gây chết', 'Gây chết từ các vị trí', 'Theo hướng dẫn của bác sĩ', 'Bảo quản 2-25°C');

-- =====================================================
-- 5. SEED DATA - PHÂN LOẠI XÉT NGHIỆM
-- =====================================================

INSERT INTO `test_category` (`code`, `name`, `description`) VALUES
('HEMATOLOGY', 'Huyết học', 'Các xét nghiệm liên quan đến máu và các thành phần máu'),
('BIOCHEMISTRY', 'Sinh hóa', 'Các xét nghiệm sinh hóa máu, chức năng gan, thận, lipid...'),
('HORMONE', 'Hormone', 'Các xét nghiệm hormone tuyến giáp, sinh sản...'),
('INFECTION', 'Nhiễm khuẩn', 'Các xét nghiệm viêm nhiễm, kháng thể...'),
('TUMOR_MARKER', 'Dấu ấn ung thư', 'Các xét nghiệm dấu ấn ung thư'),
('URINALYSIS', 'Nước tiểu', 'Các xét nghiệm phân tích nước tiểu'),
('ALLERGY', 'Dị ứng', 'Các xét nghiệm dị ứng'),
('GENETIC', 'Di truyền', 'Các xét nghiệm di truyền'),
('OTHER', 'Khác', 'Các xét nghiệm khác');

-- =====================================================
-- 6. SEED DATA - DANH MỤC GÓI XÉT NGHIỆM
-- =====================================================

INSERT INTO `panel_category` (`code`, `name`, `slug`, `description`, `display_order`, `is_featured`, `is_active`) VALUES
('KIDNEY', 'Chức năng thận', 'chuc-nang-than', 'Xét nghiệm đánh giá chức năng thận', 1, TRUE, TRUE),
('DIABETES', 'Tiểu đường', 'tieu-duong', 'Xét nghiệm tầm soát tiểu đường', 2, TRUE, TRUE),
('BONE', 'Xương', 'loang-xuong', 'Xét nghiệm loãng xương', 3, FALSE, TRUE),
('STD', 'Bệnh xã hội', 'benh-xa-hoi-std', 'Xét nghiệm bệnh lây truyền qua đường tình dục', 4, FALSE, TRUE),
('NUTRITION', 'Dinh dưỡng', 'dinh-duong', 'Xét nghiệm đánh giá dinh dưỡng', 5, TRUE, TRUE),
('GENERAL', 'Tổng quát', 'tong-quat', 'Xét nghiệm tổng quát sức khỏe', 6, TRUE, TRUE),
('CANCER', 'Ung thư', 'ung-thu', 'Xét nghiệm tầm soát ung thư', 7, TRUE, TRUE),
('VITAMIN', 'Vitamin & Khoáng chất', 'vitamin-khoang-chat', 'Xét nghiệm vi chất dinh dưỡng', 8, FALSE, TRUE),
('ALLERGY', 'Dị ứng', 'di-ung', 'Xét nghiệm dị ứng thực phẩm', 9, FALSE, TRUE),
('THYROID', 'Tuyến giáp', 'tuyen-giap', 'Xét nghiệm chức năng tuyến giáp', 10, FALSE, TRUE);

-- =====================================================
-- 7. SEED DATA - XÉT NGHIỆM MẪU
-- =====================================================

-- Huyết học (category_id = 1)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('HEM001', 'Tổng phân tích tế bào máu ngoại vi', 'CBC', 'Tự động hóa', 1, 2, 9, NULL, NULL, '-', 98000),
('HEM002', 'Xét nghiệm công thức máu (CBC)', 'WBC', 'Tự động hóa', 1, 2, 9, NULL, NULL, '-', 35000),
('HEM003', 'Hemoglobin', 'Hgb', NULL, 1, 2, 1, 12, 16, '12-16 g/dL (Nữ), 14-18 g/dL (Nam)', 25000),
('HEM004', 'Hematocrit', 'Hct', NULL, 1, 2, 9, 36, 48, '36-48%', 20000),
('HEM005', 'Hồng cầu (RBC)', 'RBC', NULL, 1, 2, 9, 4, 6, '4-6 triệu/mm³', 25000);

-- Sinh hóa - Đường huyết (category_id = 2)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('BIO001', 'Định lượng Glucose [Mẫu]', 'Glucose', 'Enzymatic', 2, 1, 2, 70, 100, '< 100 mg/dL', 30000),
('BIO002', 'Định lượng HbA1c [Mẫu]', 'HbA1c', 'HPLC', 2, 1, 9, NULL, NULL, '< 5.7%', 153000),
('BIO003', 'Glucose lúc đói', 'Glucose Fasting', 'Enzymatic', 2, 1, 2, 70, 100, '70-100 mg/dL', 30000),
('BIO004', 'Insulin', 'Insulin', 'CLIA', 2, 1, 7, 2.6, 24.9, '2.6-24.9 IU/mL', 120000);

-- Sinh hóa - Lipid (category_id = 2)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('BIO010', 'Định lượng Cholesterol toàn phần', 'Cholesterol', 'Enzymatic', 2, 1, 2, NULL, NULL, '< 200 mg/dL', 37000),
('BIO011', 'Định lượng Triglyceride [Huyết Thanh]', 'Triglyceride', 'Enzymatic', 2, 1, 2, NULL, NULL, '< 150 mg/dL', 37000),
('BIO012', 'Định lượng HDL Cholesterol', 'HDL', 'Enzymatic', 2, 1, 2, NULL, NULL, '> 40 mg/dL', 40000),
('BIO013', 'Định lượng LDL Cholesterol', 'LDL', 'Enzymatic', 2, 1, 2, NULL, NULL, '< 100 mg/dL', 45000),
('BIO014', 'Định lượng VLDL Cholesterol', 'VLDL', 'Tính toán', 2, 1, 2, 5, 40, '5-40 mg/dL', 35000);

-- Sinh hóa - Chức năng gan (category_id = 2)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('BIO020', 'Định lượng AST (GOT) [Huyết Thanh]', 'AST', 'Kinetic', 2, 1, 4, NULL, NULL, '< 35 U/L', 30000),
('BIO021', 'Định lượng ALT (GPT) [Huyết Thanh]', 'ALT', 'Kinetic', 2, 1, 4, NULL, NULL, '< 35 U/L', 30000),
('BIO022', 'Định lượng GGT [Huyết Thanh]', 'GGT', 'Kinetic', 2, 1, 4, NULL, NULL, '< 55 U/L', 55000),
('BIO023', 'Định lượng ALP [Mẫu]', 'ALP', 'Kinetic', 2, 1, 4, 44, 147, '44-147 U/L', 55000),
('BIO024', 'Định lượng Bilirubin toàn phần', 'Bilirubin TP', 'DPD', 2, 1, 2, 0.2, 1.2, '0.2-1.2 mg/dL', 25000),
('BIO028', 'Định lượng Albumin [Huyết Thanh]', 'Albumin', 'BCG', 2, 1, 2, 35, 50, '35-50 g/L', 30000);

-- Sinh hóa - Chức năng thận (category_id = 2)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('BIO040', 'Định lượng Creatinin [Mẫu]', 'Creatinin', 'Jaffe', 2, 1, 2, 0.6, 1.2, '0.6-1.2 mg/dL', 30000),
('BIO041', 'Định lượng Ure máu [Mẫu]', 'Ure', 'Enzymatic', 2, 1, 2, 10, 40, '10-40 mg/dL', 30000),
('BIO042', 'Định lượng BUN', 'BUN', 'Enzymatic', 2, 1, 2, 7, 20, '7-20 mg/dL', 30000),
('BIO043', 'Độ lọc cầu thận ước tính (eGFR)', 'eGFR', 'Tính toán', 2, 1, 9, NULL, NULL, '> 90 mL/min/1.73m²', 30000),
('BIO044', 'Acid Uric', 'Uric Acid', 'Enzymatic', 2, 1, 2, 3.4, 7.0, '3.4-7.0 mg/dL', 30000);

-- Sinh hóa - Vi chất (category_id = 2)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('BIO050', 'Định lượng Canxi toàn phần [Huyết Thanh]', 'Canxi', 'Arsenazo', 2, 1, 2, 8.5, 10.5, '8.5-10.5 mg/dL', 30000),
('BIO051', 'Định lượng Canxi ion hóa [Mẫu]', 'Canxi ion', 'ISE', 2, 1, 2, 4.5, 5.6, '4.5-5.6 mg/dL', 60000),
('BIO052', 'Định lượng Phospho [Mẫu]', 'Phospho', 'Phosphomolybdate', 2, 1, 2, 2.5, 4.5, '2.5-4.5 mg/dL', 30000),
('BIO053', 'Định lượng Magnesium [Huyết Thanh]', 'Magnesium', 'Xylidyl Blue', 2, 1, 2, 1.7, 2.4, '1.7-2.4 mg/dL', 55000),
('BIO055', 'Định lượng Ferritin [Huyết Thanh]', 'Ferritin', 'CLIA', 2, 1, 5, 20, 200, '20-200 ng/mL', 139000),
('BIO058', 'Định lượng Kẽm (Zn) [Mẫu]', 'Kẽm', 'Atomic', 2, 1, 2, 70, 120, '70-120 µg/dL', 253000);

-- Hormone (category_id = 3)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('HOR001', 'TSH', 'TSH', 'CLIA', 3, 1, 7, 0.4, 4.0, '0.4-4.0 mIU/L', 120000),
('HOR002', 'FT3', 'FT3', 'CLIA', 3, 1, 9, 3.5, 6.5, '3.5-6.5 pmol/L', 120000),
('HOR003', 'FT4', 'FT4', 'CLIA', 3, 1, 9, 12, 22, '12-22 pmol/L', 120000),
('HOR008', 'PTH', 'PTH', 'CLIA', 3, 1, 5, 15, 65, '15-65 pg/mL', 200000);

-- Vitamin (category_id = 2 hoặc tạo category mới)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('VIT001', 'Định lượng 25-OH Vitamin D [Huyết Thanh]', 'Vitamin D', 'CLIA', 2, 1, 5, NULL, NULL, '30-100 ng/mL', 345000),
('VIT002', 'Định lượng Vitamin B12 [Huyết Thanh]', 'Vitamin B12', 'CLIA', 2, 1, 6, 200, 900, '200-900 pg/mL', 173000),
('VIT003', 'Định lượng Acid Folic [Huyết Thanh]', 'Folic Acid', 'CLIA', 2, 1, 6, 3, 16, '3-16 ng/mL', 139000);

-- Nhiễm khuẩn (category_id = 4)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_text`, `price`) VALUES
('INF001', 'HIV Ag/Ab', 'HIV', 'CMIA', 4, 1, 9, 'Âm tính', 120000),
('INF002', 'HBs Ag', 'HBs Ag', 'CMIA', 4, 1, 9, 'Âm tính', 85000),
('INF003', 'HBs Ab', 'HBs Ab', 'CMIA', 4, 1, 9, 'Âm tính', 85000),
('INF008', 'HCV Ab', 'HCV', 'CMIA', 4, 1, 9, 'Âm tính', 85000);

-- Dấu ấn ung thư (category_id = 5)
INSERT INTO `test` (`code`, `name`, `short_name`, `method`, `test_category_id`, `specimen_type_id`, `unit_id`, `normal_value_min`, `normal_value_max`, `normal_value_text`, `price`) VALUES
('TM001', 'Định lượng AFP', 'AFP', 'CLIA', 5, 1, 5, NULL, NULL, '< 10 ng/mL', 180000),
('TM002', 'Định lượng CEA (Carcinoembryonic Antigen)', 'CEA', 'CLIA', 5, 1, 5, NULL, NULL, '< 5 ng/mL', 274000),
('TM003', 'Định lượng CA 19-9', 'CA 19-9', 'CLIA', 5, 1, 9, NULL, NULL, '< 37 U/mL', 274000),
('TM007', 'Định lượng Cyfra 21-1', 'Cyfra 21-1', 'CLIA', 5, 1, 5, NULL, NULL, '< 3.3 ng/mL', 274000);

-- =====================================================
-- 8. SEED DATA - GÓI XÉT NGHIỆM
-- =====================================================

-- PK001: Chức năng thận (panel_category_id = 1)
INSERT INTO `panel` (`code`, `name`, `short_description`, `panel_category_id`, `test_count`, `original_price`, `selling_price`, `discount_amount`, `discount_type_id`, `discount_value`) VALUES
('PK001', 'Gói xét nghiệm Chức năng thận', 'Đánh giá toàn diện chức năng thận với 5 xét nghiệm cơ bản', 1, 5, 180000, 152000, 28000, 1, 15.56);

-- PK002: Tầm soát Tiểu đường, Mỡ máu, Gan & Thận
INSERT INTO `panel` (`code`, `name`, `short_description`, `panel_category_id`, `test_count`, `original_price`, `selling_price`, `discount_amount`, `discount_type_id`, `discount_value`) VALUES
('PK002', 'Tầm soát Bệnh mãn tính sớm - Tiểu đường, Mỡ máu, Gan & Thận', 'Gói 16 xét nghiệm tầm soát bệnh mãn tính', 2, 16, 850000, 695000, 155000, 1, 18.24);

-- PK003: Loãng xương
INSERT INTO `panel` (`code`, `name`, `short_description`, `panel_category_id`, `test_count`, `original_price`, `selling_price`, `discount_amount`, `discount_type_id`, `discount_value`) VALUES
('PK003', 'Gói xét nghiệm Loãng xương', 'Đánh giá nguy cơ loãng xương với 10 xét nghiệm chuyên sâu', 3, 10, 1200000, 967000, 233000, 1, 19.42);

-- PK006: Tổng quát
INSERT INTO `panel` (`code`, `name`, `short_description`, `panel_category_id`, `test_count`, `original_price`, `selling_price`, `discount_amount`, `discount_type_id`, `discount_value`) VALUES
('PK006', 'Xét nghiệm máu Tổng quát', 'Gói 39 xét nghiệm đánh giá sức khỏe toàn diện', 6, 39, 8995000, 5999000, 2996000, 1, 33.31);

-- PK007: Ung thư phổi
INSERT INTO `panel` (`code`, `name`, `short_description`, `panel_category_id`, `test_count`, `original_price`, `selling_price`, `discount_amount`, `discount_type_id`, `discount_value`) VALUES
('PK007', 'Theo dõi dấu ấn Ung thư phổi', 'Theo dõi dấu ấn ung thư phổi với 2 xét nghiệm', 7, 2, 548000, 500000, 48000, 1, 8.76);

-- PK008: Vitamin & Khoáng chất
INSERT INTO `panel` (`code`, `name`, `short_description`, `panel_category_id`, `test_count`, `original_price`, `selling_price`, `discount_type_id`, `discount_value`) VALUES
('PK008', 'Vi chất dinh dưỡng cho trẻ em & người lớn', 'Đánh giá vitamin và khoáng chất thiết yếu', 8, 9, 1525000, 1525000, NULL, NULL, NULL);

-- PK010: Mỡ máu
INSERT INTO `panel` (`code`, `name`, `short_description`, `panel_category_id`, `test_count`, `original_price`, `selling_price`, `discount_amount`, `discount_type_id`, `discount_value`) VALUES
('PK010', 'Xét nghiệm Mỡ máu', 'Đánh giá profile lipid máu với 5 xét nghiệm', 2, 5, 219000, 176000, 43000, 1, 19.63);

-- =====================================================
-- 9. SEED DATA - LIÊN KẾT PANEL - TEST
-- =====================================================

-- PK001: Chức năng thận (5 tests)
INSERT INTO `panel_test` (`panel_id`, `test_id`, `is_primary`) VALUES
(1, 14, TRUE),  -- Creatinin
(1, 15, TRUE),  -- Ure
(1, 17, FALSE),  -- eGFR
(1, 16, FALSE),  -- BUN
(1, 18, FALSE);  -- Acid Uric

-- PK002: Tầm soát bệnh mãn tính (16 tests)
INSERT INTO `panel_test` (`panel_id`, `test_id`, `is_primary`) VALUES
(2, 5, FALSE),   -- CBC
(2, 6, FALSE),   -- WBC
(2, 7, TRUE),   -- Glucose
(2, 8, TRUE),   -- HbA1c
(2, 9, FALSE),   -- Cholesterol
(2, 10, FALSE),  -- Triglyceride
(2, 11, FALSE),  -- HDL
(2, 12, FALSE),  -- LDL
(2, 13, FALSE),  -- VLDL
(2, 14, FALSE),  -- AST
(2, 15, FALSE),  -- ALT
(2, 19, FALSE),  -- GGT
(2, 20, FALSE),  -- Bilirubin
(2, 22, FALSE),  -- Albumin
(2, 25, FALSE),  -- Creatinin
(2, 26, FALSE);   -- eGFR

-- PK003: Loãng xương (10 tests)
INSERT INTO `panel_test` (`panel_id`, `test_id`, `is_primary`) VALUES
(3, 23, FALSE),  -- ALP
(3, 22, FALSE),  -- Albumin
(3, 29, TRUE),   -- Canxi
(3, 30, FALSE),  -- Canxi ion
(3, 31, FALSE),  -- Phospho
(3, 32, TRUE),   -- Vitamin D
(3, 28, FALSE),  -- Magnesium
(3, 37, FALSE),  -- PTH
(3, 22, FALSE),  -- Albumin
(3, 7, FALSE);   -- Glucose

-- PK006: Tổng quát (một phần - 20 tests tiêu biểu)
INSERT INTO `panel_test` (`panel_id`, `test_id`, `is_primary`) VALUES
(4, 5, FALSE),   -- CBC
(4, 7, TRUE),   -- Glucose
(4, 8, TRUE),   -- HbA1c
(4, 9, FALSE),   -- Cholesterol
(4, 10, FALSE),  -- Triglyceride
(4, 11, FALSE),  -- HDL
(4, 12, FALSE),  -- LDL
(4, 13, FALSE),  -- VLDL
(4, 14, TRUE),   -- AST
(4, 15, TRUE),   -- ALT
(4, 19, FALSE),  -- GGT
(4, 20, FALSE),  -- Bilirubin
(4, 22, FALSE),  -- Albumin
(4, 25, FALSE),  -- Creatinin
(4, 26, FALSE),  -- eGFR
(4, 29, FALSE),  -- Canxi
(4, 31, FALSE),  -- Phospho
(4, 32, FALSE),  -- Vitamin D
(4, 38, FALSE),  -- TSH
(4, 39, FALSE);  -- FT4

-- PK007: Ung thư phổi (2 tests)
INSERT INTO `panel_test` (`panel_id`, `test_id`, `is_primary`) VALUES
(5, 46, TRUE),   -- CEA
(5, 47, TRUE);   -- Cyfra 21-1

-- PK008: Vitamin & Khoáng chất (9 tests)
INSERT INTO `panel_test` (`panel_id`, `test_id`, `is_primary`) VALUES
(6, 33, FALSE),  -- Kẽm
(6, 31, FALSE),  -- Phospho
(6, 29, FALSE),  -- Canxi
(6, 30, FALSE),  -- Canxi ion
(6, 28, FALSE),  -- Magnesium
(6, 32, TRUE),   -- Vitamin D
(6, 35, FALSE),   -- Vitamin B12
(6, 36, FALSE),   -- Folic Acid
(6, 33, FALSE);  -- Kẽm

-- PK010: Mỡ máu (5 tests)
INSERT INTO `panel_test` (`panel_id`, `test_id`, `is_primary`) VALUES
(7, 10, TRUE),   -- Triglyceride
(7, 9, TRUE),    -- Cholesterol
(7, 11, FALSE),  -- HDL
(7, 12, FALSE),  -- LDL
(7, 13, FALSE);  -- VLDL

-- =====================================================
-- 10. CẬP NHẬT TEST_COUNT CHO CÁC PANEL
-- =====================================================

UPDATE panel p SET test_count = (
    SELECT COUNT(*) FROM panel_test pt WHERE pt.panel_id = p.id
);
