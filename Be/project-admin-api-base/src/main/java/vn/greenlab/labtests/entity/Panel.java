package vn.greenlab.labtests.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "panel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Panel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "panel_category_id", nullable = false)
    private Integer panelCategoryId;

    @Column(name = "discount_type_id")
    private Integer discountTypeId;

    @Column(name = "test_count")
    private Integer testCount = 0;

    @Column(name = "original_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal originalPrice = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 12, scale = 0)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "discount_value", precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "panel_category_id", insertable = false, updatable = false)
    private PanelCategory panelCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_type_id", insertable = false, updatable = false)
    private DiscountType discountType;

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
