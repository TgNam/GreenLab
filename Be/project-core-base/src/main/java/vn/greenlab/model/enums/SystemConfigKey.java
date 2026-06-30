package vn.greenlab.model.enums;

import java.io.Serializable;

/**
 * @author PhuongDT
 */
public enum SystemConfigKey implements Serializable {
    ALIBABA_OSS("[Alibaba OSS] Thông tin cấu hình Alibaba Cloud upload hình ảnh"),
    VERSION_CONFIG("Danh sách cấu hình các phiên bản"),
    SYNC_DATA("Đồng bộ dữ liệu từ LIS"),
    SMS_CONFIG("Cấu hình SMS"),
    PRICE_POLICY_DEFAULT("Bảng giá chung mặc định"),
    EMAIL_CONFIG("Cấu hình email"),
    ELASTIC_EMAIL_CONFIG("Cấu hình Elastic Email"),
    MAIL_CHIMP_CONFIG("Cấu hình Mail Chimp"),
    APP_CUSTOMER_CONFIG("Cấu hình app customer"),
    APP_BIOMETRIC_CONFIG("Cấu hình biometric"),
    ;

    private String description;

    SystemConfigKey(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
