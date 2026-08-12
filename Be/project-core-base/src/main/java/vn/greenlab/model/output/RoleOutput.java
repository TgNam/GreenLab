package vn.greenlab.model.output;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RoleOutput {
    private long id;
    private String name;
    private String description;
    private String icon;
    private int position;
    private boolean active;
    private LocalDateTime create_time;
    private LocalDateTime update_time;
    private List<PermissionOutput> permissions;
    private Boolean hasRole;
}
