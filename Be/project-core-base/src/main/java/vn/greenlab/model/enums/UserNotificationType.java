package vn.greenlab.model.enums;

public enum UserNotificationType {
    
    SYSTEM("Thông báo hệ thống"),
    TEST("Xét nghiệm"),
    ;

    private final String description;

    UserNotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
