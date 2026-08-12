
package vn.greenlab.model;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import vn.greenlab.model.enums.SystemConfigKey;


@Entity
@Table(name = "system_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class SystemConfig implements Serializable {

    @Id
    @Column(name = "`key`", columnDefinition = "varchar(255) not null")
    @Enumerated(EnumType.STRING)
    private SystemConfigKey key;
    @Column(name = "`name`",nullable = false)
    private String name;
    @Column(name = "`value`", nullable = false, columnDefinition = "TEXT")
    private String value;
    private String note;
    private boolean active;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime create_time;
    private int created_by;
    @Column(columnDefinition = "datetime(3)")
    private LocalDateTime update_time;
    private int updated_by;
}