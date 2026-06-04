import 'package:equatable/equatable.dart';

class DepartmentEntity extends Equatable {
  const DepartmentEntity({
    required this.id,
    required this.name,
    this.description,
    this.headUserId,
    this.memberUserIds = const [],
    this.active = true,
  });

  final String id;
  final String name;
  final String? description;
  final String? headUserId;
  final List<String> memberUserIds;
  final bool active;

  @override
  List<Object?> get props => [
    id,
    name,
    description,
    headUserId,
    memberUserIds,
    active,
  ];
}
