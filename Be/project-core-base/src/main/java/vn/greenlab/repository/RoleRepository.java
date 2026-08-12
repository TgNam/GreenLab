package vn.greenlab.repository;

import java.util.List;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.greenlab.model.Role;

@Repository
public interface RoleRepository extends BaseRepository<Role, Integer> {
  @Query("SELECT DISTINCT r FROM Role r " +
          "LEFT JOIN r.administrators a " +
          "WHERE (:name IS NULL OR r.name LIKE CONCAT('%', :name, '%')) " +
          "AND (:description IS NULL OR r.description LIKE CONCAT('%', :description, '%')) " +
          "AND (:createTimeFrom IS NULL " +
          "     OR (:timeType = 0 AND r.create_time >= :createTimeFrom) " +
          "     OR (:timeType = 1 AND r.update_time >= :createTimeFrom)) " +
          "AND (:createTimeTo IS NULL " +
          "     OR (:timeType = 0 AND r.create_time <= :createTimeTo) " +
          "     OR (:timeType = 1 AND r.update_time <= :createTimeTo)) " +
          "AND (:isActive IS NULL OR r.active = :isActive) " +
          "AND (:adminId IS NULL OR a.id = :adminId)")
  Page<Role> searchRoles(
          @Param("name") String name,
          @Param("description") String description,
          @Param("createTimeFrom") LocalDateTime createTimeFrom,
          @Param("createTimeTo") LocalDateTime createTimeTo,
          @Param("isActive") Boolean isActive,
          @Param("timeType") Integer timeType,
          @Param("adminId") Integer adminId,
          Pageable pageable);

  @EntityGraph(attributePaths = { "permissions", "administrators" })
  @Query("SELECT r FROM Role r")
  Page<Role> findAllWithRelations(Pageable pageable);

  @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions WHERE r IN :roles AND r.active = true ORDER BY r.position")
  List<Role> findRolesWithPermissions(@Param("roles") List<Role> roles);

  List<Role> findByActive(boolean active);
}