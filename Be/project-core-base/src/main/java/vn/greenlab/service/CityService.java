package vn.greenlab.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import vn.greenlab.component.RedisCacheComponent;
import vn.greenlab.model.City;
import vn.greenlab.model.output.city.CityOutput;
import vn.greenlab.repository.CityRepository;

@Service
public class CityService {

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private SystemConfigService systemConfigService;

    @Autowired
    private RedisCacheComponent redisCacheComponent;

    public List<City> findAll() {
        return cityRepository.findAll(Sort.by("id").ascending());
    }

    public List<City> findListCityOld() {
        Optional<List<City>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.CITY_LIST_OLD, City.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<City> list = cityRepository.findListCityOld();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.CITY_LIST_OLD, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    public List<City> findListCityNew() {
        Optional<List<City>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.CITY_LIST, City.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<City> list = cityRepository.findListCityNew();
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.CITY_LIST, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    private List<City> loadCityCache() {
        Optional<List<City>> cached = redisCacheComponent.getList(RedisCacheComponent.CacheKeys.CITY_LIST, City.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        List<City> list = cityRepository.findAll(Sort.by("id").ascending());
        redisCacheComponent.put(RedisCacheComponent.CacheKeys.CITY_LIST, list, RedisCacheComponent.A_DAY * 30);
        return list;
    }

    private void clearCityCache() {
        redisCacheComponent.delete(RedisCacheComponent.CacheKeys.CITY_LIST);
    }

    public List<City> getCityCache() {
        return loadCityCache();
    }

    public Page<City> findAll(Pageable pageable) {
        return cityRepository.findAll(pageable);
    }

    /**
     * Tìm kiếm tỉnh/thành phố với các bộ lọc tùy chọn.
     * Logic lọc theo parent_id:
     * - parent_id = 1 → chỉ lấy tỉnh thành cũ (parent_id > 0)
     * - parent_id = 0 → chỉ lấy tỉnh thành mới (parent_id <= 0)
     * - parent_id = null → lấy tất cả
     *
     * @param pageable  phân trang
     * @param name      tên tỉnh/thành (like search)
     * @param idParam   id tỉnh/thành
     * @param code      mã tỉnh/thành (like search)
     * @param region    vùng (like search)
     * @param parentId  bộ lọc loại: 1=cũ, 0=mới, null=tất cả
     * @return trang kết quả
     */
    public Page<City> findAllWithFilters(Pageable pageable, String name, String idParam, String code, String region, Integer parentId) {
        // Parse id nếu có
        Integer idFilter = null;
        if (idParam != null && !idParam.isBlank()) {
            try {
                int parsed = Integer.parseInt(idParam.trim());
                if (parsed > 0) {
                    idFilter = parsed;
                }
            } catch (NumberFormatException ignored) {
                // bỏ lọc id nếu không parse được
            }
        }
        return cityRepository.filterCities(
                idFilter,
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                code != null && !code.trim().isEmpty() ? code.trim() : null,
                region != null && !region.trim().isEmpty() ? region.trim() : null,
                parentId,
                pageable);
    }

    public Optional<City> findById(int id) {
        return cityRepository.findById(id);
    }

    /**
     * Chuyển đổi City entity sang CityOutput với parent_name.
     * Lấy tên tỉnh/thành mới (parent) nếu có.
     */
    public CityOutput toCityOutput(City city) {
        CityOutput output = new CityOutput();
        output.setId(city.getId());
        output.setName(city.getName());
        output.setCode(city.getCode());
        output.setRegion(city.getRegion());
        output.setParent_id(city.getParent_id());

        // Lấy tên tỉnh mới nếu có parent_id > 0
        if (city.getParent_id() > 0) {
            cityRepository.findById(city.getParent_id())
                    .ifPresent(parentCity -> output.setParent_name(parentCity.getName()));
        }

        return output;
    }

    /**
     * Chuyển đổi danh sách City entity sang danh sách CityOutput.
     */
    public List<CityOutput> toCityOutputList(List<City> cities) {
        List<CityOutput> outputs = new ArrayList<>();
        for (City city : cities) {
            outputs.add(toCityOutput(city));
        }
        return outputs;
    }

    public Optional<City> findByName(String name) {
        return cityRepository.findByName(name);
    }

    public City create(City city) {
        // Trim ID để loại bỏ khoảng trắng
        if (city.getId() > 0) {
            city.setId(city.getId());
        }
        // Kiểm tra ID đã tồn tại chưa - nếu có thì throw exception
        if (city.getId() > 0 && cityRepository.findById(city.getId()).isPresent()) {
            throw new RuntimeException("ID tỉnh/thành phố đã tồn tại");
        }
        City savedCity = cityRepository.save(city);
        systemConfigService.incrementLocationVersion();
        clearCityCache();
        return savedCity;
    }

    public City update(City city) {
        City savedCity = cityRepository.save(city);
        systemConfigService.incrementLocationVersion();
        clearCityCache();
        return savedCity;
    }

    public void delete(int id) {
        City city = cityRepository.findById(id).orElseThrow(() -> new RuntimeException("City not found"));
        cityRepository.delete(city);
        systemConfigService.incrementLocationVersion();
        clearCityCache();
    }

    public Page<City> searchCities(Pageable pageable, String searchText, Integer parentId) {
        return cityRepository.searchCitiesByText(searchText, parentId, pageable);
    }

    /**
     * Tìm danh sách tỉnh/thành cũ thuộc một tỉnh/thành mới.
     * Các tỉnh có parent_id = cityId.
     *
     * @param cityId  id tỉnh/thành mới
     * @return danh sách tỉnh/thành cũ
     */
    public List<City> findOldCitiesByParentId(int cityId) {
        return cityRepository.findByParent_id(cityId);
    }

    /**
     * Xóa tỉnh thành cũ khỏi tỉnh thành mới.
     * Đặt parent_id của tỉnh cũ về 0.
     *
     * @param oldCityId  id tỉnh cũ cần xóa khỏi tỉnh mới
     * @return tỉnh cũ đã được cập nhật
     * @throws RuntimeException nếu không tìm thấy tỉnh cũ
     */
    public City removeOldCityFromParent(int oldCityId) {
        City oldCity = cityRepository.findById(oldCityId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tỉnh/thành phố cũ với id: " + oldCityId));

        // Đặt parent_id về 0
        oldCity.setParent_id(0);
        City savedCity = cityRepository.save(oldCity);

        // Xóa cache và tăng version
        systemConfigService.incrementLocationVersion();
        clearCityCache();

        return savedCity;
    }

    /**
     * Thêm tỉnh cũ vào tỉnh mới.
     * Map parent_id của tỉnh cũ bằng id của tỉnh mới.
     *
     * @param oldCityId  id tỉnh cũ cần thêm
     * @param newCityId  id tỉnh mới để thêm vào
     * @return tỉnh cũ đã được cập nhật
     * @throws RuntimeException nếu không tìm thấy tỉnh cũ hoặc tỉnh mới
     * @throws RuntimeException nếu tỉnh mới đang là tỉnh cha có con
     * @throws RuntimeException nếu tỉnh cũ đang là tỉnh cha có con
     * @throws RuntimeException nếu tỉnh cũ đã là con của tỉnh khác
     */
    public City addOldCityToParent(int oldCityId, int newCityId) {
        // Kiểm tra cả 2 tỉnh tồn tại
        Optional<City> optOldCity = cityRepository.findById(oldCityId);
        Optional<City> optNewCity = cityRepository.findById(newCityId);

        if (optOldCity.isEmpty() && optNewCity.isEmpty()) {
            throw new RuntimeException("Không tìm thấy 2 tỉnh/thành phố với id: " + oldCityId + " và " + newCityId);
        }
        if (optOldCity.isEmpty()) {
            throw new RuntimeException("Không tìm thấy tỉnh/thành phố với id: " + oldCityId);
        }
        if (optNewCity.isEmpty()) {
            throw new RuntimeException("Không tìm thấy tỉnh/thành phố với id: " + newCityId);
        }

        City oldCity = optOldCity.get();
        City newCity = optNewCity.get();

        // Kiểm tra không map với chính mình
        if (oldCityId == newCityId) {
            throw new RuntimeException("Một tỉnh/thành phố không thể tự map vào chính mình.");
        }

        // Tỉnh mới phải chưa bị gán vào tỉnh nào khác (parent_id = 0)
        // Nếu tỉnh mới đã là con của tỉnh khác thì không cho thêm con mới vào
        if (newCity.getParent_id() > 0) {
            City parentCity = cityRepository.findById(newCity.getParent_id()).orElse(null);
            String parentName = parentCity != null ? parentCity.getName() : ("id=" + newCity.getParent_id());
            throw new RuntimeException("Tỉnh/Thành phố \"" + newCity.getName() +
                    "\" đang là tỉnh con của tỉnh/thành phố \"" + parentName + "\".");
        }

        // Kiểm tra nếu tỉnh cũ đang là tỉnh cha (parent_id = 0) và đã có con
        // Không cho phép vì sẽ tạo cấp 3 (1 con không thể vừa là cha vừa là con)
        if (oldCity.getParent_id() == 0) {
            List<City> oldCityChildren = cityRepository.findByParent_id(oldCityId);
            if (!oldCityChildren.isEmpty()) {
                String childNames = oldCityChildren.stream()
                        .map(City::getName)
                        .limit(3)
                        .collect(Collectors.joining(", "));
                if (oldCityChildren.size() > 3) {
                    childNames += "...";
                }
                throw new RuntimeException("Tỉnh/Thành phố \"" + oldCity.getName() +
                        "\" đang là tỉnh/thành phố cha được gán cho tỉnh/thành phố khác.");
            }
        }

        // Kiểm tra nếu tỉnh cũ đã là con của tỉnh khác (đã có parent_id > 0)
        // Quan hệ 1 con chỉ có 1 cha, không cho gán sang cha khác
        if (oldCity.getParent_id() > 0) {
            City parentCity = cityRepository.findById(oldCity.getParent_id()).orElse(null);
            String parentName = parentCity != null ? parentCity.getName() : ("id=" + oldCity.getParent_id());
            throw new RuntimeException("Tỉnh/Thành phố \"" + oldCity.getName() +
                    "\" đã thuộc tỉnh/thành phố \"" + parentName + "\".");
        }

        // Cập nhật parent_id
        oldCity.setParent_id(newCityId);
        City savedCity = cityRepository.save(oldCity);

        // Xóa cache và tăng version
        systemConfigService.incrementLocationVersion();
        clearCityCache();

        return savedCity;
    }
}
