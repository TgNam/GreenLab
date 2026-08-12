package vn.greenlab.labtests.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.Panel;

import java.util.Optional;

@Repository
public interface PanelRepository extends JpaRepository<Panel, Integer> {

    Optional<Panel> findByCode(String code);

    @Query("SELECT p FROM Panel p WHERE " +
           "(:code IS NULL OR p.code LIKE %:code%) " +
           "AND (:name IS NULL OR p.name LIKE %:name%) " +
           "AND (:panelCategoryId IS NULL OR p.panelCategoryId = :panelCategoryId) " +
           "ORDER BY p.id DESC")
    Page<Panel> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("panelCategoryId") Integer panelCategoryId,
            Pageable pageable);

    @Query("SELECT p FROM Panel p WHERE p.panelCategoryId = :categoryId ORDER BY p.id DESC")
    Page<Panel> findByCategoryId(@Param("categoryId") Integer categoryId, Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);

    @Modifying
    @Query("UPDATE Panel p SET p.testCount = :count WHERE p.id = :panelId")
    void updateTestCount(@Param("panelId") Integer panelId, @Param("count") Integer count);
}
