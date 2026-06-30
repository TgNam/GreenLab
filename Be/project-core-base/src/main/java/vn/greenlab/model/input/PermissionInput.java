package vn.greenlab.model.input;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionInput {
    private Integer id;
    private String name;
    private String uri;
    private String method;
    private Integer parent_id;
    private boolean skip;
    private boolean hidden;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private boolean parent;
}
