package vn.greenlab.model.output;

import lombok.*;
import vn.greenlab.model.enums.ErrorCode;

import java.io.Serializable;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Response<T> implements Serializable {
    private boolean success;
    private ErrorCode code;
    private String message;
    private T data;

    public Response(boolean success, ErrorCode code, String message) {
        this.success = success;
        this.code = code;
        this.message = message;
    }

    public Response(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public Response(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}

