package vn.greenlab.model.enums;

public enum StaffNotificationEvent {
    STAFF_SAMPLE_APPOINTMENT("Thông báo về lịch hẹn"),
    STAFF_SAMPLE_RECEIVED("Thông báo về mẫu đã tiếp nhận"),
    ;

    private final String description;

    StaffNotificationEvent(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}