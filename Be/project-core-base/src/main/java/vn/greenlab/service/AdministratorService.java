package vn.greenlab.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import vn.greenlab.component.RedisCacheComponent;
import vn.greenlab.exception.BadRequestException;
import vn.greenlab.exception.NotFoundException;
import vn.greenlab.model.Administrator;
import vn.greenlab.model.Department;
import vn.greenlab.model.Role;
import vn.greenlab.model.WorkArea;
import vn.greenlab.model.enums.EmailOutboxType;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.input.auth.ChangePasswordRequest;
import vn.greenlab.model.input.auth.ForgotPasswordRequest;
import vn.greenlab.model.output.administrator.AdministratorBaseOutput;
import vn.greenlab.model.output.administrator.AdministratorOutput;
import vn.greenlab.repository.AdministratorRepository;
import vn.greenlab.repository.DepartmentRepository;
import vn.greenlab.repository.RoleRepository;
import vn.greenlab.repository.WorkAreaRepository;
import vn.greenlab.utils.PasswordUtils;
import vn.greenlab.utils.TextUtils;

@Service
public class AdministratorService {
    @Autowired
    private AdministratorRepository administratorRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private WorkAreaRepository workAreaRepository;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

    // @Autowired
    // private EmailOutboxService emailOutboxService;

    @Value("${msc_user:bvnamhoc.namph,linhpt,phuonghoa,thucanh}")
    private String mscUserString;

    @Value("${technician_user:DUNGNT,thuhant}")
    private String technicianUserString;

    public Map<Integer, String> getTechnicianUser() {
        List<String> technicianUsers = Arrays.stream(technicianUserString.split(",")).map(String::trim).collect(Collectors.toList());
        Map<Integer, String> technicianUserMap = new HashMap<>();
        administratorRepository.findByListUser_name(technicianUsers).forEach(admin -> {
            technicianUserMap.put(admin.getId(), admin.getFull_name());
        });
        return technicianUserMap;
    }
    public Map<Integer, String> getMscUser() {
        List<String> mscUsers = Arrays.stream(mscUserString.split(",")).map(String::trim).collect(Collectors.toList());
        Map<Integer, String> mscUserMap = new HashMap<>();
        administratorRepository.findByListUser_name(mscUsers).forEach(admin -> {
            mscUserMap.put(admin.getId(), admin.getFull_name());
        });
        return mscUserMap;
    }

    public void recoverPassword(ForgotPasswordRequest request)  {
        String email = request.getEmail();
        if (email == null || TextUtils.isNullOrEmpty(email)) {
            throw new BadRequestException(ErrorCode.EMAIL_EMPTY);
        }
        Administrator admin = administratorRepository.findByUsernameOrEmail(email).orElse(null);
        if (admin == null) {
            throw new BadRequestException(ErrorCode.ADMINISTRATOR_NOT_FOUND);
        }
        boolean update = false;
        String code = admin.getLost_password_code();
        if (TextUtils.isNullOrEmpty(code)) {
            code = TextUtils.getMD5(PasswordUtils.generateRandomPassword8Chars()+ admin.getEmail());
            admin.setLost_password_code(code);
            admin.setChange_password_time(LocalDateTime.now());
            update = true;
        } else {
            if (admin.getChange_password_time().plusDays(1).isBefore(LocalDateTime.now())) {
                // từ lúc bấm quên MK đến nay đã quá 24h
                code = TextUtils.getMD5(admin.getId() + admin.getEmail());
                admin.setLost_password_code(code);
                admin.setChange_password_time(LocalDateTime.now());
                update = true;
            }
        }
        // try {
        //     String urlLink = "/pages/authentication/reset-password?code=" + code; // link gửi cho người dùng , namtn remove '#' symbol on 28/10/2020
        //     Map<String, Object> map = new HashMap<>();
        //     map.put("username", admin.getEmail());
        //     map.put("urlLink", urlLink);
        //     map.put("checksum", code);
        //     emailOutboxService.send(EmailOutboxType.STAFF_RESETPASSWORD, admin.getEmail(), "Khôi phục tài khoản",
        //             map, 0);
        //     if (update) {
        //         administratorRepository.save(admin);
        //         // memcachedClient.delete(ID_CACHE + user.getId());
        //     }
        // } catch (Exception e) {
        //     e.printStackTrace();
        // }
    }

    public boolean checkExistLostPasswordCode(String code) {
        return administratorRepository.existsByLost_password_code(code);
    }

    public void changeLostPassword(ChangePasswordRequest input, PasswordEncoder passwordEncoder)  {
        Administrator admin;
        if (!TextUtils.isNullOrEmpty(input.getCode())) {
            Optional<Administrator> adminOpt = administratorRepository.findByLost_password_code(input.getCode());
            if (adminOpt.isEmpty()) {
                throw new NotFoundException(ErrorCode.ADMIN_NOT_FOUND);
            } else if (!TextUtils.isNullOrEmpty(adminOpt.get().getLost_password_code())
                    && adminOpt.get().getChange_password_time().plusDays(1).isBefore(LocalDateTime.now())) {
                throw new BadRequestException(ErrorCode.LOST_PASSWORD_CODE_EXPIRED);
            }
            admin = adminOpt.get();
        } else {
            throw new BadRequestException(ErrorCode.LOST_PASSWORD_CODE_NOT_FOUND);
        }
        if (TextUtils.isNullOrEmpty(input.getNew_password()) || TextUtils.isNullOrEmpty(input.getConfirm_password())) {
            throw new BadRequestException(ErrorCode.PASSWORD_NEW_EMPTY);
        }
        if (!PasswordUtils.isValid(input.getNew_password())) {
            throw new BadRequestException(ErrorCode.INVALID_PASSWORD);
        }
        if (!input.getNew_password().equals(input.getConfirm_password())) {
            throw new BadRequestException(ErrorCode.CONFIRM_PASSWORD_NOT_MATCH);
        }
        admin.setPassword(passwordEncoder.encode(input.getNew_password()));
        admin.setLost_password_code(null); // xoá mã xác thực
        admin.setChange_password_time(LocalDateTime.now());
        admin.setUpdate_time(LocalDateTime.now());
        administratorRepository.save(admin);
    }

    private List<AdministratorOutput> loadAdministratorCache() {
        Optional<List<AdministratorOutput>> cached = redisCacheComponent.getList(
                RedisCacheComponent.CacheKeys.ADMINISTRATOR_LIST,
                AdministratorOutput.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<AdministratorOutput> list = administratorRepository.findAll().stream().map(this::convertToOutput)
                .collect(Collectors.toList());
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.ADMINISTRATOR_LIST, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    public void clearAdministratorCache(Integer id) {
        if (id != null) {
            redisCacheComponent.delete(RedisCacheComponent.CacheKeys.ADMINISTRATOR_ID_PREFIX + id);
        } else {
            redisCacheComponent.delete(RedisCacheComponent.CacheKeys.ADMINISTRATOR_LIST);
            redisCacheComponent.delete(RedisCacheComponent.CacheKeys.ADMINISTRATOR_BASE_INFO_LIST);
        }
    }

    /**
     * Danh sách admin từ Redis (hoặc DB nếu chưa có cache).
     * Lấy đầy đủ thông tin admin
     * Dùng {@code administratorService.getAdministratorCache()} để lấy danh sách.
     */
    public List<AdministratorOutput> getAdministratorCache() {
        return loadAdministratorCache();
    }

    /**
     * Dựng map id → AdministratorOutput từ cache
     * ({@link #getAdministratorCache()}), không query DB.
     * Dùng khi enrich danh sách (đối tác, BS, …) cần tên sales / customer care /
     * người tạo theo id.
     */
    public Map<Integer, AdministratorOutput> buildAdministratorMapByIds(Collection<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        Set<Integer> need = ids.stream()
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .collect(Collectors.toSet());
        if (need.isEmpty()) {
            return Map.of();
        }
        List<AdministratorOutput> cache = getAdministratorCache();
        if (cache == null || cache.isEmpty()) {
            return Map.of();
        }
        return cache.stream()
                .filter(a -> need.contains(a.getId()))
                .collect(Collectors.toMap(AdministratorOutput::getId, a -> a, (a, b) -> a));
    }

    public int genId(int number) {
        return administratorRepository.genIdInt(number);
    }

    public List<Administrator> findAll() {
        return administratorRepository.findAll();
    }

    public List<Administrator> findAllHaveArea() {
        return administratorRepository.findAllHaveAreaAndCSKH();
    }

    public Page<AdministratorOutput> findAll(Pageable pageable, Integer id, LocalDateTime createTimeFrom,
            LocalDateTime createTimeTo,
            String name, String phone, Boolean isActive, Integer managerId, String departmentId, String workAreaId,
            String username, Integer timeType) {
        if (createTimeTo != null) {
            createTimeTo = createTimeTo.plusDays(1);
        }
        Integer isActiveNumber = null;
        if (isActive != null) {
            if (isActive.booleanValue()) {
                isActiveNumber = 1;
            } else {
                isActiveNumber = 0;
            }
        }
        Page<Administrator> adPage = administratorRepository.findAllByUsernameAndStatus(id, createTimeFrom,
                createTimeTo, name, phone, isActiveNumber, managerId, departmentId, workAreaId, username, timeType,
                pageable);
        try {
            List<String> deptIds = adPage.stream()
                    .map(a -> a.getDepartment_id())
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            List<Department> departments = departmentRepository.findAllByShort_nameIn(deptIds);

            List<String> workAreaIds = adPage.stream()
                    .map(a -> a.getWork_area_id())
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            List<WorkArea> workAreas = workAreaRepository.findAllByShort_nameIn(workAreaIds);
            return adPage.map(ad -> convertToOutput(ad, departments, workAreas));

        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return adPage.map(ad -> convertToOutput(ad));

    }

    /**
     * Lấy 1 admin từ DB
     * 
     * @param id
     * @return
     */
    public Optional<Administrator> findById(Integer id) {
        return administratorRepository.findById(id);
    }

    /**
     * Lấy danh sách admin từ cache theo list id admin
     * Nếu id không tồn tại trong cache thì query DB và add vào cache
     * Lấy đầy đủ thông tin admin
     * 
     * @param ids list id admin
     * @author namtn
     * @return
     */
    public List<AdministratorOutput> findListAdminCache(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. Lấy danh sách ID duy nhất để truy vấn Redis
        List<Integer> distinctIds = ids.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();

        List<String> keys = distinctIds.stream()
                .map(id -> RedisCacheComponent.CacheKeys.ADMINISTRATOR_ID_PREFIX + id)
                .toList();

        List<AdministratorOutput> redisData = redisCacheComponent.multiGet(keys, AdministratorOutput.class);

        // 2. Đưa dữ liệu Redis vào Map để tra cứu theo ID (Integer) cho dễ
        Map<Integer, AdministratorOutput> resultMap = new HashMap<>();
        List<Integer> missingIds = new ArrayList<>();

        for (int i = 0; i < distinctIds.size(); i++) {
            Integer id = distinctIds.get(i);
            AdministratorOutput data = redisData.get(i);
            if (data != null) {
                resultMap.put(id, data);
            } else {
                missingIds.add(id);
            }
        }

        // 3. Nếu thiếu, truy vấn Database
        if (!missingIds.isEmpty()) {
            List<Administrator> dbAdmins = administratorRepository.findAllById(missingIds);
            Map<String, Object> batchCache = new HashMap<>();

            for (Administrator admin : dbAdmins) {
                AdministratorOutput adminOutput = convertToOutput(admin);
                resultMap.put(admin.getId(), adminOutput); // Cho vào Map kết quả

                // Chuẩn bị để lưu lại vào Redis
                String key = RedisCacheComponent.CacheKeys.ADMINISTRATOR_ID_PREFIX + admin.getId();
                batchCache.put(key, adminOutput);
            }

            if (!batchCache.isEmpty()) {
                redisCacheComponent.multiPut(batchCache, RedisCacheComponent.A_DAY * 30);
            }
        }

        // 4. Trả về List theo ĐÚNG THỨ TỰ và ĐÚNG SỐ LƯỢNG của danh sách ids truyền vào
        // ban đầu
        // Cách này giúp đoạn .forEach() bên ngoài không bao giờ bị lỗi index
        return ids.stream()
                .map(id -> resultMap.get(id)) // Sẽ trả về AdministratorOutput hoặc null nếu hoàn toàn không tìm thấy
                .filter(Objects::nonNull) // Giữ lại logic cũ của bạn là lọc bỏ null
                .toList();
    }

    /**
     * Lấy 1 admin từ Cache, nếu không có thì lấy từ DB
     * 
     * @param id
     * @return
     */
    public Optional<AdministratorOutput> findByIdFromCache(Integer id) {
        Optional<AdministratorOutput> adminOpt = redisCacheComponent.get(
                RedisCacheComponent.CacheKeys.ADMINISTRATOR_ID_PREFIX + id,
                AdministratorOutput.class);
        if (adminOpt.isPresent()) {
            return adminOpt;
        }
        Administrator admin = findById(id).orElseThrow(() -> new NotFoundException(ErrorCode.ADMIN_NOT_FOUND));
        if (admin != null) {
            AdministratorOutput adminOutput = convertToOutput(admin);
            redisCacheComponent.put(RedisCacheComponent.CacheKeys.ADMINISTRATOR_ID_PREFIX + id, adminOutput,
                    RedisCacheComponent.A_DAY * 30);
            return Optional.of(adminOutput);
        }
        return Optional.empty();
    }

    public Optional<Administrator> findByPhone(String phone) {
        return administratorRepository.findByPhone(phone);
    }

    public boolean existsByStartBarcode(String startBarcode) {
        return administratorRepository.existsByStartBarcode(startBarcode);
    }

    public Optional<Administrator> findByUsername(String username) {
        return administratorRepository.findByUser_name(username);
    }

    public List<Administrator> findByListUsername(List<String> usernames) {
        return administratorRepository.findByListUser_name(usernames);
    }

    public Optional<Administrator> findByUsernameOrEmail(String username) {
        return administratorRepository.findByUsernameOrEmail(username);
    }

    public Optional<Administrator> findByEmail(String email) {
        return administratorRepository.findByEmail(email);
    }

    /**
     * Thông tin admin đang đăng nhập (dùng {@link #convertToOutputV2}) trong
     * transaction để load quan hệ lazy.
     */
    @Transactional
    public AdministratorOutput getLoggedInProfileOutputV2(int administratorId) {
        Administrator admin = administratorRepository.findById(administratorId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ADMIN_NOT_FOUND));
        if (admin.getStatus() == 0) {
            throw new BadRequestException(ErrorCode.ACCOUNT_LOCKED);
        }
        AdministratorOutput out = convertToOutputV2(admin);
        out.setPassword(null);
        out.setSalt(null);
        out.setToken(null);
        return out;
    }

    public AdministratorOutput update(Administrator administrator) {
        administrator.setUser_name(administrator.getUser_name().toLowerCase().trim());
        administrator.setEmail(administrator.getEmail().toLowerCase().trim());
        administrator.setPhone(administrator.getPhone().trim());
        Administrator admin = administratorRepository.save(administrator);
        clearAdministratorCache(admin.getId());
        return convertToOutputV2(admin);
    }

    @Transactional
    public void setRoles(Integer adminId, List<Integer> roleIds, Integer actorAdminId) {
        if (actorAdminId == null) {
            throw new BadRequestException(ErrorCode.ADMIN_NOT_FOUND);
        }
        Administrator currentAdmin = administratorRepository.findById(adminId)
                .orElseThrow(() -> new BadRequestException(ErrorCode.ADMIN_NOT_FOUND));
        Set<Integer> allowedRoleIds;
        // Nếu là super admin hoặc chưa được phân cấp nhóm quyền nào → được cấp tất cả
        if (currentAdmin.getRoleIds() == null ||
                currentAdmin.getRoleIds().trim().isEmpty()) {
            allowedRoleIds = roleRepository.findAll().stream().map(Role::getId).collect(Collectors.toSet());
        } else {
            // Nếu đã được phân cấp → chỉ được cấp những quyền trong phân cấp đó
            allowedRoleIds = Arrays.stream(currentAdmin.getRoleIds().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Integer::valueOf)
                    .collect(Collectors.toSet());
        }
        List<Role> roles = roleRepository.findAllById(roleIds).stream()
                .filter(r -> allowedRoleIds.contains(r.getId()))
                .toList();
        currentAdmin.setRoles(new ArrayList<>(roles));
        currentAdmin.setUpdate_time(LocalDateTime.now());
        administratorRepository.save(currentAdmin);
        clearAdministratorCache(currentAdmin.getId());
        for (int i = 0; i < roles.size(); i++) {
            if (!roles.get(i).getAdministrators().contains(currentAdmin)) {
                roles.get(i).getAdministrators().add(currentAdmin);
            }
        }
        roleRepository.saveAll(roles);
    }

    public void setRolesCanAssign(Integer adminId, List<Integer> roleIds) {
        Optional<Administrator> adminOpt = administratorRepository.findById(adminId);
        if (!adminOpt.isEmpty()) {
            Administrator admin = adminOpt.get();
            List<Role> roles = roleRepository.findAllById(roleIds);
            String roleIdsStr = "";
            for (int i = 0; i < roles.size(); i++) {
                roleIdsStr += roles.get(i).getId();
                if (i != roles.size() - 1) {
                    roleIdsStr += ",";
                }
            }
            admin.setRoleIds(roleIdsStr);
            admin.setUpdate_time(LocalDateTime.now());
            administratorRepository.save(admin);
            clearAdministratorCache(admin.getId());
        }

    }

    public List<AdministratorOutput> searchAdminWithCache(List<Integer> adminIds, String searchText, int page) {

        List<AdministratorOutput> result = getAdministratorCache()
                .stream()
                .filter(a -> a.getStatus() == 1 && ((a.getUser_name() != null && a.getUser_name().contains(searchText))
                        || (a.getEmail() != null && a.getEmail().contains(searchText))
                        || (a.getPhone() != null && a.getPhone().contains(searchText))
                        || (a.getFull_name() != null && a.getFull_name().contains(searchText))))
                .skip(page * 20)
                .limit(20)
                .toList();
        return result;
    }

    public List<AdministratorOutput> searchAdmin(List<Integer> adminIds, String searchText, int page) {

        // List<AdministratorOutput> result = getAdministratorCache()
        //         .stream()
        //         .filter(a -> a.getStatus() == 1 && ((a.getUser_name() != null && a.getUser_name().contains(searchText))
        //                 || (a.getEmail() != null && a.getEmail().contains(searchText))
        //                 || (a.getPhone() != null && a.getPhone().contains(searchText))
        //                 || (a.getFull_name() != null && a.getFull_name().contains(searchText))))
        //         .skip(page * 20)
        //         .limit(20)
        //         .toList();
        List<AdministratorOutput> result = administratorRepository.getAdministratorList(null, searchText, null).stream().map(this::convertToOutput).toList();
        return result;
    }

    public List<AdministratorOutput> searchAdmin(String searchText, int page,
            vn.greenlab.model.enums.Position position) {

        List<AdministratorOutput> result = administratorRepository.findByKeywordAndPosition(searchText, position).stream().map(this::convertToOutput).toList();
        return result;
    }

    public List<AdministratorOutput> searchAdminV2(Integer id, String searchText) {
        Pageable pageable = PageRequest.of(0, 20);
        // List<AdministratorOutput> result = administratorRepository
        // .getAdministratorList(id, keyword,
        // pageable).getContent().stream().map(this::convertToOutput)
        // .toList();
        List<AdministratorOutput> result = getAdministratorCache()
                .stream()
                .filter(a -> (id == null || a.getId() == id)
                        || (a.getUser_name() != null && a.getUser_name().contains(searchText))
                        || (a.getEmail() != null && a.getEmail().contains(searchText))
                        || (a.getPhone() != null && a.getPhone().contains(searchText))
                        || (a.getFull_name() != null && a.getFull_name().contains(searchText)))
                .skip(0)
                .limit(20)
                .toList();
        return result;
    }

    public AdministratorOutput convertToOutput(Administrator admin) {
        AdministratorOutput dto = new AdministratorOutput();
        dto.setId(admin.getId());
        dto.setDepartment_id(admin.getDepartment_id());
        dto.setWork_area_id(admin.getWork_area_id());
        dto.setUser_name(admin.getUser_name());
        dto.setEmail(admin.getEmail());
        dto.setPhone(admin.getPhone());
        dto.setFull_name(admin.getFull_name());
        if (admin.getPosition() != null) {
            try {
                dto.setPosition(admin.getPosition());
                dto.setPosition_name(admin.getPosition().getPosition_name());
            } catch (Exception e) {
                dto.setPosition(null);
            }
        }
        dto.setStatus(admin.getStatus());
        dto.setCreate_time(admin.getCreate_time());
        dto.setUpdate_time(admin.getUpdate_time());
        dto.setPhoto(admin.getPhoto());
        dto.setDigital_signature(admin.getDigital_signature());
        dto.setLast_login_ip(admin.getLast_login_ip());
        dto.setStart_barcode(admin.getStart_barcode());
        if (admin.getManager() != null) {
            dto.setManager_id(admin.getManager().getId());
            dto.setManager_username(admin.getManager().getUser_name());
            dto.setManager_email(admin.getManager().getEmail());
        }
        return dto;
    }

    public AdministratorOutput convertToOutputV2(Administrator admin) {
        List<String> deptIds = admin.getDepartment_id() != null
                ? new ArrayList<>(Arrays.asList(admin.getDepartment_id()))
                : new ArrayList<>();
        List<Department> departments = departmentRepository.findAllByShort_nameIn(deptIds);

        List<String> workAreaIds = admin.getWork_area_id() != null
                ? new ArrayList<>(Arrays.asList(admin.getWork_area_id()))
                : new ArrayList<>();
        List<WorkArea> workAreas = workAreaRepository.findAllByShort_nameIn(workAreaIds);
        AdministratorOutput dto = new AdministratorOutput();
        dto.setId(admin.getId());
        dto.setDepartment_id(admin.getDepartment_id());
        dto.setWork_area_id(admin.getWork_area_id());
        dto.setUser_name(admin.getUser_name());
        dto.setEmail(admin.getEmail());
        dto.setPhone(admin.getPhone());
        dto.setFull_name(admin.getFull_name());
        if (admin.getPosition() != null) {
            try {
                dto.setPosition(admin.getPosition());
                dto.setPosition_name(admin.getPosition().getPosition_name());
            } catch (Exception e) {
                dto.setPosition(null);
            }
        }
        dto.setStatus(admin.getStatus());
        dto.setCreate_time(admin.getCreate_time());
        dto.setUpdate_time(admin.getUpdate_time());
        dto.setPhoto(admin.getPhoto());
        dto.setDigital_signature(admin.getDigital_signature());
        dto.setStart_barcode(admin.getStart_barcode());
        dto.setLast_login_ip(admin.getLast_login_ip());
        if (admin.getDepartment_id() != null) {
            List<Department> list = departments.stream()
                    .filter(d -> d.getShort_name().trim().equals(admin.getDepartment_id().trim())).toList();
            if (!list.isEmpty()) {
                dto.setDepartment_short_name(list.get(0).getShort_name());
                dto.setDepartment_name(list.get(0).getName());
            }
        }
        if (admin.getWork_area_id() != null) {
            List<WorkArea> list = workAreas.stream()
                    .filter(d -> d.getShort_name().trim().equals(admin.getWork_area_id().trim())).toList();
            if (!list.isEmpty()) {
                dto.setWork_area_name(list.get(0).getName());
                dto.setWork_area_short_name(list.get(0).getShort_name());
            }
        }
        if (admin.getManager() != null) {
            dto.setManager_id(admin.getManager().getId());
            dto.setManager_username(admin.getManager().getUser_name());
            dto.setManager_email(admin.getManager().getEmail());
        }
        return dto;
    }

    public AdministratorOutput convertToOutput(Administrator admin, List<Department> departments,
            List<WorkArea> workAreas) {
        AdministratorOutput dto = new AdministratorOutput();
        dto.setId(admin.getId());
        dto.setDepartment_id(admin.getDepartment_id());
        dto.setWork_area_id(admin.getWork_area_id());
        dto.setUser_name(admin.getUser_name());
        dto.setEmail(admin.getEmail());
        dto.setPhone(admin.getPhone());
        dto.setFull_name(admin.getFull_name());
        if (admin.getPosition() != null) {
            try {
                dto.setPosition(admin.getPosition());
                dto.setPosition_name(admin.getPosition().getPosition_name());
            } catch (Exception e) {
                dto.setPosition(null);
            }
        }
        dto.setStatus(admin.getStatus());
        dto.setCreate_time(admin.getCreate_time());
        dto.setUpdate_time(admin.getUpdate_time());
        dto.setPhoto(admin.getPhoto());
        dto.setDigital_signature(admin.getDigital_signature());
        dto.setStart_barcode(admin.getStart_barcode());
        dto.setLast_login_ip(admin.getLast_login_ip());
        if (admin.getDepartment_id() != null) {
            List<Department> list = departments.stream()
                    .filter(d -> d.getShort_name().trim().equals(admin.getDepartment_id().trim())).toList();
            if (!list.isEmpty()) {
                dto.setDepartment_short_name(list.get(0).getShort_name());
                dto.setDepartment_name(list.get(0).getName());
            }
        }
        if (admin.getWork_area_id() != null) {
            List<WorkArea> list = workAreas.stream()
                    .filter(d -> d.getShort_name().trim().equals(admin.getWork_area_id().trim())).toList();
            if (!list.isEmpty()) {
                dto.setWork_area_name(list.get(0).getName());
                dto.setWork_area_short_name(list.get(0).getShort_name());
            }
        }
        if (admin.getManager() != null) {
            dto.setManager_id(admin.getManager().getId());
            dto.setManager_username(admin.getManager().getUser_name());
            dto.setManager_email(admin.getManager().getEmail());
        }
        return dto;
    }

    public AdministratorOutput assignManager(Integer id, Integer managerId) {
        Administrator admin = administratorRepository.findById(id)
                .orElseThrow(() -> new BadRequestException(ErrorCode.ADMIN_NOT_FOUND));
        Administrator manager = administratorRepository.findById(managerId)
                .orElseThrow(() -> new BadRequestException(ErrorCode.ADMIN_NOT_FOUND));
        admin.setManager(manager);
        admin.setUpdate_time(LocalDateTime.now());
        Administrator administrator = administratorRepository.save(admin);
        clearAdministratorCache(administrator.getId());
        return convertToOutputV2(administrator);
    }

    public List<Department> searchDepartment(List<Long> departmentIds, String name, Integer page) {
        // TODO Auto-generated method stub
        Pageable pageable = PageRequest.of(page, 20);
        List<Department> result = departmentRepository
                .searchDepartmentActive(name, departmentIds, pageable).stream()
                .toList();
        return result;
    }

    public List<AdministratorOutput> searchAdminSelectBox(String keyword) {
        String kw = keyword == null ? "" : keyword.toLowerCase();

        return getAdministratorCache()
                .stream()
                .filter(a -> kw.isEmpty()
                        || (a.getUser_name() != null && a.getUser_name().toLowerCase().contains(kw))
                        || (a.getEmail() != null && a.getEmail().toLowerCase().contains(kw))
                        || (a.getPhone() != null && a.getPhone().contains(kw))
                        || (a.getFull_name() != null && a.getFull_name().toLowerCase().contains(kw)))
                .limit(20)
                .toList();
    }

    /**
     * Kiểm tra 1 admin có tồn tại hay không
     * Không cache
     * 
     * @param id
     * @return
     */
    public boolean checkAdministratorExist(int id) {
        return administratorRepository.existsById(id);
    }

    /**
     * Tìm 1 admin theo mã barcode
     * Không cache
     */
    public AdministratorOutput getAdministratorByBarcode(String barcode) {
        return administratorRepository.findAllBySeqPrefix(barcode).stream().map(this::convertToOutput).findFirst().orElse(null);
    }

    /**
     * Lấy tất cả admin với thông tin cơ bản
     * Lấy từ cache nếu có, nếu không thì lấy từ DB và add vào cache
     * 
     * @return
     */
    public List<AdministratorBaseOutput> getAllAdministratorBaseInfo() {
        Optional<List<AdministratorBaseOutput>> cached = redisCacheComponent.getList(
                RedisCacheComponent.CacheKeys.ADMINISTRATOR_BASE_INFO_LIST,
                AdministratorBaseOutput.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<AdministratorBaseOutput> administrators = administratorRepository.getAllAdministratorBaseInfo();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.ADMINISTRATOR_BASE_INFO_LIST, administrators,
                RedisCacheComponent.A_DAY * 30);
        return administrators;
    }
}