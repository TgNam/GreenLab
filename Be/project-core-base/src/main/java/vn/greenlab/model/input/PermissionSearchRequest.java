package vn.greenlab.model.input;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionSearchRequest {
    private String name;
    private String uri;
    private String method;
    private Boolean skip;
    private Boolean hidden;
    private String type;
    private Integer page;
    private Integer size;
    private Boolean filterParent;
    private Integer adminId; // ID của administrator để filter permissions
    private String username; // Username của administrator để filter permissions
}
