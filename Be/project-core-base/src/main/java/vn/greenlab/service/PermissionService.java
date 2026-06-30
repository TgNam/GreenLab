package vn.greenlab.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import vn.greenlab.exception.BadRequestException;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.Permission;
import vn.greenlab.model.Role;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.input.PermissionInput;
import vn.greenlab.model.input.PermissionSearchRequest;
import vn.greenlab.model.output.PermissionTreeOutput;
import vn.greenlab.model.output.RoleOutput;
import vn.greenlab.model.output.administrator.AdministratorOutput;
import vn.greenlab.repository.AdministratorRepository;
import vn.greenlab.repository.PermissionRepository;
import vn.greenlab.repository.RoleRepository;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
public class PermissionService {
    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private AdministratorRepository administratorRepository;

    @Autowired
    private AdministratorService administratorService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private RoleRepository roleRepository;

    // Get all permissions
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    public Map<String, Object> searchPermission(
            PermissionSearchRequest filter) { // hoặc create_time hoặc name
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize());

        String name = normalize(filter.getName());
        String uri = normalize(filter.getUri());
        String method = normalize(filter.getMethod());
        Boolean skip = filter.getSkip();
        Boolean hidden = filter.getHidden();

        // Xử lý adminId hoặc username
        Integer adminId = filter.getAdminId();
        if (adminId == null && filter.getUsername() != null && !filter.getUsername().isBlank()) {
            // Nếu có username, tìm adminId
            Optional<Administrator> adminOpt = administratorRepository.findByUsernameOrEmail(filter.getUsername());
            if (adminOpt.isPresent()) {
                adminId = adminOpt.get().getId();
            } else {
                // Nếu không tìm thấy admin, trả về empty result
                Page<PermissionTreeOutput> emptyRes = new PageImpl<>(Collections.emptyList(), pageable, 0);
                Map<String, Object> emptyMap = new HashMap<>();
                emptyMap.put("result", emptyRes);
                emptyMap.put("total", 0L);
                return emptyMap;
            }
        }

        // 1️⃣ Phân trang theo con - sử dụng query khác nhau tùy theo có adminId hay
        // không
        Page<Permission> pagedChildren;
        if (adminId != null) {
            // Tìm permissions của admin cụ thể
            pagedChildren = permissionRepository.findPagedChildrenFilteredByAdminId(
                    adminId, name, uri, method, skip, hidden, filter.getFilterParent(), pageable);
        } else {
            // Tìm tất cả permissions (như cũ)
            pagedChildren = permissionRepository.findPagedChildrenFiltered(name, uri, method, skip, hidden,
                    filter.getFilterParent(), pageable);
        }
        List<Permission> children = new ArrayList<>(pagedChildren.getContent());
        Map<String, Object> map = new HashMap<>();

        if (children.isEmpty()) {
            Page<PermissionTreeOutput> res = new PageImpl<>(Collections.emptyList(), pageable,
                    pagedChildren.getTotalElements());
            map.put("result", res);
            map.put("total", pagedChildren.getTotalElements());
            return map;
        }
        if (filter.getFilterParent() == null || filter.getFilterParent()) {
            // 2️⃣ Lấy id cha tương ứng

            List<Integer> parentIds = children.stream()
                    .map(p -> p.getParent_id() == 0 ? p.getId() : p.getParent_id())
                    .distinct()
                    .toList();
            // List<Permission> parents = permissionRepository.findParentsByIds(parentIds);
            Map<Integer, Permission> parentMap = permissionRepository
                    .findParentsByIds(parentIds)
                    .stream()
                    .collect(Collectors.toMap(Permission::getId, Function.identity()));
            Map<Integer, List<Permission>> childrenMap = children.stream()
                    .collect(Collectors.groupingBy(p -> p.getParent_id() == 0 ? p.getId() : p.getParent_id(),
                            LinkedHashMap::new, Collectors.toList()));

            // 4️⃣ Build tree (cha chứa các con)
            List<PermissionTreeOutput> result = childrenMap.entrySet().stream()
                    .map(entry -> {
                        Integer parentId = entry.getKey();
                        Permission parent = parentMap.get(parentId);

                        PermissionTreeOutput dto = mapToResponse(parent, null);
                        if (dto != null) {
                            List<PermissionTreeOutput> childDtos = entry.getValue()
                                    .stream()
                                    .map(child -> mapToResponse(child,
                                            new PermissionTreeOutput.ParentPermissionInfo(
                                                    parent.getId(), parent.getName(), parent.getUri(),
                                                    parent.getMethod(),
                                                    parent.isSkip(), parent.isHidden())))
                                    .toList();

                            dto.setChildren(childDtos);
                        }
                        return dto;
                    })
                    .toList();
            Page<PermissionTreeOutput> res = new PageImpl<>(result, pageable, pagedChildren.getTotalElements());
            map.put("result", res);
            map.put("total", pagedChildren.getTotalElements());
        } else {
            List<PermissionTreeOutput> childDtos = children
                    .stream()
                    .map(child -> mapToResponse(child,
                            new PermissionTreeOutput.ParentPermissionInfo(
                                    child.getId(), child.getName(), child.getUri(), child.getMethod(),
                                    child.isSkip(), child.isHidden())))
                    .toList();
            Page<PermissionTreeOutput> res = new PageImpl<>(childDtos, pageable, pagedChildren.getTotalElements());
            map.put("result", res);
            map.put("total", pagedChildren.getTotalElements());
        }
        return map;
    }

    public List<PermissionTreeOutput> getAllPermission() {

        List<Permission> childrens = permissionRepository.findAll();

        if (childrens.isEmpty()) {
            return new ArrayList<>();
        }
        // 2️⃣ Lấy id cha tương ứng
        List<Integer> parentIds = childrens.stream()
                .map(p -> p.getParent_id() == 0 ? p.getId() : p.getParent_id())
                .distinct()
                .toList();
        List<Permission> parents = permissionRepository.findParentsByIds(parentIds);

        Map<Integer, List<Permission>> childrenMap = childrens.stream()
                .collect(Collectors.groupingBy(p -> p.getParent_id() == 0 ? p.getId() : p.getParent_id(),
                        LinkedHashMap::new, Collectors.toList()));

        return parents.stream()
                .map(parent -> {
                    PermissionTreeOutput dto = mapToResponse(parent, null);
                    if (dto != null) {
                        List<PermissionTreeOutput> childDtos = childrenMap
                                .getOrDefault(parent.getId(), Collections.emptyList())
                                .stream()
                                .map(child -> mapToResponse(child,
                                        new PermissionTreeOutput.ParentPermissionInfo(
                                                parent.getId(), parent.getName(), parent.getUri(), parent.getMethod(),
                                                parent.isSkip(), parent.isHidden())))
                                .toList();

                        dto.setChildren(childDtos);
                    }
                    return dto;
                })
                .toList();

    }

    public List<PermissionTreeOutput> findPermissionForAdminByText(Integer adminId, String searchText) {
        if (adminId == null) {
            throw new BadRequestException(ErrorCode.ADMIN_NOT_FOUND);
        }
        List<Permission> permissions = permissionRepository
                .findPermissionsByAdministratorIdAndSearchText(adminId, searchText);
        return permissions.stream().map(p -> mapToResponse(p, null)).toList();
    }

    public List<AdministratorOutput> findAdministratorsByPermission(Integer permissionId) {
        List<Administrator> administrators = permissionRepository.findAdministratorsByPermission(permissionId);
        return administrators.stream().map(a -> administratorService.convertToOutput(a)).toList();
    }

    public List<RoleOutput> findRolesByPermission(Integer permissionId) {
        List<Role> roles = permissionRepository.findRolesByPermission(permissionId);
        return roles.stream().map(r -> roleService.convertToOutput(r)).toList();
    }

    @Transactional
    public void addPermissionToRole(Integer permissionId, Integer roleId) {
        Optional<Permission> permissionOpt = permissionRepository.findById(permissionId);
        if (permissionOpt.isPresent()) {
            Permission permission = permissionOpt.get();
            Optional<Role> roleOpt = roleRepository.findById(roleId);
            if (roleOpt.isPresent()) {
                Role role = roleOpt.get();
                if (!role.getPermissions().contains(permission)) {
                    role.getPermissions().add(permission);
                    role.setUpdate_time(LocalDateTime.now());
                    roleRepository.save(role);

                    // Update all administrators that have this role
                    List<Administrator> administrators = administratorRepository.findByRoleId(roleId);
                    for (Administrator admin : administrators) {
                        admin.setUpdate_time(LocalDateTime.now());
                        administratorRepository.save(admin);
                    }
                }
            }
        }
    }

    @Transactional
    public void removePermissionFromRole(Integer permissionId, Integer roleId) {
        Optional<Permission> permissionOpt = permissionRepository.findById(permissionId);
        if (permissionOpt.isPresent()) {
            Permission permission = permissionOpt.get();
            Optional<Role> roleOpt = roleRepository.findById(roleId);
            if (roleOpt.isPresent()) {
                Role role = roleOpt.get();
                if (role.getPermissions().contains(permission)) {
                    role.getPermissions().remove(permission);
                    role.setUpdate_time(LocalDateTime.now());
                    roleRepository.save(role);

                    // Update all administrators that have this role
                    List<Administrator> administrators = administratorRepository.findByRoleId(roleId);
                    for (Administrator admin : administrators) {
                        admin.setUpdate_time(LocalDateTime.now());
                        administratorRepository.save(admin);
                    }
                }
            }
        }
    }

    private PermissionTreeOutput mapToResponse(Permission entity, PermissionTreeOutput.ParentPermissionInfo parent) {
        if(entity == null) {
            return null;
        }
        PermissionTreeOutput dto = new PermissionTreeOutput();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setUri(entity.getUri());
        dto.setMethod(entity.getMethod());
        dto.setSkip(entity.isSkip());
        dto.setHidden(entity.isHidden());
        dto.setCreateTime(entity.getCreate_time());
        dto.setUpdateTime(entity.getUpdate_time());
        dto.setParent_id(entity.getParent_id());
        dto.setParent(parent);
        return dto;
    }

    private String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s.trim().toLowerCase();
    }

    // Get permission by ID
    public Optional<Permission> getPermissionById(Integer id) {
        return permissionRepository.findById(id);
    }

    // insert permission
    public Permission insertPermission(Permission permission) {
        return permissionRepository.save(permission);
    }

    // Create permission
    public Permission createPermission(Permission permission) {
        permission.setId(0); // Ensure it's a new entity
        return permissionRepository.save(permission);
    }

    // Update permission
    public Permission updatePermission(Permission permission) {
        return permissionRepository.save(permission);
    }

    // Delete permission
    @Transactional
    public void deletePermission(Integer id) {
        Optional<Permission> permissionOpt = permissionRepository.findById(id);
        if (permissionOpt.isPresent()) {
            permissionRepository.deletePermissionFromRoles(permissionOpt.get().getId());

            // Xóa permission
            if (permissionOpt.get().getParent_id() == 0) {
                List<Permission> children = permissionRepository.findByParentId(permissionOpt.get().getId());
                for (Permission child : children) {
                    permissionRepository.deletePermissionFromRoles(child.getId());
                    permissionRepository.deleteById(child.getId());
                }
            }
            permissionRepository.deleteById(permissionOpt.get().getId());
        }
    }

    // Get permissions by administrator id
    public List<Permission> getPermissionsForAdministrator(Integer adminId) {
        return permissionRepository.findPermissionsByAdministratorId(adminId);
    }

    public void mapPermission(List<PermissionInput> permissionInputs, List<Permission> unmappedPermissions) {
        List<PermissionInput> parentPermission = permissionInputs.stream()
                .filter(p -> p.isParent())
                .collect(Collectors.toList());
        if (parentPermission != null && !parentPermission.isEmpty()) {
            PermissionInput permissionInput = parentPermission.get(0);
            Permission permissionParent = new Permission();
            if (permissionInput.getId() != 0) {
                permissionParent = permissionRepository.findById(permissionInput.getId())
                        .orElseGet(Permission::new);
            } else {
                permissionParent = new Permission();
            }
            permissionParent.setCreate_time(LocalDateTime.now());
            permissionParent.setHidden(permissionInput.isHidden());
            permissionParent.setMethod(permissionInput.getMethod());
            permissionParent.setName(permissionInput.getName());
            permissionParent.setParent_id(0);
            permissionParent.setSkip(permissionInput.isSkip());
            permissionParent.setUri(permissionInput.getUri());
            permissionParent = permissionRepository.save(permissionParent);

            permissionInputs.remove(permissionInput);
            List<Permission> listAdd = new ArrayList<>();
            for (int i = 0; i < permissionInputs.size(); i++) {
                Permission permission = new Permission();
                if (permissionInputs.get(i).getId() != 0) {
                    permission = permissionRepository.findById(permissionInputs.get(i).getId())
                            .orElseGet(Permission::new);
                } else {
                    permission = new Permission();
                }
                permission.setCreate_time(LocalDateTime.now());
                permission.setHidden(permissionInputs.get(i).isHidden());
                permission.setMethod(permissionInputs.get(i).getMethod());
                permission.setName(permissionInputs.get(i).getName());
                permission.setParent_id(permissionParent.getId());
                permission.setSkip(permissionInputs.get(i).isSkip());
                permission.setUri(permissionInputs.get(i).getUri());
                listAdd.add(permission);
            }
            permissionRepository.saveAll(listAdd);
            unmappedPermissions.removeIf(u -> u.getMethod().trim().equals(permissionInput.getMethod())
                    && u.getUri().trim().equals(permissionInput.getUri()));
            unmappedPermissions.removeIf(unmapped -> listAdd.stream()
                    .anyMatch(added -> Objects.equals(unmapped.getMethod().trim(), added.getMethod().trim()) &&
                            Objects.equals(unmapped.getUri().trim(), added.getUri().trim())));
        }
    }

}
