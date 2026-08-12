package vn.greenlab.labtests.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.PanelCategory;

import java.util.Optional;

@Repository
public interface PanelCategoryRepository extends JpaRepository<PanelCategory, Integer> {

    Optional<PanelCategory> findByCode(String code);

    Optional<PanelCategory> findBySlug(String slug);

    @Query("SELECT pc FROM PanelCategory pc WHERE " +
           "(:code IS NULL OR pc.code LIKE %:code%) " +
           "AND (:name IS NULL OR pc.name LIKE %:name%) " +
           "AND (:isActive IS NULL OR pc.isActive = :isActive) " +
           "AND (:isFeatured IS NULL OR pc.isFeatured = :isFeatured) " +
           "ORDER BY pc.displayOrder ASC, pc.id DESC")
    Page<PanelCategory> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("isActive") Boolean isActive,
            @Param("isFeatured") Boolean isFeatured,
            Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Integer id);
}
