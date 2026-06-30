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
@Table(name = "department")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
//(Phòng ban)
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    
    @Column(name = "short_name", unique = true, nullable = false)
    private String short_name;
    
    private int status;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime create_time;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime update_time;
}
