class LoginResponse {
  final String? email;
  final String? name;
  final List<TenantInfo>? tenants;
  final String? accessToken;
  final String? refreshToken;
  final String? role;
  final String? tenantId;

  LoginResponse({
    this.email,
    this.name,
    this.tenants,
    this.accessToken,
    this.refreshToken,
    this.role,
    this.tenantId,
  });

  // Constructor factory para construir el objeto a partir del JSON del backend
  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      email: json['email'] as String?,
      name: json['name'] as String?,
      // Mapeamos la lista de tenants si existe, de lo contrario devuelve null
      tenants: (json['tenants'] as List<dynamic>?)
          ?.map((e) => TenantInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
      accessToken: json['accessToken'] as String?,
      refreshToken: json['refreshToken'] as String?,
      role: json['role'] as String?,
      tenantId: json['tenantId'] as String?,
    );
  }

  // Método opcional por si necesitas convertir el objeto de vuelta a JSON
  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'name': name,
      'tenants': tenants?.map((e) => e.toJson()).toList(),
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'role': role,
      'tenantId': tenantId,
    };
  }
}

// Sub-clase para manejar la información de cada organización
class TenantInfo {
  final String tenantId;
  final String tenantName;
  final String role;

  TenantInfo({
    required this.tenantId,
    required this.tenantName,
    required this.role,
  });

  factory TenantInfo.fromJson(Map<String, dynamic> json) {
    return TenantInfo(
      // Usamos el operador ?? '' por seguridad, en caso de que un valor venga nulo por error
      tenantId: json['tenantId'] ?? '',
      tenantName: json['tenantName'] ?? '',
      role: json['role'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'tenantId': tenantId, 'tenantName': tenantName, 'role': role};
  }
}
