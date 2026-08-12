package vn.greenlab.labtests.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "test", indexes = {
    @Index(name = "idx_test_category", columnList = "test_category_id"),
    @Index(name = "idx_test_specimen", columnList = "specimen_type_id"),
    @Index(name = "idx_test_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(name = "short_name", length = 100)
    private String shortName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String method;

    @Column(name = "test_category_id", nullable = false)
    private Integer testCategoryId;

    @Column(name = "specimen_type_id", nullable = false)
    private Integer specimenTypeId;

    @Column(name = "unit_id", nullable = false)
    private Integer unitId;

    @Column(name = "normal_value_min", precision = 10, scale = 4)
    private BigDecimal normalValueMin;

    @Column(name = "normal_value_max", precision = 10, scale = 4)
    private BigDecimal normalValueMax;

    @Column(name = "normal_value_text", length = 200)
    private String normalValueText;

    @Column(nullable = false, precision = 12, scale = 0)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_category_id", insertable = false, updatable = false)
    private TestCategory testCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specimen_type_id", insertable = false, updatable = false)
    private SpecimenType specimenType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", insertable = false, updatable = false)
    private Unit unit;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
