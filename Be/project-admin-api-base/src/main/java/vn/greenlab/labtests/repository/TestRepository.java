package vn.greenlab.labtests.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.Test;

import java.util.Optional;

@Repository
public interface TestRepository extends JpaRepository<Test, Integer> {

    Optional<Test> findByCode(String code);

    @Query("SELECT t FROM Test t WHERE " +
           "(:code IS NULL OR t.code LIKE %:code%) " +
           "AND (:name IS NULL OR t.name LIKE %:name%) " +
           "AND (:testCategoryId IS NULL OR t.testCategoryId = :testCategoryId) " +
           "AND (:specimenTypeId IS NULL OR t.specimenTypeId = :specimenTypeId) " +
           "AND (:unitId IS NULL OR t.unitId = :unitId) " +
           "AND (:isActive IS NULL OR t.isActive = :isActive) " +
           "ORDER BY t.id DESC")
    Page<Test> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("testCategoryId") Integer testCategoryId,
            @Param("specimenTypeId") Integer specimenTypeId,
            @Param("unitId") Integer unitId,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);
}
