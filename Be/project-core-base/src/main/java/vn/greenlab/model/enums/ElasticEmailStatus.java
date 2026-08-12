package vn.greenlab.model.enums;

public enum ElasticEmailStatus {
    READY_TO_SEND("Email đang được xếp vào hàng chờ gửi"),
    WAITING_TO_RETRY("Chưa gửi được email đang gửi lại"),
    SENDING("Đang gửi"),
    ERROR("Lỗi email"),
    SENT("Gửi email thành công"),
    OPENED("Email đã mở"),
    CLICKED("Người nhận đã nhấp vào link"),
    UNSUBSCRIBED("Người nhận đã hủy đăng ký"),
    ABUSEREPORT("Email bị người nhận tố cáo hoặc đánh dấu spam"),
    UNKNOWN("Không hiểu trạng thái này");

    private String description;

    ElasticEmailStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
