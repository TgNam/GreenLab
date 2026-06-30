package vn.greenlab.model.enums;

public enum RelationShipType {
    CHILD("Con"), WIFE("Vợ"), HUSBAND("Chồng"),
    FATHER("Bố"), MOTHER("Mẹ"), OTHER("Khác");

    private final String description;

    RelationShipType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}