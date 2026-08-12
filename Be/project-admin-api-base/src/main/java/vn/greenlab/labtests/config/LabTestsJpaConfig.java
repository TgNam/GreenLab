package vn.greenlab.labtests.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "vn.greenlab.labtests.repository")
@EntityScan(basePackages = "vn.greenlab.labtests.entity")
public class LabTestsJpaConfig {
}
