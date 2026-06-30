package vn.greenlab.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

@NoRepositoryBean
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {

    @SuppressWarnings("unchecked")
    default long genId(int number) {
        long i;
        do {
            long max = 999999999L;
            if (number <= 6) {
                max = 999999L;
            }
            if (number == 8) {
                max = 99999999L;
            }
            Random random = new Random(System.nanoTime());
            i = Math.abs(random.nextLong() % max);
        } while (findById((ID) Long.valueOf(i)).isPresent() || i < 100000);
        return i;
    }

    @SuppressWarnings("unchecked")
    default int genIdInt(int number) {
        int minId = 10_000_001;
        int max = 99_999_998;
        if (number <= 6) {
            minId = 100_000;
            max = 999_999;
        }
        int i;
        do {
            // Generate random number more efficiently in the specified digit range
            i = ThreadLocalRandom.current().nextInt(minId, max + 1);
        } while (findById((ID) Integer.valueOf(i)).isPresent());
        return i;
    }

    // Tìm kiếm theo object với các field không null
    List<T> findByConditions(Object searchCriteria);

    // Tìm kiếm với phân trang
    Page<T> findByConditionsWithPaging(Object searchCriteria, Pageable pageable);

    // Đếm số lượng theo object
    Long countByConditions(Object searchCriteria);

    // Tìm 1 record duy nhất
    Optional<T> findSingleByConditions(Object searchCriteria);

    List<T> findByConditions(String conditions);

    List<T> findByConditions(String conditions, Map<String, Object> params);

    Page<T> findByConditionsWithPaging(String conditions, Map<String, Object> params, Pageable pageable);
    
    Page<T> findByConditionsWithPaging(String conditions, String clause, Map<String, Object> params, Pageable pageable);

    <P> Page<P> findByConditionsWithPagingWithClause(String conditions, String clause, Map<String, Object> params, Pageable pageable, Class<P> projectionClass);

    /**
     * Giống findByConditionsWithPagingWithClause nhưng cho phép conditions chứa ORDER BY:
     * - Count query tự động bỏ ORDER BY trong conditions.
     * - Query chính không thêm ORDER BY từ pageable khi conditions đã có ORDER BY.
     */
    <P> Page<P> findByConditionsWithPagingWithClauseSupportOrderInConditions(String conditions, String clause, Map<String, Object> params, Pageable pageable, Class<P> projectionClass);

    <P> Page<P> findByConditionsWithPagingObject(
        String conditions,
        Map<String, Object> params,
        Pageable pageable,
        Class<P> entityClass
    );
    Long countByConditions(String conditions, Map<String, Object> params);

    Long countByConditions(String conditions, String clause, Map<String, Object> params);

    List<Object> executeNativeQuery(String sql);

    List<Object> executeQuery(String jpql);

    List<Object> executeQuery(String jpql, Map<String, Object> params);

    Optional<T> findSingleByConditions(String conditions, Map<String, Object> params);

    int executeUpdate(String jpql, Map<String, Object> params);

    /**
     * Tìm kiếm với native query, projection và phân trang
     * Sử dụng cho các query phức tạp với JOIN và subqueries
     * 
     * @param baseQuery Base query (SELECT + FROM + JOIN, không có WHERE)
     * @param conditions WHERE conditions (bắt đầu với AND hoặc WHERE)
     * @param params Map các parameters
     * @param pageable Thông tin phân trang
     * @param projectionClass Class của projection/DTO
     * @return Page chứa kết quả
     */
    <P> Page<P> findByConditionsWithPagingNative(
        String baseQuery,
        String conditions,
        Map<String, Object> params,
        Pageable pageable,
        Class<P> projectionClass
    );

    /**
     * Tìm kiếm với native query và projection, không phân trang
     * Sử dụng cho các query phức tạp với JOIN và subqueries khi cần lấy toàn bộ dữ liệu
     *
     * @param baseQuery Base query (SELECT + FROM + JOIN, không có WHERE)
     * @param conditions WHERE conditions (bắt đầu với AND hoặc WHERE)
     * @param params Map các parameters
     * @param projectionClass Class của projection/DTO
     * @return Danh sách kết quả
     */
    <P> List<P> findByConditionsNative(
        String baseQuery,
        String conditions,
        Map<String, Object> params,
        Class<P> projectionClass
    );

    /**
     * Query native với single result
     * @param <P>
     * @param baseQuery
     * @param conditions
     * @param params
     * @return
     */
    <P> P queryNativeSingleResult(String sql, Map<String, Object> params);

    /**
     * Giống findByConditionsWithPagingNative nhưng dùng customCountSql riêng thay vì wrap subquery.
     * Dùng khi cần tối ưu COUNT bằng FORCE INDEX / INNER JOIN thay vì COUNT(SELECT ... FROM (...)).
     *
     * @param baseQuery     Base query dữ liệu (SELECT + FROM + JOIN + WHERE 1=1)
     * @param conditions    Điều kiện WHERE (bắt đầu bằng AND ...)
     * @param customCountSql SQL đếm hoàn chỉnh (SELECT COUNT(DISTINCT ...) FROM ... WHERE ...)
     * @param params        Parameters dùng chung cho cả data query và count query
     * @param pageable      Thông tin phân trang
     * @param projectionClass Class của projection/DTO
     */
    <P> Page<P> findByConditionsWithPagingNativeCustomCount(
        String baseQuery,
        String conditions,
        String customCountSql,
        Map<String, Object> params,
        Pageable pageable,
        Class<P> projectionClass
    );
}