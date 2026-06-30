package vn.greenlab.model.enums;

public enum OSSType {
    DIGITAL_SIGNATURE("Ảnh chữ ký", "digital_signature"),
    AVATAR_STAFF("Ảnh avatar nhân viên", "avatar_staff"),
    DOCTOR_LOGO("Ảnh logo doctor", "doctor_logo"),
    DOCTOR_CONTRACT("Hợp đồng doctor", "doctor_contract"),
    DOCTOR_SIGNATURE("Ảnh chữ ký doctor", "doctor_signature"),
    TEST_GUIDE("Hướng dẫn XN", "test_guide"),
    RESULT("Ảnh kết quả XN", "result_image"),
    PRINT("Ảnh in biểu mẫu (logo,..)","print"),
    AVATAR_USER("Ảnh avatar khách", "avatar_user"),
    RESULT_USER("File kết quả khách", "result_user"),
    APPOINTMENT_SAMPLE("Ảnh mẫu lịch hẹn", "appointment_sample"),
    RESULT_ATTACHMENT("File đính kèm kết quả", "result_attachment"),
    INSTRUMENT("Ảnh máy XN", "instrument"),
    FILE_NAMES("File đính kèm", "result_attachment"),
    ;

    private final String description;
    private final String path;

    OSSType(String description, String path) {
        this.description = description;
        this.path = path;
    }

    public String getDescription() {
        return description;
    }

    public String getPath() {
        return path;
    }
}
