package vn.greenlab.model.output;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomPageResponse<T> {
    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int size;
}
