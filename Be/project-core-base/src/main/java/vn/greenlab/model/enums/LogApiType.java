package vn.greenlab.model.enums;

public enum LogApiType {
    ELASTIC_EMAIL_SEND_MAIL("[ElasticEmail] Gửi email"),
    ELASTIC_EMAIL_GET_STATUS("[ElasticEmail] Lấy trạng thái email"),
    MAILCHIMP_SEND_MAIL("[Mailchimp] Gửi email"),
    MAILCHIMP_GET_STATUS("[Mailchimp] Lấy trạng thái email"),
    VIETTEL_POST_LOCATION_API("[ViettelPost] API lấy địa chỉ"),
    ;

    LogApiType(String name) {
        this.name = name;
    }

    private String name;

    public String getName() {
        return name;
    }
}
