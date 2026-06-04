import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/notifications_repository.dart';

class MarkNotificationReadUseCase {
  const MarkNotificationReadUseCase(this.repository);

  final NotificationsRepository repository;

  Future<Either<Failure, Unit>> call(String id) {
    return repository.markAsRead(id);
  }
}
