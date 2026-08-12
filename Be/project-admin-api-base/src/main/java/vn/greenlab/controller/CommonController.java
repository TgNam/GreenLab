package vn.greenlab.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import vn.greenlab.model.Area;
import vn.greenlab.model.City;
import vn.greenlab.model.District;
import vn.greenlab.model.Ward;
import vn.greenlab.model.enums.ErrorCode;
import vn.greenlab.model.enums.Position;
import vn.greenlab.model.enums.ResultStatus;
import vn.greenlab.model.enums.SystemConfigKey;
import vn.greenlab.model.output.DoctorSelectOutput;
import vn.greenlab.model.output.PermissionTreeOutput;
import vn.greenlab.model.output.Response;
import vn.greenlab.model.output.administrator.AdministratorOutput;
import vn.greenlab.service.AreaService;
import vn.greenlab.service.DoctorService;
import vn.greenlab.service.AdministratorService;
import vn.greenlab.service.CityService;
import vn.greenlab.service.DistrictService;
import vn.greenlab.service.PermissionService;
import vn.greenlab.service.RoleService;
import vn.greenlab.service.SystemConfigService;
import vn.greenlab.service.WardService;
import vn.greenlab.utils.AuthUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/common", name = "Common")
@Tag(name = "Common", description = "API common")
public class CommonController {

    @Autowired
    private AdministratorService administratorService;

    @Autowired
    private CityService cityService;

    @Autowired
    private WardService wardService;

    @Autowired
    private DistrictService districtService;

    @Autowired
    private AreaService areaService;

    @Autowired
    private AuthUtils authUtils;

    @Autowired
    private RoleService roleService;

    @Autowired
    private SystemConfigService systemConfigService;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private DoctorService doctorService;

    @GetMapping(value = "/doctor-select", name = "Danh sách bác sĩ cho select")
    public ResponseEntity<Response<List<DoctorSelectOutput>>> getDoctorSelect() {
        List<DoctorSelectOutput> result = doctorService.getDoctorSelectList();
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", result));
    }

    @GetMapping(value = "/admin", name = "Tìm kiếm nhân viên")
    public ResponseEntity<Response<List<AdministratorOutput>>> searchAdmin(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "position", required = false) Position position) {
        List<AdministratorOutput> result = administratorService.searchAdmin(keyword, 0, position);
        Response<List<AdministratorOutput>> response = new Response<>(true, "Thành công", result);
        response.setCode(ErrorCode.SUCCESS);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/cities", name = "Danh sách tỉnh/thành phố")
    public ResponseEntity<Response<List<City>>> getCityList(
            @RequestParam(value = "is_old", required = false) Boolean is_old) {
        List<City> cities = new ArrayList<>();
        if (is_old == null || is_old == false) {
            cities = cityService.findListCityNew();
        } else {
            cities = cityService.findListCityOld();
        }
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", cities));
    }

    @GetMapping(value = "/wards", name = "Lấy danh sách phường/xã")
    public ResponseEntity<Response<List<Ward>>> getAllWards(
            @RequestParam(value = "is_old", required = false) Boolean is_old) {
        List<Ward> wards = new ArrayList<>();
        if (is_old == null || is_old == false) {
            wards = wardService.findListWardNew();
        } else {
            wards = wardService.findListWardOld();
        }
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS, "Thành công", wards));
    }

    @GetMapping(value = "/districts", name = "Danh sách quận/huyện")
    public ResponseEntity<Response<List<District>>> getDistricts() {
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS,
                "Thành công", districtService.getDistrictCache()));
    }

    @GetMapping(value = "/result-status", name = "Danh sách trạng thái kết quả xét nghiệm (enum ResultStatus)")
    public ResponseEntity<Response<Map<String, String>>> getResultStatus() {
        Map<String, String> result = ResultStatus.toMap();
        Response<Map<String, String>> response = new Response<>(true, ErrorCode.SUCCESS, "Thành công", result);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(value = "/area", name = "Danh sách khu vực")
    public ResponseEntity<Response<List<Area>>> searchWorkArea() {
        return ResponseEntity.ok(new Response<>(true, ErrorCode.SUCCESS,
                "Thành công", areaService.getAreaCache()));
    }

    @GetMapping(name = "Danh sách quyền của nhân viên hiện tại", value = "/roles")
    public ResponseEntity<Response<Map<String, Object>>> getAllRoleForAdmin(HttpServletRequest request) {
        Integer adminId = authUtils.getAdminId(request);
        String version = systemConfigService.getByConfigKey(SystemConfigKey.VERSION_CONFIG);
        Map<String, Object> result = new HashMap<>();
        result.put("version", version);
        result.put("roles", roleService.getRoleForAdmin(adminId));
        Response<Map<String, Object>> response = new Response<>(true, "Thành công", result);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(name = "Lấy version hiện tại", value = "/version")
    public ResponseEntity<Response<Map<String, Object>>> getVersion(HttpServletRequest request) {
        Integer adminId = authUtils.getAdminId(request);
        String version = systemConfigService.getByConfigKey(SystemConfigKey.VERSION_CONFIG);
        Map<String, Object> result = new HashMap<>();
        result.put("version", version);
        result.put("time", administratorService.findByIdFromCache(adminId).get().getUpdate_time());
        Response<Map<String, Object>> response = new Response<>(true, "Thành công", result);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(name = "Tìm kiếm quyền của nhân viên hiện tại", value = "/permissions")
    public ResponseEntity<Response<List<PermissionTreeOutput>>> findRoleForAdmin(
            @RequestParam("searchText") String searchText,
            HttpServletRequest request) {
        Integer adminId = authUtils.getAdminId(request);
        Response<List<PermissionTreeOutput>> response = new Response<>(true, "Thành công",
                permissionService.findPermissionForAdminByText(adminId, searchText));
        return ResponseEntity.ok().body(response);
    }

    // In Kết quả
    @GetMapping(name = "Danh sách nhân viên phụ trách chuyên môn", value = "/msc")
    public ResponseEntity<Response<Map<Integer, String>>> getMscUsers(HttpServletRequest request) {
        Map<Integer, String> result = administratorService.getMscUser();
        Response<Map<Integer, String>> response = new Response<>(true, "Thành công", result);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping(name = "Danh sách nhân viên thực hiện", value = "/technicians")
    public ResponseEntity<Response<Map<Integer, String>>> getTechnicianUsers(HttpServletRequest request) {
        Map<Integer, String> result = administratorService.getTechnicianUser();
        Response<Map<Integer, String>> response = new Response<>(true, "Thành công", result);
        return ResponseEntity.ok().body(response);
    }
}
