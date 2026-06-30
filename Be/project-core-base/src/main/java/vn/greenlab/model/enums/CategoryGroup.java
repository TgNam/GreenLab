package vn.greenlab.model.enums;

import java.util.Arrays;

public enum CategoryGroup {
    SHPT("Sinh học phân tử"),
    SLSS("Sàng lọc sơ sinh"),
    XNTQ("Thường quy");

    private final String value;

    CategoryGroup(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static boolean existsByValue(String input) {
        if (input == null) {
            return false;
        }
        return Arrays.stream(values())
                .anyMatch(e -> e.value.equalsIgnoreCase(input.trim()));
    }
}
