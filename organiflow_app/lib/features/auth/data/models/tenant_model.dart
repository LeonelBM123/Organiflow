import '../../domain/entities/tenant_entity.dart';

class TenantModel extends TenantEntity {
  const TenantModel({
    required super.id,
    required super.name,
    required super.role,
  });

  factory TenantModel.fromJson(Map<String, dynamic> json) {
    return TenantModel(
      id: (json['id'] ?? json['tenantId']) as String,
      name: (json['name'] ?? json['tenantName']) as String,
      role: json['role'] as String,
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'role': role};
}
