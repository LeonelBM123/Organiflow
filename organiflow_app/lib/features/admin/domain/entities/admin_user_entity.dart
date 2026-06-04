import 'package:equatable/equatable.dart';

class AdminUserEntity extends Equatable {
  const AdminUserEntity({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    this.active = true,
  });

  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final bool active;

  @override
  List<Object?> get props => [id, name, email, avatarUrl, active];
}
