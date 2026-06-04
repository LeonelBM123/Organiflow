import '../../domain/entities/auth_tokens_entity.dart';

class AuthResponseModel extends AuthTokensEntity {
  const AuthResponseModel({
    required super.accessToken,
    required super.refreshToken,
    required this.email,
    required this.name,
    required this.role,
    required this.tenantId,
  });

  final String email;
  final String name;
  final String role;
  final String tenantId;

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      tenantId: json['tenantId'] as String,
    );
  }
}
