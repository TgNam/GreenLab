package vn.greenlab.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum SendOutCause {
    // 1	PXN không thực hiện xét nghiệm này
    // 2	Hết hóa chất/sinh phẩm
    // 3	Máy hỏng
    // 4	Khác
    S1(1, "PXN không thực hiện xét nghiệm này"),
    S2(2, "Hết hóa chất/sinh phẩm"),
    S3(3, "Máy hỏng"),
    S4(4, "Khác")
    ;
    private final int send_out_cause_id;
    private final String send_out_cause_name;

    SendOutCause(int send_out_cause_id, String send_out_cause_name) {
        this.send_out_cause_id = send_out_cause_id;
        this.send_out_cause_name = send_out_cause_name;
    }

    public int getSend_out_cause_id() {
        return send_out_cause_id;
    }

    public String getSend_out_cause_name() {
        return send_out_cause_name;
    }

    @JsonCreator
    public static SendOutCause fromId(int id) {
        for (SendOutCause v : values()) {
            if (v.send_out_cause_id == id) return v;
        }
        throw new IllegalArgumentException("Unknown SendOutCause id: " + id);
    }
}
