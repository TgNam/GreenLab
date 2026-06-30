package vn.greenlab.model.enums;

public enum CategoryApp {
    SH("Sinh hóa"),
    MD("Miễn dịch"),
    HH("Huyết học"),
    VS("Vi sinh"),
    OTHER("Khác"),
    MBP("Mẫu bệnh phẩm");

    private final String value;

    CategoryApp(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}