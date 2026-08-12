package vn.greenlab.model;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "work_area")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
// (Khu vực làm việc)
public class WorkArea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String short_name;
    private String name;
    private int status;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime create_time;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime update_time;
}