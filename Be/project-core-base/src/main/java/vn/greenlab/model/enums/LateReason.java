package vn.greenlab.model.enums;

public enum LateReason {
    TRUNG_DIACHI(1, "Trùng địa chỉ"),
    TAI_NAI_THIEN_TAI(2, "Tai nạn, thiên tai"),
    QUEN_LICH(3, "Quên lịch"),
    NHAN_SOT(4, "Nhận sót"),
    HONG_XE(5, "Hỏng xe"),
    TAC_DUONG(6, "Tắc đường"),
    KHAC(7, "Khác");

    private final int reason_id;
    private final String reason_name;

    LateReason(int reason_id, String reason_name) {
        this.reason_id = reason_id;
        this.reason_name = reason_name;
    }

    public int getReason_id() {
        return reason_id;
    }

    public String getReason_name() {
        return reason_name;
    }
}
