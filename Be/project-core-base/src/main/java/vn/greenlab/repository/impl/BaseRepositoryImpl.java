package vn.greenlab.repository.impl;

import java.io.Serializable;
import java.lang.reflect.Field;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.support.JpaEntityInformation;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Id;
import jakarta.persistence.Parameter;
import jakarta.persistence.TypedQuery;
import vn.greenlab.repository.BaseRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.ArrayList;

@Transactional
public class BaseRepositoryImpl<T, ID extends Serializable> extends SimpleJpaRepository<T, ID>
        implements BaseRepository<T, ID> {

    private final EntityManager entityManager;
    private final Class<T> entityClass;

    @Autowired
    public BaseRepositoryImpl(JpaEntityInformation<T, ?> entityInformation, EntityManager entityManager) {
        super(entityInformation, entityManager);
        this.entityManager = entityManager;
        this.entityClass = entityInformation.getJavaType();
    }

    // Lấy tên entity để dùng trong HQL/JPQL
    protected String getEntityName() {
        return entityClass.getSimpleName();
    }

    private static class QueryBuilder {

        StringBuilder whereClause = new StringBuilder();
        Map<String, Object> parameters = new HashMap<>();

        void addCondition(String fieldName, Object value) {
            if (whereClause.length() > 0) {
                whereClause.append(" ");
            }
            whereClause.append("AND e.").append(fieldName).append(" = :").append(fieldName);
            parameters.put(fieldName, value);
        }

        String getWhereClause() {
            return whereClause.toString();
        }

        Map<String, Object> getParameters() {
            return parameters;
        }
    }

    private QueryBuilder buildQueryFromObject(Object searchCriteria) {
        QueryBuilder builder = new QueryBuilder();

        if (searchCriteria == null) {
            return builder;
        }

        Class<?> criteriaClass = searchCriteria.getClass();

        // Lấy tất cả fields (bao gồm cả private)
        Field[] fields = criteriaClass.getDeclaredFields();

        for (Field field : fields) {
            try {
                // Cho phép access private field
                field.setAccessible(true);

                // Lấy giá trị của field
                Object value = field.get(searchCriteria);

                // Chỉ thêm vào query nếu value KHÔNG NULL
                if (value != null) {
                    String fieldName = field.getName();
                    builder.addCondition(fieldName, value);
                }

            } catch (IllegalAccessException e) {
                // Log error nếu cần
                System.err.println("Cannot access field: " + field.getName());
            }
        }

        return builder;
    }

    // ============= IMPLEMENT CÁC METHOD TỪ BaseRepository INTERFACE =============
    @Override
    public List<T> findByConditions(Object searchCriteria) {
        QueryBuilder builder = buildQueryFromObject(searchCriteria);

        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + builder.getWhereClause();
        TypedQuery<T> query = entityManager.createQuery(jpql, entityClass);

        // Set parameters
        builder.getParameters().forEach(query::setParameter);

        return query.getResultList();
    }

    /**
     * Validates if a field exists in the entity class using reflection
     *
     * @param fieldName The field name to validate
     * @return true if field exists, false otherwise
     */
    private boolean isValidField(String fieldName) {
        try {
            Field field = entityClass.getDeclaredField(fieldName);
            return field != null;
        } catch (NoSuchFieldException e) {
            // Check parent classes as well
            Class<?> superClass = entityClass.getSuperclass();
            while (superClass != null && superClass != Object.class) {
                try {
                    Field field = superClass.getDeclaredField(fieldName);
                    if (field != null) {
                        return true;
                    }
                } catch (NoSuchFieldException ex) {
                    // Continue checking parent classes
                }
                superClass = superClass.getSuperclass();
            }
            return false;
        }
    }

    /**
     * Finds the ID field name of the entity using reflection
     *
     * @return The ID field name, or "id" as default if not found
     */
    private String getIdFieldName() {
        Field[] fields = entityClass.getDeclaredFields();
        for (Field field : fields) {
            if (field.isAnnotationPresent(Id.class)) {
                return field.getName();
            }
        }
        // Check parent classes
        Class<?> superClass = entityClass.getSuperclass();
        while (superClass != null && superClass != Object.class) {
            Field[] superFields = superClass.getDeclaredFields();
            for (Field field : superFields) {
                if (field.isAnnotationPresent(Id.class)) {
                    return field.getName();
                }
            }
            superClass = superClass.getSuperclass();
        }
        // Default to "id" if not found
        return "id";
    }

    /**
     * Builds ORDER BY clause from Pageable Sort, validating each field exists
     * If no sort is provided, defaults to ordering by entity's id field
     * descending
     *
     * @param sort The Sort object from Pageable
     * @return ORDER BY clause string (defaults to " ORDER BY e.id DESC" if no
     *         sort provided)
     */
    private String buildOrderByClause(Sort sort) {
        if (sort == null || !sort.isSorted()) {
            // Default: order by id field descending
            String idFieldName = getIdFieldName();
            if (isValidField(idFieldName)) {
                return " ORDER BY e." + idFieldName + " DESC";
            }
            return "";
        }

        List<String> orderClauses = new ArrayList<>();
        for (Sort.Order order : sort) {
            String property = order.getProperty();

            // Validate field exists using reflection
            if (!isValidField(property)) {
                // Log warning but continue with other valid fields
                System.err.println("Warning: Field '" + property + "' does not exist in entity "
                        + entityClass.getSimpleName() + ". Skipping sort.");
                continue;
            }

            String direction = order.getDirection().name();
            orderClauses.add("e." + property + " " + direction);
        }

        if (orderClauses.isEmpty()) {
            // If all sort fields were invalid, fall back to id descending
            String idFieldName = getIdFieldName();
            if (isValidField(idFieldName)) {
                return " ORDER BY e." + idFieldName + " DESC";
            }
            return "";
        }

        return " ORDER BY " + String.join(", ", orderClauses);
    }

    private String buildOrderByClauseV2(Sort sort) {
        if (sort == null || !sort.isSorted()) {
            // Default: order by id field descending
            String idFieldName = getIdFieldName();
            if (isValidField(idFieldName)) {
                return " ORDER BY " + idFieldName + " DESC";
            }
            return "";
        }

        List<String> orderClauses = new ArrayList<>();
        for (Sort.Order order : sort) {
            String property = order.getProperty();

            // Validate field exists using reflection
            if (!isValidField(property)) {
                // Log warning but continue with other valid fields
                System.err.println("Warning: Field '" + property + "' does not exist in entity "
                        + entityClass.getSimpleName() + ". Skipping sort.");
                continue;
            }

            String direction = order.getDirection().name();
            orderClauses.add("" + property + " " + direction);
        }

        if (orderClauses.isEmpty()) {
            // If all sort fields were invalid, fall back to id descending
            String idFieldName = getIdFieldName();
            if (isValidField(idFieldName)) {
                return " ORDER BY " + idFieldName + " DESC";
            }
            return "";
        }

        return " ORDER BY " + String.join(", ", orderClauses);
    }

    /***
     * fagXiao
     * 
     * @param sort
     * @return
     */
    private String buildOrderByClauseV3(Sort sort) {
        // Không cần khai báo mainAlias nữa vì bạn không muốn dùng prefix

        // 1. Xử lý trường hợp Null hoặc chưa Sort -> Mặc định theo ID (không prefix)
        if (sort == null || !sort.isSorted()) {
            return " ORDER BY " + getIdFieldName() + " DESC";
        }

        List<String> orderClauses = new ArrayList<>();
        for (Sort.Order order : sort) {
            String property = order.getProperty(); // Input: "code" HOẶC "dc.is_advisory"
            String finalClause;

            if (property.contains(".")) {
                // Case 1: Đã có alias (vd: dc.is_advisory) -> Giữ nguyên
                finalClause = property;
            } else {
                // Case 2: Không có alias (vd: code) -> Bảng chính
                // YÊU CẦU CỦA BẠN: Không thêm "e." hay "dn." vào trước

                // Vẫn nên validate để tránh SQL Injection hoặc lỗi tên cột
                if (!isValidField(property)) {
                    System.err.println("Warning: Field '" + property + "' invalid. Skipping.");
                    continue;
                }

                // Giữ nguyên tên trường trần (raw field name)
                finalClause = property;
            }

            String direction = order.getDirection().name();
            orderClauses.add(finalClause + " " + direction);
        }

        // Fallback: Nếu list rỗng (do validate sai hết) -> Mặc định theo ID (không
        // prefix)
        if (orderClauses.isEmpty()) {
            return " ORDER BY " + getIdFieldName() + " DESC";
        }

        return " ORDER BY " + String.join(", ", orderClauses);
    }

    /**
     * Sử dụng: Page<T> results =
     * baseRepository.findByConditionsWithPaging(searchCriteria, pageable);
     * searchCriteria là object chứa các field cần tìm kiếm pageable là object
     * chứa thông tin phân trang return là object Page<T> chứa danh sách kết quả
     * và thông tin phân trang
     *
     * Ví dụ: PatientSearchInput searchCriteria = new PatientSearchInput();
     * searchCriteria.setPatientName("Nguyễn Văn A");
     * searchCriteria.setPhone("0909090909");
     * searchCriteria.setPageable(Pageable.of(0,
     * 10).sort(Sort.by(Sort.Direction.DESC, "create_time"))); Page<Patient>
     * results = baseRepository.findByConditionsWithPaging(searchCriteria,
     * Pageable.of(0, 10)); return results;
     */
    @Override
    public Page<T> findByConditionsWithPaging(Object searchCriteria, Pageable pageable) {
        QueryBuilder builder = buildQueryFromObject(searchCriteria);

        // Build ORDER BY clause from pageable sort
        String orderByClause = buildOrderByClause(pageable.getSort());

        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + builder.getWhereClause() + orderByClause;
        TypedQuery<T> query = entityManager.createQuery(jpql, entityClass);

        // Set parameters
        builder.getParameters().forEach(query::setParameter);

        // Paging
        query.setFirstResult(pageable.getPageNumber() * pageable.getPageSize());
        query.setMaxResults(pageable.getPageSize());

        List<T> results = query.getResultList();
        Long totalElements = this.countByConditions(searchCriteria);
        return new PageImpl<>(results, pageable, totalElements);
    }

    @Override
    public Long countByConditions(Object searchCriteria) {
        QueryBuilder builder = buildQueryFromObject(searchCriteria);

        String jpql = "SELECT COUNT(e) FROM " + getEntityName() + " e WHERE 1=1 " + builder.getWhereClause();
        TypedQuery<Long> query = entityManager.createQuery(jpql, Long.class);

        // Set parameters
        builder.getParameters().forEach(query::setParameter);

        return query.getSingleResult();
    }

    @Override
    public Optional<T> findSingleByConditions(Object searchCriteria) {
        QueryBuilder builder = buildQueryFromObject(searchCriteria);

        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + builder.getWhereClause();
        TypedQuery<T> query = entityManager.createQuery(jpql, entityClass);

        // Set parameters
        builder.getParameters().forEach(query::setParameter);

        query.setMaxResults(1);
        List<T> results = query.getResultList();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<T> findByConditions(String conditions) {
        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + conditions;
        return entityManager.createQuery(jpql, entityClass).getResultList();
    }

    @Override
    public List<T> findByConditions(String conditions, Map<String, Object> params) {
        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + conditions;
        TypedQuery<T> query = entityManager.createQuery(jpql, entityClass);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        return query.getResultList();
    }

    @Override
    public Page<T> findByConditionsWithPaging(String conditions, Map<String, Object> params,
            Pageable pageable) {
        // Build ORDER BY clause from pageable sort
        String orderByClause = buildOrderByClause(pageable.getSort());
        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + conditions + orderByClause;
        TypedQuery<T> query = entityManager.createQuery(jpql, entityClass);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        query.setFirstResult(pageable.getPageNumber() * pageable.getPageSize());
        query.setMaxResults(pageable.getPageSize());

        List<T> results = query.getResultList();
        Long totalElements = this.countByConditions(conditions, params);
        return new PageImpl<T>(results, pageable, totalElements);
    }

    @Override
    public <P> Page<P> findByConditionsWithPagingWithClause(String conditions, String clause,
            Map<String, Object> params,
            Pageable pageable, Class<P> projectionClass) {
        // Build ORDER BY clause from pageable sort
        String orderByClause = buildOrderByClauseV3(pageable.getSort());
        String jpql = clause + conditions + orderByClause;
        TypedQuery<P> query = entityManager.createQuery(jpql, projectionClass);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        query.setFirstResult(pageable.getPageNumber() * pageable.getPageSize());
        query.setMaxResults(pageable.getPageSize());

        List<P> results = query.getResultList();
        Long totalElements = this.countByConditions(conditions, clause, params);
        return new PageImpl<P>(results, pageable, totalElements);
    }

    @Override
    public <P> Page<P> findByConditionsWithPagingWithClauseSupportOrderInConditions(String conditions, String clause,
            Map<String, Object> params,
            Pageable pageable, Class<P> projectionClass) {
        String orderByClause = buildOrderByClauseV3(pageable.getSort());
        boolean conditionsHasOrderBy = conditions != null && conditions.toUpperCase().contains(" ORDER BY ");
        String jpql = clause + conditions + (conditionsHasOrderBy ? "" : orderByClause);
        TypedQuery<P> query = entityManager.createQuery(jpql, projectionClass);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        query.setFirstResult(pageable.getPageNumber() * pageable.getPageSize());
        query.setMaxResults(pageable.getPageSize());
        List<P> results = query.getResultList();
        String conditionsForCount = stripOrderByFromConditions(conditions);
        Long totalElements = this.countByConditions(conditionsForCount, clause, params);
        return new PageImpl<P>(results, pageable, totalElements);
    }

    @Override
    public Long countByConditions(String conditions, String clause, Map<String, Object> params) {
        String countJpql = buildCountQueryFromClause(clause, conditions);
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);
        if (params != null) {
            params.forEach(countQuery::setParameter);
        }
        Long totalElements = countQuery.getSingleResult();
        return totalElements;
    }

    @Override
    public Long countByConditions(String conditions, Map<String, Object> params) {
        String jpql = "SELECT COUNT(e) FROM " + getEntityName() + " e WHERE 1=1 " + conditions;
        TypedQuery<Long> query = entityManager.createQuery(jpql, Long.class);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        return query.getSingleResult();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object> executeNativeQuery(String sql) {
        return entityManager.createNativeQuery(sql, Object.class).getResultList();
    }

    @Override
    public List<Object> executeQuery(String jpql) {
        return entityManager.createQuery(jpql, Object.class).getResultList();
    }

    @Override
    public List<Object> executeQuery(String jpql, Map<String, Object> params) {
        TypedQuery<Object> query = entityManager.createQuery(jpql, Object.class);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        return query.getResultList();
    }

    @Override
    public Optional<T> findSingleByConditions(String conditions, Map<String, Object> params) {
        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + conditions;
        TypedQuery<T> query = entityManager.createQuery(jpql, entityClass);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        query.setMaxResults(1);
        List<T> results = query.getResultList();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public int executeUpdate(String jpql, Map<String, Object> params) {
        TypedQuery<?> query = entityManager.createQuery(jpql, Object.class);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        return query.executeUpdate();
    }

    // Getter cho EntityManager
    protected EntityManager getEntityManager() {
        return entityManager;
    }

    // Getter cho Entity Class
    protected Class<T> getEntityClass() {
        return entityClass;
    }

    @Override
    public <P> Page<P> findByConditionsWithPagingObject(String conditions, Map<String, Object> params,
            Pageable pageable, Class<P> entityClass) {
        // TODO Auto-generated method stub
        String jpql = "SELECT e FROM " + getEntityName() + " e WHERE 1=1 " + conditions;
        TypedQuery<P> query = entityManager.createQuery(jpql, entityClass);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        query.setFirstResult(pageable.getPageNumber() * pageable.getPageSize());
        query.setMaxResults(pageable.getPageSize());

        List<P> results = query.getResultList();
        Long totalElements = this.countByConditions(conditions, params);
        return new PageImpl<P>(results, pageable, totalElements);
    }

    @Override
    public Page<T> findByConditionsWithPaging(String conditions, String clause, Map<String, Object> params,
            Pageable pageable) {
        String jpql = clause + conditions;
        TypedQuery<T> query = entityManager.createQuery(jpql, entityClass);

        if (params != null) {
            params.forEach(query::setParameter);
        }

        query.setFirstResult(pageable.getPageNumber() * pageable.getPageSize());
        query.setMaxResults(pageable.getPageSize());

        List<T> results = query.getResultList();

        // Build count query từ clause thay vì dùng pattern mặc định
        // Extract phần FROM ... WHERE từ clause để build count query
        String countJpql = buildCountQueryFromClause(clause, conditions);
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);

        if (params != null) {
            params.forEach(countQuery::setParameter);
        }

        Long totalElements = countQuery.getSingleResult();
        return new PageImpl<T>(results, pageable, totalElements);
    }

    /**
     * Build count query từ clause và conditions Ví dụ: "SELECT p FROM Patient p
     * WHERE 1 = 1 " -> "SELECT COUNT(p) FROM Patient p WHERE 1 = 1 "
     */
    private String buildCountQueryFromClause(String clause, String conditions) {
        // Count query không được chứa ORDER BY (JPQL không hợp lệ)
        String conditionsForCount = stripOrderByFromConditions(conditions);
        if (clause == null || clause.trim().isEmpty()) {
            // Fallback về pattern mặc định nếu clause rỗng
            return "SELECT COUNT(e) FROM " + getEntityName() + " e WHERE 1=1 " + conditionsForCount;
        }

        // Tìm vị trí của FROM và WHERE trong clause
        String upperClause = clause.toUpperCase().trim();
        int fromIndex = upperClause.indexOf("FROM");
        int whereIndex = upperClause.indexOf("WHERE");

        if (fromIndex == -1) {
            // Không tìm thấy FROM, fallback về pattern mặc định
            return "SELECT COUNT(e) FROM " + getEntityName() + " e WHERE 1=1 " + conditionsForCount;
        }

        // Với clause có subquery ở FROM (derived table), alias extraction dễ sai (ví dụ
        // lấy
        // "id" từ SELECT con) và gây lỗi COUNT(alias). Dùng COUNT(*) an toàn hơn.
        boolean hasDerivedTableInFrom = clause.substring(fromIndex).trim().toUpperCase().startsWith("FROM (");

        // Tìm alias từ clause (ví dụ: "SELECT p FROM" -> alias là "p")
        String alias = extractAliasFromClause(clause);
        if (alias == null || alias.isEmpty()) {
            // Không tìm thấy alias, dùng "e" mặc định
            alias = "e";
        }

        // Extract phần FROM ... (bao gồm cả JOIN nếu có) đến WHERE hoặc cuối
        String fromPart;
        if (whereIndex != -1) {
            // Có WHERE trong clause, lấy từ FROM đến WHERE
            fromPart = clause.substring(fromIndex, whereIndex).trim();
            // Lấy phần WHERE từ clause gốc
            String wherePart = clause.substring(whereIndex).trim();
            // Build count query (không có ORDER BY)
            if (hasDerivedTableInFrom) {
                return "SELECT COUNT(*) " + fromPart + " " + wherePart + conditionsForCount;
            }
            return "SELECT COUNT(" + alias + ") " + fromPart + " " + wherePart + conditionsForCount;
        } else {
            // Không có WHERE trong clause, lấy từ FROM đến cuối
            fromPart = clause.substring(fromIndex).trim();
            // Build count query (không có ORDER BY)
            if (hasDerivedTableInFrom) {
                return "SELECT COUNT(*) " + fromPart + " WHERE 1=1 " + conditionsForCount;
            }
            return "SELECT COUNT(" + alias + ") " + fromPart + " WHERE 1=1 " + conditionsForCount;
        }
    }

    /**
     * Bỏ phần ORDER BY trong conditions để dùng cho count query (COUNT không được
     * có ORDER BY).
     */
    private String stripOrderByFromConditions(String conditions) {
        if (conditions == null || conditions.isEmpty()) {
            return conditions;
        }
        int orderByIndex = conditions.toUpperCase().indexOf(" ORDER BY ");
        if (orderByIndex < 0) {
            return conditions;
        }
        return conditions.substring(0, orderByIndex).trim();
    }

    /**
     * Extract alias từ clause Ví dụ: "SELECT p FROM Patient p" -> "p" "SELECT
     * new Package.Class(...) FROM Entity e" -> "e" "SELECT p FROM Patient p
     * WHERE 1 = 1" -> "p"
     */
    private String extractAliasFromClause(String clause) {
        // if (clause == null || clause.trim().isEmpty()) {
        // return null;
        // }
        //
        // String upperClause = clause.toUpperCase().trim();
        // int fromIndex = upperClause.indexOf("FROM");
        // if (fromIndex == -1) {
        // return null;
        // }
        //
        // // Lấy phần sau FROM
        // String fromPart = clause.substring(fromIndex + 4).trim();
        // String upperFromPart = fromPart.toUpperCase();
        //
        // // Tìm JOIN, WHERE, ORDER BY, GROUP BY để dừng lại
        // // Chỉ lấy alias từ entity chính (phần đầu tiên), không phải từ JOIN
        // int joinIndex = upperFromPart.indexOf("JOIN");
        // int whereIndex = upperFromPart.indexOf("WHERE");
        // int orderIndex = upperFromPart.indexOf("ORDER BY");
        // int groupIndex = upperFromPart.indexOf("GROUP BY");
        //
        // // Tìm điểm kết thúc sớm nhất (ưu tiên JOIN để chỉ lấy entity chính)
        // int endIndex = fromPart.length();
        // if (joinIndex != -1 && joinIndex < endIndex) {
        // endIndex = joinIndex;
        // }
        // if (whereIndex != -1 && whereIndex < endIndex) {
        // endIndex = whereIndex;
        // }
        // if (orderIndex != -1 && orderIndex < endIndex) {
        // endIndex = orderIndex;
        // }
        // if (groupIndex != -1 && groupIndex < endIndex) {
        // endIndex = groupIndex;
        // }
        //
        // if (endIndex < fromPart.length()) {
        // fromPart = fromPart.substring(0, endIndex).trim();
        // }
        //
        // // Split by space và lấy phần cuối (alias)
        // // Ví dụ: "Patient p" -> ["Patient", "p"] -> "p"
        // String[] parts = fromPart.split("\\s+");
        // if (parts.length >= 2) {
        // // Entity name và alias (phần cuối cùng)
        // return parts[parts.length - 1];
        // } else if (parts.length == 1) {
        // // Chỉ có entity name, không có alias -> dùng entity name làm alias
        // return parts[0];
        // }
        //
        // return null;
        if (clause == null || clause.trim().isEmpty()) {
            return null;
        }

        String upperClause = clause.toUpperCase().trim();
        int fromIndex = upperClause.indexOf("FROM");
        if (fromIndex == -1) {
            return null;
        }

        // Lấy phần sau FROM
        String fromPart = clause.substring(fromIndex + 4).trim();

        // Dùng Regex để tách phần khai báo Entity đầu tiên ra khỏi phần còn lại
        // Regex này tìm:
        // 1. Dấu phẩy (,) -> Dành cho kiểu join cũ
        // 2. Các từ khóa JOIN, WHERE, ORDER BY, GROUP BY
        // Yêu cầu: Các từ khóa phải có khoảng trắng hoặc dấu ngoặc bao quanh (Word
        // Boundary)
        String[] segments = fromPart
                .split("\\s+(JOIN|WHERE|ORDER\\s+BY|GROUP\\s+BY|LEFT|RIGHT|INNER|CROSS|,)\\s+|\\s*,\\s*", 2);

        // segments[0] sẽ là "DeliveryNote dn" hoặc "DeliveryNote"
        String firstEntityDeclaration = segments[0].trim();

        // Tách Entity và Alias
        String[] parts = firstEntityDeclaration.split("\\s+");

        if (parts.length >= 2) {
            // Trường hợp: "DeliveryNote dn" -> Lấy "dn"
            return parts[parts.length - 1];
        } else if (parts.length == 1) {
            // Trường hợp: "DeliveryNote" -> Không có alias
            // Tốt nhất nên trả về "e" hoặc null để bên ngoài xử lý gán alias mặc định
            // Nhưng nếu muốn giữ logic cũ:
            return parts[0];
        }

        return "e"; // Fallback an toàn
    }

    @Override
    public <P> Page<P> findByConditionsWithPagingNative(
            String baseQuery,
            String conditions,
            Map<String, Object> params,
            Pageable pageable,
            Class<P> projectionClass) {

        // Build full query: baseQuery + WHERE 1=1 + conditions
        String fullQuery = baseQuery.trim();
        if (!fullQuery.toUpperCase().contains("WHERE")) {
            fullQuery += " WHERE 1=1";
        }
        fullQuery += " " + conditions;

        // Build count query: wrap full query trong subquery
        // Lưu ý: Với native query phức tạp, cần wrap trong subquery để COUNT
        // remove order by clause when count
        String countQueryStr = fullQuery;

        for (String key : params.keySet()) {
            Object value = params.get(key);
            // System.out.println("PARAM KEY: " + key);
            // System.out.println("PARAM VALUE: " + value);
            if (value instanceof List) {
                // System.out.println("PARAM VALUE IS LIST, SIZE: " + ((List<?>) value).size());
            }
        }
        String countQuery = countQueryStr.replaceAll("ORDER BY.*", "");
        countQuery = "SELECT COUNT(1) FROM (" + countQuery + ") as count_table";
        // Execute count query
        jakarta.persistence.Query countNativeQuery = entityManager.createNativeQuery(countQuery);
        if (params != null) {
            params.forEach((key, value) -> {
                if (value instanceof List) {
                    List<?> listValue = (List<?>) value;
                    // Đảm bảo set parameter ngay cả khi list rỗng
                    if (listValue.isEmpty()) {
                        // Với empty list, vẫn cần set parameter để tránh lỗi "No parameter named"
                        // Sử dụng một giá trị dummy để Hibernate nhận diện parameter
                        countNativeQuery.setParameter(key, listValue);
                    } else {
                        countNativeQuery.setParameter(key, listValue);
                    }
                } else {
                    countNativeQuery.setParameter(key, value);
                }
            });
        }
        Long total = ((Number) countNativeQuery.getSingleResult()).longValue();

        // Execute main query with pagination
        jakarta.persistence.Query nativeQuery = entityManager.createNativeQuery(fullQuery, projectionClass);
        if (params != null) {
            params.forEach((key, value) -> {
                if (value instanceof List) {
                    List<?> listValue = (List<?>) value;
                    // Đảm bảo set parameter ngay cả khi list rỗng
                    if (listValue.isEmpty()) {
                        // Với empty list, vẫn cần set parameter để tránh lỗi "No parameter named"
                        nativeQuery.setParameter(key, listValue);
                    } else {
                        nativeQuery.setParameter(key, listValue);
                    }
                } else {
                    nativeQuery.setParameter(key, value);
                }
            });
        }
        // System.out.println("NATIVEQUERY PARAMETERS: " + nativeQuery.getParameters());
        // Xử lý pagination: nếu pageable là Unpaged, không set pagination
        if (pageable != null && pageable.isPaged()) {
            nativeQuery.setFirstResult((int) pageable.getOffset());
            nativeQuery.setMaxResults(pageable.getPageSize());
        }
        // Nếu Unpaged, không set pagination -> lấy tất cả kết quả

        @SuppressWarnings("unchecked")
        List<P> results = nativeQuery.getResultList();
        return new PageImpl<>(results, pageable, total);
    }

    @Override
    public <P> List<P> findByConditionsNative(
            String baseQuery,
            String conditions,
            Map<String, Object> params,
            Class<P> projectionClass) {

        String fullQuery = baseQuery.trim();
        if (!fullQuery.toUpperCase().contains("WHERE")) {
            fullQuery += " WHERE 1=1";
        }
        fullQuery += " " + conditions;

        if (params != null) {
            for (String key : params.keySet()) {
                Object value = params.get(key);
                // System.out.println("PARAM KEY: " + key);
                // System.out.println("PARAM VALUE: " + value);
                if (value instanceof List) {
                    // System.out.println("PARAM VALUE IS LIST, SIZE: " + ((List<?>) value).size());
                }
            }
        }

        jakarta.persistence.Query nativeQuery = entityManager.createNativeQuery(fullQuery, projectionClass);
        if (params != null) {
            params.forEach((key, value) -> {
                if (value instanceof List) {
                    List<?> listValue = (List<?>) value;
                    if (listValue.isEmpty()) {
                        nativeQuery.setParameter(key, listValue);
                    } else {
                        nativeQuery.setParameter(key, listValue);
                    }
                } else {
                    nativeQuery.setParameter(key, value);
                }
            });
        }
        // System.out.println("NATIVEQUERY PARAMETERS: " + nativeQuery.getParameters());

        @SuppressWarnings("unchecked")
        List<P> results = nativeQuery.getResultList();
        return results;
    }

    @Override
    public <P> Page<P> findByConditionsWithPagingNativeCustomCount(
            String baseQuery,
            String conditions,
            String customCountSql,
            Map<String, Object> params,
            Pageable pageable,
            Class<P> projectionClass) {

        // Execute custom count query (chỉ set params có trong SQL để tránh lỗi)
        jakarta.persistence.Query countNativeQuery = entityManager.createNativeQuery(customCountSql);
        if (params != null) {
            params.forEach((key, value) -> {
                if (customCountSql.contains(":" + key)) {
                    if (value instanceof List) {
                        countNativeQuery.setParameter(key, (List<?>) value);
                    } else {
                        countNativeQuery.setParameter(key, value);
                    }
                }
            });
        }
        Long total = ((Number) countNativeQuery.getSingleResult()).longValue();

        // Execute data query
        String fullQuery = baseQuery.trim();
        if (!fullQuery.toUpperCase().contains("WHERE")) {
            fullQuery += " WHERE 1=1";
        }
        fullQuery += " " + conditions;

        jakarta.persistence.Query nativeQuery = entityManager.createNativeQuery(fullQuery, projectionClass);
        if (params != null) {
            params.forEach((key, value) -> {
                if (value instanceof List) {
                    nativeQuery.setParameter(key, (List<?>) value);
                } else {
                    nativeQuery.setParameter(key, value);
                }
            });
        }

        if (pageable != null && pageable.isPaged()) {
            nativeQuery.setFirstResult((int) pageable.getOffset());
            nativeQuery.setMaxResults(pageable.getPageSize());
        }

        @SuppressWarnings("unchecked")
        List<P> results = nativeQuery.getResultList();
        return new org.springframework.data.domain.PageImpl<>(results, pageable, total);
    }

    @Override
    public <P> P queryNativeSingleResult(String sql, Map<String, Object> params) {
        jakarta.persistence.Query nativeQuery = entityManager.createNativeQuery(sql);
        if (params != null) {
            params.forEach((key, value) -> {
                if (value instanceof List) {
                    nativeQuery.setParameter(key, (List<?>) value);
                } else {
                    nativeQuery.setParameter(key, value);
                }
            });
        }
        return (P) nativeQuery.getSingleResult();
    }
}
