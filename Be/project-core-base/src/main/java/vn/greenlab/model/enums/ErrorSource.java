package vn.greenlab.model.enums;

import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum ErrorSource {
    CLINIC(1, "Phòng khám"),
    DVKH_HA_NOI(2, "DVKH Hà Nội"),
    DVKH_TINH(3, "DVKH tỉnh"),
    CALL_CENTER(4, "CSKH"),
    PART_TIME_STAFF(5, "CTV PartTime"),
    LABORATORY(6, "TT XN"),
    OTHER(7, "Khác"),
    ACCOUNTING(8, "Kế toán"),
    SAMPLE_COLLECTION(9, "Do mẫu"),
    FULL_TIME_STAFF(10, "CTV FullTime"),
    ;

    private final int id;
    private final String displayName;

    ErrorSource(int id, String displayName) {
        this.id = id;
        this.displayName = displayName;
    }

    public int getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static ErrorSource fromId(int id) {
        for (ErrorSource e : values()) {
            if (e.getId() == id) {
                return e;
            }
        }
        return ErrorSource.OTHER; // fallback an toàn
    }

    public static ErrorSource fromDisplayName(String displayName) {
        if (displayName == null)
            return null;
        for (ErrorSource e : values()) {
            if (e.getDisplayName().equalsIgnoreCase(displayName.trim())) {
                return e;
            }
        }
        return ErrorSource.OTHER; // fallback an toàn
    }

    public static final Map<ErrorSource, String> getErrorSources = Collections.unmodifiableMap(
            Stream.of(values())
                    .collect(Collectors.toMap(
                            e -> e,
                            e -> e.getDisplayName()

                    )));

    public static final Map<String, String> getErrorSourcesMap = Collections.unmodifiableMap(
            Stream.of(values())
                    .collect(Collectors.toMap(
                            e -> e.toString(),
                            e -> e.getDisplayName()

                    )));

    public static final Map<String, ErrorSource> getErrorSources2 = Collections.unmodifiableMap(
            Stream.of(values())
                    .collect(Collectors.toMap(
                            e -> e.getDisplayName(),
                            e -> e

                    )));

    public static final Map<Integer, String> getErrorSources3 = Collections.unmodifiableMap(
            Stream.of(values())
                    .collect(Collectors.toMap(
                            ErrorSource::getId,
                            ErrorSource::getDisplayName
                    ))
    );

}
