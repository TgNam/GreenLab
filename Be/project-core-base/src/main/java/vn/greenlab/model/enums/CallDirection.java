package vn.greenlab.model.enums;

public enum CallDirection {
    LOCAL(2, "LOCAL"),
    IN(1, "IN"),
    OUT(0, "OUT");

    private final int id;
    private final String name;

    CallDirection(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
