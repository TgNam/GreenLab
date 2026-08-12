package vn.greenlab.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

import vn.greenlab.model.Administrator;
import vn.greenlab.model.Permission;
import vn.greenlab.model.Role;

public interface PermissionRepository extends BaseRepository<Permission, Integer> {
        List<Permission> findAll();

        @Query("SELECT p FROM Permission p WHERE p.uri = :uri AND p.method = :method")
        Optional<Permission> findPermissionByUriAndMethod(@Param("uri") String uri, @Param("method") String method);

        @Query("select distinct p from Administrator a join a.roles r join r.permissions p where a.id = :adminId AND r.active = true")
        List<Permission> findPermissionsByAdministratorId(@Param("adminId") Integer adminId);

        /**
         * Check 1 nhân viên có quyền truy cập 1 endpoint nào đó không.
         * 
         * @param adminId
         * @param uri
         * @param method
         * @return
         */
        @Query(value = """
                        SELECT 1
                        FROM permission pe
                        INNER JOIN role_permission p ON p.permission_id = pe.id
                        INNER JOIN role ro ON ro.id = p.role_id AND ro.active = TRUE
                        INNER JOIN administrator_role r ON r.role_id = ro.id AND r.administrator_id = :adminId
                        WHERE pe.uri = :uri AND pe.method = :method
                        LIMIT 1
                        """, nativeQuery = true)
        Integer findPermissionByUriAndMethodAndAdminId(@Param("adminId") Long adminId, @Param("uri") String uri,@Param("method") String method);
        
        @Query(value = """
                        select 1 from permission pe
                        where pe.skip = true
                        AND pe.uri = :uri
                        AND pe.method = :method
                        limit 1
                            """, nativeQuery = true)
        Integer checkPermissionSkipByUriAndMethod(@Param("uri") String uri, @Param("method") String method);

        @Query("select distinct p from Administrator a join a.roles r join r.permissions p where a.id = :adminId AND r.active = true AND p.parent_id = 0  AND ((:searchText IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchText, '%'))) OR (:searchText IS NULL OR LOWER(p.uri) LIKE LOWER(CONCAT('%', :searchText, '%'))))")
        List<Permission> findPermissionsByAdministratorIdAndSearchText(@Param("adminId") Integer adminId,
                        @Param("searchText") String searchText);

        @Query("""
                        SELECT p FROM Permission p
                        WHERE (:skip IS NULL OR p.skip = :skip)
                        AND (:filterParent IS NULL
                             OR (:filterParent = true AND p.parent_id = 0)
                             OR (:filterParent = false AND p.parent_id != 0))
                        AND (:hidden IS NULL OR p.hidden = :hidden)
                        AND (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))
                        AND (:uri IS NULL OR LOWER(p.uri) LIKE LOWER(CONCAT('%', :uri, '%')))
                        AND (:method IS NULL OR LOWER(p.method) LIKE LOWER(CONCAT('%', :method, '%')))
                        ORDER BY
                          CASE WHEN p.parent_id = 0 THEN p.id ELSE p.parent_id END DESC,
                          CASE WHEN p.parent_id = 0 THEN 0 ELSE 1 END,
                          p.id ASC
                        """)
        Page<Permission> findPagedChildrenFiltered(
                        @Param("name") String name,
                        @Param("uri") String uri,
                        @Param("method") String method,
                        @Param("skip") Boolean skip,
                        @Param("hidden") Boolean hidden,
                        @Param("filterParent") Boolean filterParent,
                        Pageable pageable);

        /**
         * Tìm permissions của một admin với các filter và phân trang
         * Query: Admin -> Roles (active) -> Permissions
         */
        @Query("SELECT DISTINCT p FROM Administrator a " +
                        "JOIN a.roles r " +
                        "JOIN r.permissions p " +
                        "WHERE a.id = :adminId " +
                        "AND r.active = true " +
                        "AND (:skip IS NULL OR p.skip = :skip) " +
                        "AND (:filterParent IS NULL OR (:filterParent = true AND p.parent_id = 0) OR (:filterParent = false AND p.parent_id != 0)) "
                        +
                        "AND (:hidden IS NULL OR p.hidden = :hidden) " +
                        "AND (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
                        "AND (:uri IS NULL OR LOWER(p.uri) LIKE LOWER(CONCAT('%', :uri, '%'))) " +
                        "AND (:method IS NULL OR LOWER(p.method) LIKE LOWER(CONCAT('%', :method, '%'))) " +
                        "ORDER BY p.parent_id ASC")
        Page<Permission> findPagedChildrenFilteredByAdminId(
                        @Param("adminId") Integer adminId,
                        @Param("name") String name,
                        @Param("uri") String uri,
                        @Param("method") String method,
                        @Param("skip") Boolean skip,
                        @Param("hidden") Boolean hidden,
                        @Param("filterParent") Boolean filterParent,
                        Pageable pageable);

        // lấy cha theo id
        @Query("SELECT p FROM Permission p WHERE p.id IN :ids")
        List<Permission> findParentsByIds(@Param("ids") List<Integer> ids);

        @Query("SELECT p FROM Permission p WHERE p.parent_id IN :parentIds AND (:skip IS NULL OR p.skip = :skip) AND (:hidden IS NULL OR p.hidden = :hidden)")
        List<Permission> findSiblingsByParentIds(
                        @Param("parentIds") List<Integer> parentIds,
                        @Param("skip") Boolean skip,
                        @Param("hidden") Boolean hidden);

        @Query("SELECT p FROM Permission p WHERE p.parent_id = 0")
        List<Permission> findPermissionParent();

        @Query("SELECT p FROM Permission p WHERE p.parent_id = :parentId")
        List<Permission> findByParentId(@Param("parentId") Integer parentId);

        @Query("SELECT DISTINCT a FROM Administrator a " +
                        "JOIN a.roles r " +
                        "JOIN r.permissions p " +
                        "WHERE r.active = true " +
                        "AND (:permissionId IS NULL OR p.id = :permissionId)")
        List<Administrator> findAdministratorsByPermission(
                        @Param("permissionId") Integer permissionId);

        @Query("SELECT DISTINCT r FROM Role r " +
                        "JOIN r.permissions p " +
                        "WHERE (:permissionId IS NULL OR p.id = :permissionId)")
        List<Role> findRolesByPermission(
                        @Param("permissionId") Integer permissionId);

        @Modifying
        @Query(value = "DELETE FROM role_permission WHERE permission_id = :permissionId", nativeQuery = true)
        void deletePermissionFromRoles(@Param("permissionId") Integer permissionId);
}