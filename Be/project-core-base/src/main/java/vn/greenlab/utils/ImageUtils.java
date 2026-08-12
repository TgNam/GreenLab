package vn.greenlab.utils;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.io.IOUtils;
import org.springframework.core.io.ClassPathResource;

public class ImageUtils {

    public static final Map<String, String> IMAGE_CACHE = new ConcurrentHashMap<>();

    public static String getBase64ImageWithCache(String path) {
        return IMAGE_CACHE.computeIfAbsent(path, p -> {
            try {
                return getResourceImageAsBase64(p);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }

    public static String getResourceImageAsBase64(String path) throws IOException {
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            throw new RuntimeException("Image not found: " + path);
        }
        try(InputStream inputStream = resource.getInputStream()) {
            byte[] imageBytes = IOUtils.toByteArray(inputStream);
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String mimeType = URLConnection.guessContentTypeFromName(path);
            if (mimeType == null) mimeType = "image/png";

            return "data:" + mimeType + ";base64," + base64Image;
        }
    }

    public static void clearImageCache() {
        IMAGE_CACHE.clear();
    }
}
