package vn.greenlab.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Index;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "permission",
    indexes = {
        @Index(columnList = "uri, method", name = "idx_permission_uri_method"),
        @Index(columnList = "parent_id", name = "parent_id_idx"),
        @Index(columnList = "skip", name = "skip_idx"),
        @Index(columnList = "hidden", name = "hidden_idx"),
    })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String name;
    private String uri;
    private String method;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime create_time;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime update_time;
    private int parent_id;
    private boolean skip;
    private boolean hidden;
}