import '../../domain/entities/user_entity.dart';
import 'tenant_model.dart';

class LoginResponseModel {
  const LoginResponseModel({
    required this.user,
    required this.tenants,
    required this.accessToken,
    required this.refreshToken,
    this.role,
    this.tenantId,
  });

  final UserEntity user;
  final List<TenantModel> tenants;
  final String accessToken;
  final String refreshToken;
  final String? role;
  final String? tenantId;

  factory LoginResponseModel.fromJson(Map<String, dynamic> json) {
    return LoginResponseModel(
      user: UserEntity(
        id: (json['email'] ?? 'unknown-user') as String,
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
      ),
      tenants: ((json['tenants'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => TenantModel.fromJson(item as Map<String, dynamic>))
          .toList()),
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      role: json['role'] as String?,
      tenantId: json['tenantId'] as String?,
    );
  }
}
