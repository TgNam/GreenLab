package vn.greenlab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import vn.greenlab.repository.impl.BaseRepositoryImpl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.TimeZone;

@SpringBootApplication
@EnableJpaRepositories(
    basePackages = "vn.greenlab.repository",
    repositoryBaseClass = BaseRepositoryImpl.class
)
public class GreenlabApplication {

    private static void loadEnvFile() {
        Path envPath = Paths.get(System.getProperty("user.dir"), "..", ".env");
        if (Files.exists(envPath)) {
            try {
                Files.lines(envPath)
                    .filter(line -> line.contains("=") && !line.trim().startsWith("#"))
                    .forEach(line -> {
                        String[] parts = line.split("=", 2);
                        if (parts.length == 2) {
                            String key = parts[0].trim();
                            String value = parts[1].trim();
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    });
                System.out.println("Loaded .env file from: " + envPath.toAbsolutePath());
            } catch (IOException e) {
                System.err.println("Failed to load .env file: " + e.getMessage());
            }
        }
    }

    public static void main(String[] args) {
        loadEnvFile();
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SpringApplication.run(GreenlabApplication.class, args);
    }

}
