package vn.greenlab.model.enums;

import java.util.Arrays;

public enum CfgTestType {
    A ("Tinh dịch"),
    B ("Điện tim"),
    C ("Nôi soi"),
    D ("Dịch"),
    E ("Khám"),
    F ("Phân"),
    G ("Sữa"),
    H ("Thuốc"),
    I ("Hơi thở"),
    K ("Đờm"),
    N ("Nước Tiểu"),
    P ("Máu"),
    R ("Răng"),
    S ("Siêu âm"),
    T ("Tổ chức học"),
    X ("X quang")
    ;

    private final String value;

    CfgTestType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}