package vn.greenlab.model.enums;

import java.io.Serializable;

public enum SmsRecipientType implements Serializable {
    DOCTOR("Bác sĩ"),
    PATIENT("Bệnh nhân"),
    OTHER("Khác");

    private final String description;

    SmsRecipientType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
