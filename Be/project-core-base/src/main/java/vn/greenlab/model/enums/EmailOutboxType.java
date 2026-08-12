package vn.greenlab.model.enums;

public enum EmailOutboxType {
    VERIFY("Xác thực tài khoản"),
    STAFF_RESETPASSWORD("[TK Nhân viên] Lấy lại mật khẩu"),
    USER_RESETPASSWORD("[TK Khách hàng] Lấy lại mật khẩu"),
    ALERT("Thông báo hệ thống"),
    NOTIFY_USER("Thông báo người dùng"),
    USER_WARNING_LOGIN("Cảnh báo đăng nhập"),
    USER_NEW_PASSWORD("[TK Khách hàng] Thay đổi mật khẩu"),
    ADMIN_NEW_PASSWORD("[TK Nhân viên] Mật khẩu mới"),
    SECURITY_WARNING("Cảnh báo bảo mật"),
    RESULT_TEST("Thông báo kết quả xét nghiệm"),
    APPOINTMENT("Thông báo lịch hẹn"),
    DOCTOR_LOGIN_OTP("Mã OTP đăng nhập bác sĩ"),
    ;

    private String description;

    EmailOutboxType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
