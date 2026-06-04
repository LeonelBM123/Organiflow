import '../../domain/entities/department_entity.dart';

class DepartmentModel extends DepartmentEntity {
  const DepartmentModel({
    required super.id,
    required super.name,
    super.description,
    super.headUserId,
    super.memberUserIds,
    super.active,
  });

  factory DepartmentModel.fromJson(Map<String, dynamic> json) {
    return DepartmentModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      headUserId: json['headUserId'] as String?,
      memberUserIds: (json['memberUserIds'] as List<dynamic>? ?? const [])
          .map((item) => item as String)
          .toList(),
      active: json['active'] as bool? ?? true,
    );
  }
}
