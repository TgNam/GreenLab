package vn.greenlab.model.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SlssConfig {

    G6PD  ("987SLSS0301", "G6PD",  1),
    CH    ("987SLSS0302", "CH",    2),
    CAH   ("987SLSS0303", "CAH",   3),
    PKU   ("987SLSS0304", "PKU",   4),
    GALT  ("987SLSS0305", "GALT",  5);

    private final String test_code;    // Mã xét nghiệm
    private final String test_code_s;  // Mã xét nghiệm S
    private final int order_number;    // Số thứ tự sắp xếp

    /** Tra cứu theo test_code (vd: "987SLSS0301"). */
    public static SlssConfig fromTestCode(String testCode) {
        for (SlssConfig e : values()) {
            if (e.test_code.equals(testCode)) return e;
        }
        throw new IllegalArgumentException("Unknown test_code: " + testCode);
    }

    /** Tra cứu theo test_code_s (vd: "G6PD"). */
    public static SlssConfig fromTestCodeS(String testCodeS) {
        for (SlssConfig e : values()) {
            if (e.test_code_s.equals(testCodeS)) return e;
        }
        throw new IllegalArgumentException("Unknown test_code_s: " + testCodeS);
    }
}
