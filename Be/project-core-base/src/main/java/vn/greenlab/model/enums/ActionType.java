package vn.greenlab.model.enums;

import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum ActionType {
    CREATE("Tạo"),
    UPDATE("Cập nhật"),
    DELETE("Xóa"),
    EXPORT("Xuất"),
    IMPORT("Nhập"),
    OTHER("Khác");

    private final String name;

    ActionType(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public static final Map<ActionType, String> getActionTypes =
            Collections.unmodifiableMap(
                    Stream.of(values())
                            .collect(Collectors.toMap(
                                    e -> e,
                                    e -> e.getName()
                            ))
            );

    public static final Map<String, ActionType> getActionTypes2 =
            Collections.unmodifiableMap(
                    Stream.of(values())
                            .collect(Collectors.toMap(
                                    e -> e.getName(),
                                    e -> e
                            ))
            );
}
