package vn.greenlab.model.output;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RoleDetailOutput {
    private long id;
    private String name;
    private String description;
    private int position;
    private boolean active;
    private LocalDateTime create_time;
    private LocalDateTime update_time;
    private Map<String, String> permissions;
    private Map<String, String> employees;
}
