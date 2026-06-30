package vn.greenlab.model.output;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionTreeOutput {
    private Integer id;
    private String name;
    private String uri;
    private String method;
    private boolean skip;
    private boolean hidden;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Integer parent_id;

    private ParentPermissionInfo parent;
    private List<PermissionTreeOutput> children = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentPermissionInfo {
        private Integer id;
        private String name;
        private String uri;
        private String method;
        private boolean skip;
        private boolean hidden;
    }
}
