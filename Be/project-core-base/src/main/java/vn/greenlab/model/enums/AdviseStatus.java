package vn.greenlab.model.enums;

import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum AdviseStatus {

    ADVISE_STATUS_1("Không nghe máy L1"),
    ADVISE_STATUS_2("Không nghe máy L2"),
    ADVISE_STATUS_3("Không nghe máy L3"),
    ADVISE_STATUS_4("Sai SĐT"),
    ADVISE_STATUS_5("Không liên lạc được"),
    ADVISE_STATUS_6("Bố báo lưu"),
    ADVISE_STATUS_7("Mẹ báo lưu"),
    ADVISE_STATUS_8("Không có số điện thoại"),
    ;

    private final String description;

    AdviseStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    // public static final Map<AdviseStatus, String> getAdviseStatus = Collections.unmodifiableMap(
    //         Stream.of(values())
    //                 .collect(Collectors.toMap(
    //                         e -> e,
    //                         e -> e.getDescription()

    //                 )));

    public static final Map<AdviseStatus, String> getAdviseStatus =
        Collections.unmodifiableMap(
                Stream.of(AdviseStatus.values())
                        .sorted(Comparator.comparing(AdviseStatus::name))
                        .collect(Collectors.toMap(
                                e -> e,                         // ✅ key: AdviseStatus
                                AdviseStatus::getDescription,   // ✅ value: String
                                (a, b) -> a,
                                LinkedHashMap::new
                        )));

    public static final Map<String, AdviseStatus> DESCRIPTION_TO_STATUS = Collections.unmodifiableMap(
            Stream.of(values())
                    .sorted(Comparator.comparing(AdviseStatus::name))
                    .collect(Collectors.toMap(
                            AdviseStatus::getDescription,
                            e -> e,
                            (a, b) -> a,
                            LinkedHashMap::new)));

    /** Helper method */
    public static AdviseStatus fromDescription(String description) {
        return DESCRIPTION_TO_STATUS.get(description);
    }
}
