package vn.greenlab.model.enums;

import java.io.Serializable;

public enum LogAdminType implements Serializable {
     
    //Excel
    EXPORT_EXCEL("Xuất Excel"),

    //Lỗi
    EXCEPTION("Lỗi"),
    EXCEPTION_SCHEDULE("Lỗi tại Schedule");

    LogAdminType(String desc) {
        this.desc = desc;
    }

    private String desc;

    public String getDesc() {
        return desc;
    }
}
