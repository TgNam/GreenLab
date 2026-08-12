package vn.greenlab.model.enums;

public enum BillType {
    PT(1, "Phiếu thu"),
    PC(2, "Phiếu chi"),
    NDK(3, "Nhập công nợ đầu kỳ");

    private final int bill_type_id;
    private final String bill_type_name;

    BillType(int bill_type_id, String bill_type_name) {
        this.bill_type_id = bill_type_id;
        this.bill_type_name = bill_type_name;
    }

    public int getBill_type_id() {
        return bill_type_id;
    }

    public String getBill_type_name() {
        return bill_type_name;
    }

}
