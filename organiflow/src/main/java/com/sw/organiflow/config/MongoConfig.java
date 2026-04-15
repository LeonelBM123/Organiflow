package com.sw.organiflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoAuditing  // activa created_at y updated_at automáticos
@EnableMongoRepositories(basePackages = "com.sw.organiflow")

public class MongoConfig {
}