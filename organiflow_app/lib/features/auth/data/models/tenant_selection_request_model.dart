class TenantSelectionRequestModel {
  const TenantSelectionRequestModel({
    required this.email,
    required this.tenantId,
  });

  final String email;
  final String tenantId;

  Map<String, dynamic> toJson() => {'email': email, 'tenantId': tenantId};
}
