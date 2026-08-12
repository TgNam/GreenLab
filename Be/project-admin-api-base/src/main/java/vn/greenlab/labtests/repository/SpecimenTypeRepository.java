package vn.greenlab.labtests.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.labtests.entity.SpecimenType;

import java.util.Optional;

@Repository
public interface SpecimenTypeRepository extends JpaRepository<SpecimenType, Integer> {

    Optional<SpecimenType> findByCode(String code);

    @Query("SELECT st FROM SpecimenType st WHERE " +
           "(:code IS NULL OR st.code LIKE %:code%) " +
           "AND (:name IS NULL OR st.name LIKE %:name%) " +
           "AND (:isActive IS NULL OR st.isActive = :isActive) " +
           "ORDER BY st.id DESC")
    Page<SpecimenType> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Integer id);
}
