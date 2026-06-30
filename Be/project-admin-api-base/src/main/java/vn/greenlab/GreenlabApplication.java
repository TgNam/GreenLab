package vn.greenlab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import vn.greenlab.repository.impl.BaseRepositoryImpl;

import java.util.TimeZone;

@SpringBootApplication
@EnableJpaRepositories(
    basePackages = "vn.greenlab.repository",
    repositoryBaseClass = BaseRepositoryImpl.class
)
public class GreenlabApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		SpringApplication.run(GreenlabApplication.class, args);
	}

}
