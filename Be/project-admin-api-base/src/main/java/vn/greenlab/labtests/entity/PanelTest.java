package vn.greenlab.labtests.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "panel_test", indexes = {
    @Index(name = "idx_panel_test_panel", columnList = "panel_id"),
    @Index(name = "idx_panel_test_test", columnList = "test_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "unique_panel_test", columnNames = {"panel_id", "test_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PanelTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "panel_id", nullable = false)
    private Integer panelId;

    @Column(name = "test_id", nullable = false)
    private Integer testId;

    @Column(name = "is_primary")
    private Boolean isPrimary = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "panel_id", insertable = false, updatable = false)
    private Panel panel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", insertable = false, updatable = false)
    private Test test;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
