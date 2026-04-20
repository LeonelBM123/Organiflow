package com.sw.organiflow.config;

import com.sw.organiflow.modules.collaboration.document.DiagramSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.sw.organiflow")
public class MongoConfig {

    @Autowired
    void configureDiagramSessionIndexes(MongoTemplate mongoTemplate) {
        mongoTemplate.indexOps(DiagramSession.class)
                .ensureIndex(new Index()
                        .on("last_seen", Sort.Direction.ASC)
                        .expire(30, TimeUnit.SECONDS)
                        .named("idx_diagram_sessions_ttl"));

        mongoTemplate.indexOps(DiagramSession.class)
                .ensureIndex(new Index()
                        .on("tenant_id", Sort.Direction.ASC)
                        .on("workflow_id", Sort.Direction.ASC)
                        .named("idx_diagram_sessions_workflow"));
    }
}
