package vn.greenlab.model.enums;

public enum ProcessSource {
    WEBSITE(1, "Đặt lịch qua Website"),
    CALL_CENTER(2, "Khách hàng gọi điện trực tiếp"),
    KD_BAO(3, "KD báo"),
    APP_LANDING_PAGE(4, "Từ App - LandingPage"),
    OTHER(5, "Khác"),;

    private final int process_source_id;
    private final String process_source_name;

    ProcessSource(int process_source_id, String process_source_name) {
        this.process_source_id = process_source_id;
        this.process_source_name = process_source_name;
    }

    public int getProcess_source_id() {
        return process_source_id;
    }

    public String getProcess_source_name() {
        return process_source_name;
    }
}