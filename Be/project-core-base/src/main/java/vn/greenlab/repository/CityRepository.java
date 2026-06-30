package vn.greenlab.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.greenlab.model.City;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends BaseRepository<City, Integer> {
    Optional<City> findByName(String name);

    @Query(value = "SELECT * FROM city WHERE " +
           "(:id IS NULL OR id = :id) AND " +
           "(:name IS NULL OR name LIKE CONCAT('%', :name, '%')) AND " +
           "(:code IS NULL OR code LIKE CONCAT('%', :code, '%')) AND " +
           "(:region IS NULL OR region LIKE CONCAT('%', :region, '%')) AND " +
           "(:parent_id IS NULL OR " +
           "  (:parent_id = 1 AND parent_id > 0) OR " +
           "  (:parent_id = 0 AND parent_id <= 0)) " +
           "ORDER BY id ASC",
           countQuery = "SELECT COUNT(*) FROM city WHERE " +
           "(:id IS NULL OR id = :id) AND " +
           "(:name IS NULL OR name LIKE CONCAT('%', :name, '%')) AND " +
           "(:code IS NULL OR code LIKE CONCAT('%', :code, '%')) AND " +
           "(:region IS NULL OR region LIKE CONCAT('%', :region, '%')) AND " +
           "(:parent_id IS NULL OR " +
           "  (:parent_id = 1 AND parent_id > 0) OR " +
           "  (:parent_id = 0 AND parent_id <= 0))",
           nativeQuery = true)
    Page<City> filterCities(@Param("id") Integer id,
                             @Param("name") String name,
                             @Param("code") String code,
                             @Param("region") String region,
                             @Param("parent_id") Integer parentId,
                             Pageable pageable);

    @Query(value = "SELECT * FROM city WHERE id IN :ids", nativeQuery = true)
    List<City> findByIds(@Param("ids") List<Integer> ids);

    @Query("SELECT c FROM City c WHERE " +
           "(:searchText IS NULL OR :searchText = '' OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(c.code) LIKE LOWER(CONCAT('%', :searchText, '%'))) AND " +
           "(:parentId IS NULL OR " +
           "  (:parentId = 1 AND c.parent_id > 0) OR " +
           "  (:parentId = 0 AND c.parent_id <= 0)) " +
           "ORDER BY c.id ASC")
    Page<City> searchCitiesByText(@Param("searchText") String searchText,
                                   @Param("parentId") Integer parentId,
                                   Pageable pageable);

    /**
     * Tìm tất cả tỉnh/thành cũ thuộc một tỉnh/thành mới.
     * Các tỉnh có parent_id = cityId.
     */
    @Query(value = "SELECT * FROM city WHERE parent_id = :parentId ORDER BY id ASC", nativeQuery = true)
    List<City> findByParent_id(@Param("parentId") int parentId);

    /**
     * Tìm tỉnh/thành theo ID (dùng cho join lấy tên).
     */
    Optional<City> findById(int id);

    @Query(value = "SELECT * FROM city WHERE parent_id != 0", nativeQuery = true)
    List<City> findListCityOld();

    @Query(value = "SELECT * FROM city WHERE parent_id = 0", nativeQuery = true)
    List<City> findListCityNew();
}
