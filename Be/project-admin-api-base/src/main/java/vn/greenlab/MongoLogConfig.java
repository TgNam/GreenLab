package vn.greenlab;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

@Configuration
public class MongoLogConfig {

    @Value("${spring.data.mongodb.uri}")
    private String logMongoUri;

    @Bean(name = "historyMongoTemplate")
    public MongoTemplate historyMongoTemplate() {
        return new MongoTemplate(new SimpleMongoClientDatabaseFactory(logMongoUri));
    }
}
