package vn.greenlab.model.enums;

public enum ContractStatus {
    EXPIRED("Hết hạn"),
    EXPIRING_SOON("Sắp hết hạn"),
    VALID("Còn hạn"),
    NO_CONTRACT("Không có thông tin"); // Dành cho trường hợp null

    private final String description;

    ContractStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
