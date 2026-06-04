import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/notifications_repository.dart';

class SendPushTokenUseCase {
  const SendPushTokenUseCase(this.repository);

  final NotificationsRepository repository;

  Future<Either<Failure, Unit>> call(String token) {
    return repository.sendPushToken(token);
  }
}
