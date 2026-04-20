package com.sw.organiflow.modules.department.models;

import com.sw.organiflow.shared.audit.AuditDocument;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "departments")
@CompoundIndexes({
        @CompoundIndex(name = "idx_department_tenant",
                def = "{'tenant_id': 1, '_id': 1}"),
        @CompoundIndex(name = "idx_department_tenant_name",
                def = "{'tenant_id': 1, 'name': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Department extends AuditDocument {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("name")
    private String name;

    @Field("description")
    private String description;

    @Field("head_user_id")
    private String headUserId;

    @Field("member_user_ids")
    @Builder.Default
    private List<String> memberUserIds = new ArrayList<>();

    @Field("is_active")
    @Builder.Default
    private boolean isActive = true;
}
