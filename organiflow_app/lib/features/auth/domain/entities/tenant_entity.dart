import 'package:equatable/equatable.dart';

class TenantEntity extends Equatable {
  const TenantEntity({
    required this.id,
    required this.name,
    required this.role,
  });

  final String id;
  final String name;
  final String role;

  @override
  List<Object?> get props => [id, name, role];
}
