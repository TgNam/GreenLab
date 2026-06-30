package vn.greenlab.model.enums;

public enum SmsOutboxType {
    RESULT_TEST("Thông báo kết quả xét nghiệm"),
    APPOINTMENT("Thông báo lịch hẹn"),
    REMINDER("Nhắc nhở"),
    OTP_VERIFY("Mã OTP xác thực"),
    NOTIFY("Thông báo chung"),
    ALERT("Cảnh báo hệ thống"),
    SEND_RESULT_DOCTOR("Gửi kết quả cho bác sĩ"),
    SEND_RESULT_PATIENT("Gửi kết quả cho bệnh nhân"),
    ;

    private String description;

    SmsOutboxType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
