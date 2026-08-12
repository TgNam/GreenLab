package vn.greenlab.labtests.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.TestCategory;

import java.util.Optional;

@Repository
public interface TestCategoryRepository extends JpaRepository<TestCategory, Integer> {

    Optional<TestCategory> findByCode(String code);

    @Query("SELECT tc FROM TestCategory tc WHERE " +
           "(:code IS NULL OR tc.code LIKE %:code%) " +
           "AND (:name IS NULL OR tc.name LIKE %:name%) " +
           "AND (:isActive IS NULL OR tc.isActive = :isActive) " +
           "ORDER BY tc.id DESC")
    Page<TestCategory> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);
}
