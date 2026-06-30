package vn.greenlab.model;

import java.io.Serializable;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import vn.greenlab.model.enums.EmailOutboxType;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.GenerationType;

@Entity
@Table(name = "email_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class EmailTemplate implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    @Column(columnDefinition = "TEXT")
    private String content;
    private boolean active;
    @Enumerated(EnumType.STRING)
    private EmailOutboxType type;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime createTime;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime updateTime;
}
