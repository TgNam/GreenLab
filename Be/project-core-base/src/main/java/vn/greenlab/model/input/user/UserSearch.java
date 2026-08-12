package vn.greenlab.model.input.user;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UserSearch {
    private String email;
    private String fullName;
    private String phone;
    private Boolean isActive;
    private Integer type;
    private Integer regSource;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private String keyword;
    private int page = 0;
    private int size = 20;
    private String sortBy = "createTime";
    private String sortDir = "desc";
}
