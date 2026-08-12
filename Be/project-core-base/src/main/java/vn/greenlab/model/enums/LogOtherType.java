package vn.greenlab.model.enums;

public enum LogOtherType {
    SAMPLES_ISSUES("Khách hàng cần xử lý"),
    DOCTOR_CONFIG("Cấu hình bác sĩ"),
    APPOINTMENTS("Địa chỉ / Lịch hẹn"),
    PATIENT_ORDER("Nhập chỉ định"),
    PRICE_POLICY_DOCTOR("Chính sách giá Bác sĩ/Phòng khám"),
    PRICE_POLICY("Chính sách giá"),
    PRICE_POLICY_TEST("Chính sách giá Xét nghiệm"),
    TEST_HISTORY("Quản lý lịch sử xét nghiệm"),
    RECEIVER_SAMPLES_ISSUES("Mẫu xét nghiệm cần xử lý"),
    QUICK_SAMPLE_HANDOVER("Bàn giao mẫu nhanh"),
    RECEIVER_SAMPLES("Bàn giao mẫu"),
    PHONE_BOOK("Danh bạ"),
    PATIENT_RESULT_PRINT("In trả kết quả khách hàng"),
    MEDIACAL_RECORD("Bệnh án, bênh phẩm"),
    PATIENT("Hồ sơ bệnh nhân"),
    QUICK_SAMPLE_RECEPTIONS("Nhận mẫu nhanh"),
    SAMPLE_RECEPTIONS("Nhận mẫu"),
    MACHINE_RESULT("Cập nhật kết quả"),
    TEST_RESULT("Kết quả xét nghiệm"),
    ;

    private final String description;

    LogOtherType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
