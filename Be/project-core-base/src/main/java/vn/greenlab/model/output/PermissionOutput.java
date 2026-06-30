package vn.greenlab.model.output;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionOutput {
    private Integer id;
    private String name;
    private String uri;
    private String method;
    private boolean skip;
    private boolean hidden;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private boolean parent;
}
