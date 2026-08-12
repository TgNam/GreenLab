package vn.greenlab.model.enums;

public enum UserNotificationEvent {
    //TEST
    TEST_RESULT("Kết quả xét nghiệm"),
    ;

    private final String description;

    UserNotificationEvent(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
