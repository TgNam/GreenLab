package vn.greenlab.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.Permission;
import vn.greenlab.model.Role;
import vn.greenlab.model.output.PermissionOutput;
import vn.greenlab.model.output.RoleDetailOutput;
import vn.greenlab.model.output.RoleOutput;
import vn.greenlab.model.output.administrator.AdministratorOutput;
import vn.greenlab.repository.AdministratorRepository;
import vn.greenlab.repository.PermissionRepository;
import vn.greenlab.repository.RoleRepository;

@Service
public class RoleService {

    private final AdministratorService administratorService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private AdministratorRepository administratorRepository;

    RoleService(AdministratorService administratorService) {
        this.administratorService = administratorService;
    }

    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    public Page<RoleOutput> search(Pageable pageable, LocalDateTime createTimeFrom, LocalDateTime createTimeTo,
                                   String name, String description, Boolean isActive, Integer timeType, Integer adminId) {
        if (createTimeTo != null) {
            createTimeTo = createTimeTo.plusDays(1);
        }
        Page<Role> adPage = roleRepository.searchRoles(name, description, createTimeFrom,
                createTimeTo, isActive, timeType, adminId,
                pageable);

        // Nếu có adminId, cần set hasRole = true cho tất cả role (vì đã filter chỉ role mà admin có)
        if (adminId != null) {
            return adPage.map(role -> {
                RoleOutput output = convertToOutput(role);
                output.setHasRole(true); // Tất cả role trong kết quả đều là role mà admin có
                return output;
            });
        }

        return adPage.map(this::convertToOutput);
    }

    public Optional<Role> findById(Integer id) {
        return roleRepository.findById(id);
    }

    public Role create(Role role) {
        try {
            role.setId(0);
            role.setCreate_time(LocalDateTime.now());
            role.setUpdate_time(LocalDateTime.now());
            return roleRepository.save(role);
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
    }

    public Role update(Role role) {
        return roleRepository.save(role);
    }

    public void delete(Integer id) {
        roleRepository.deleteById(id);
    }

    public List<Permission> getPermissionsOfRole(Integer roleId) {
        return findById(roleId).map(Role::getPermissions).orElse(List.of());
    }

    public Optional<Role> setPermissions(Integer roleId, List<Integer> permissionIds) {
        Optional<Role> roleOpt = roleRepository.findById(roleId);
        if (roleOpt.isEmpty())
            return Optional.empty();
        Role role = roleOpt.get();
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        role.setPermissions(permissions);
        role.setUpdate_time(LocalDateTime.now());
        return Optional.of(roleRepository.save(role));
    }

    public List<RoleOutput> findRoleList() {
        return roleRepository.findByActive(true).stream().map(this::convertToOutput).toList();
    }

    public List<RoleDetailOutput> findRoleDetailList() {
        return roleRepository.findByActive(true).stream().map(this::convertToRoleDetailOutput).toList();
    }

    public RoleOutput convertToOutput(Role role) {
        RoleOutput roleOutput = new RoleOutput();
        roleOutput.setActive(role.isActive());
        roleOutput.setCreate_time(role.getCreate_time());
        roleOutput.setDescription(role.getDescription());
        roleOutput.setId(role.getId());
        roleOutput.setIcon(role.getIcon());
        roleOutput.setName(role.getName());
        roleOutput.setPosition(role.getPosition());
        roleOutput.setUpdate_time(role.getUpdate_time());
        return roleOutput;
    }

    public RoleOutput convertToOutput2(Role role) {
        RoleOutput roleOutput = new RoleOutput();
        roleOutput.setActive(role.isActive());
        roleOutput.setCreate_time(role.getCreate_time());
        roleOutput.setDescription(role.getDescription());
        roleOutput.setId(role.getId());
        roleOutput.setName(role.getName());
        roleOutput.setIcon(role.getIcon());
        roleOutput.setPosition(role.getPosition());
        roleOutput.setUpdate_time(role.getUpdate_time());
        roleOutput.setPermissions(role.getPermissions().stream().filter(f -> f.getParent_id() == 0)
                .map(this::convertToPermissionOutput).toList());
        return roleOutput;
    }

    private PermissionOutput convertToPermissionOutput(Permission permission) {
        PermissionOutput permissionOutput = new PermissionOutput();
        permissionOutput.setCreateTime(permission.getCreate_time());
        permissionOutput.setHidden(permission.isHidden());
        permissionOutput.setId(permission.getId());
        permissionOutput.setMethod(permission.getMethod());
        permissionOutput.setName(permission.getName());
        permissionOutput.setSkip(permission.isSkip());
        permissionOutput.setUpdateTime(permission.getUpdate_time());
        permissionOutput.setUri(permission.getUri());
        return permissionOutput;
    }

    public RoleDetailOutput convertToRoleDetailOutput(Role role) {
        RoleDetailOutput roleDetailOutput = new RoleDetailOutput();

        roleDetailOutput.setActive(role.isActive());
        roleDetailOutput.setCreate_time(role.getCreate_time());
        roleDetailOutput.setDescription(role.getDescription());
        roleDetailOutput.setId(role.getId());
        roleDetailOutput.setName(role.getName());
        roleDetailOutput.setPosition(role.getPosition());
        roleDetailOutput.setUpdate_time(role.getUpdate_time());

        // ✅ Đã có permissions nhờ EntityGraph
        Map<String, String> permissionOutput = new LinkedHashMap<>();
        for (Permission p : role.getPermissions()) {
            permissionOutput.put(p.getName(), p.getMethod() + " - " + p.getUri());
        }
        roleDetailOutput.setPermissions(permissionOutput);

        // ✅ Đã có administrators nhờ EntityGraph
        Map<String, String> employeeOutput = new LinkedHashMap<>();
        for (Administrator admin : role.getAdministrators()) {
            employeeOutput.put(admin.getUser_name(), admin.getEmail());
        }
        roleDetailOutput.setEmployees(employeeOutput);

        return roleDetailOutput;
    }

    @Transactional
    public List<AdministratorOutput> getAdminInRole(Integer id) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isPresent()) {
            Role role = roleOpt.get();
            List<Administrator> administrators = role.getAdministrators();
            return administrators.stream().map(administratorService::convertToOutput).toList();
        }
        return new ArrayList<>();
    }

    public void addAdmin(Integer id, Integer adminId) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isPresent()) {
            Role role = roleOpt.get();
            Optional<Administrator> adminOpt = administratorService.findById(adminId);
            if (adminOpt.isPresent()) {
                Administrator admin = adminOpt.get();
                if (!role.getAdministrators().contains(admin)) {
                    role.getAdministrators().add(admin);
                    admin.getRoles().add(role);
                }
                role.setUpdate_time(LocalDateTime.now());
                roleRepository.save(role);
                administratorRepository.save(admin);
            }
        }
    }

    public void removeAdmin(Integer id, Integer adminId) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isPresent()) {
            Role role = roleOpt.get();
            Optional<Administrator> adminOpt = administratorService.findById(adminId);
            if (adminOpt.isPresent()) {
                Administrator admin = adminOpt.get();
                if (role.getAdministrators().contains(admin)) {
                    role.getAdministrators().remove(admin);
                    admin.getRoles().remove(role);
                }
                role.setUpdate_time(LocalDateTime.now());
                roleRepository.save(role);
                administratorRepository.save(admin);
            }
        }
    }

    public RoleOutput cloneRole(Integer id) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isPresent()) {
            Role role = roleOpt.get();
            Role cloneRole = new Role();
            cloneRole.setName(role.getName().trim() + "_CLONE");
            cloneRole.setCreate_time(LocalDateTime.now());
            cloneRole.setUpdate_time(LocalDateTime.now());
            cloneRole.setActive(false);
            cloneRole.setDescription(role.getDescription());
            cloneRole.setPermissions(new ArrayList<>(role.getPermissions()));
            cloneRole.setPosition(role.getPosition());

            // clone administrators
            List<Administrator> clonedAdmins = new ArrayList<>();
            for (Administrator admin : role.getAdministrators()) {
                clonedAdmins.add(admin);
                // cập nhật phía admin
                if (admin.getRoles() == null) {
                    admin.setRoles(new ArrayList<>());
                }
                admin.getRoles().add(cloneRole);
            }
            cloneRole.setAdministrators(clonedAdmins);

            cloneRole = roleRepository.save(cloneRole);
            return convertToOutput(cloneRole);

        }
        return null;
    }

    public List<RoleOutput> getRoleForAdmin(Integer adminId) {
        Optional<Administrator> adminOpt = administratorRepository
                .findByIdWithRoles(adminId);
        if (adminOpt.isPresent()) {
            Administrator administrator = adminOpt.get();
            List<Role> roles = roleRepository.findRolesWithPermissions(administrator.getRoles());
            return roles.stream().map(this::convertToOutput2).toList();
        }
        return null;
    }

    public List<RoleOutput> findRoleForAdmin(String username, String searchText) {
        Optional<Administrator> adminOpt = administratorRepository
                .findByUsernameOrEmailWithRoles(username);
        if (adminOpt.isPresent()) {
            Administrator administrator = adminOpt.get();

            List<Role> roles = roleRepository.findRolesWithPermissions(administrator.getRoles());
            return roles.stream().map(this::convertToOutput2).toList();
        }
        return null;
    }

}
