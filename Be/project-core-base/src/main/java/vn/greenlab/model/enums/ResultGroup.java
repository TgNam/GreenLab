package vn.greenlab.model.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum ResultGroup {
    XN(0,"KQ XN chung"),
    SLSS(1,"Sàng lọc sơ sinh"),
    PRC(2,"Sinh học phân tử"),
    SLTT(3,"Sáng lọc trước sinh"),
    GENE(4,"Di truyền"),
    FILE(99,"KQ dạng file"),
    ;

    private final int result_group_id;
    private final String result_group_name;

    ResultGroup(int result_group_id, String result_group_name) {
        this.result_group_id = result_group_id;
        this.result_group_name = result_group_name;
    }

    public int getResult_group_id() {
        return result_group_id;
    }

    public String getResult_group_name() {
        return result_group_name;
    }

    public static Map<String, String> getResultGroupMap() {
        return Arrays.stream(ResultGroup.values())
                .collect(Collectors.toMap(
                        ResultGroup::name,          // XN, SLSS, PRC...
                        ResultGroup::getResult_group_name
                ));
    }

    public static Map<ResultGroup, String> getResultGroupMap2() {
        return Arrays.stream(ResultGroup.values())
                .collect(Collectors.toMap(
                        Function.identity(), // key = enum
                        ResultGroup::getResult_group_name // value = name
                ));
    }

    public static ResultGroup getResultGroupById(int result_group_id) {
        return Arrays.stream(ResultGroup.values())
                .filter(resultGroup -> resultGroup.getResult_group_id() == result_group_id)
                .findFirst()
                .orElse(null);
    }

}
