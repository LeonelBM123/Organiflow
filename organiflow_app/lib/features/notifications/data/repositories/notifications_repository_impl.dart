import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/notification_entity.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../datasources/notifications_local_datasource.dart';
import '../datasources/notifications_remote_datasource.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  NotificationsRepositoryImpl({
    required NotificationsRemoteDataSource remoteDataSource,
    required NotificationsLocalDataSource localDataSource,
  }) : _remoteDataSource = remoteDataSource,
       _localDataSource = localDataSource;

  final NotificationsRemoteDataSource _remoteDataSource;
  final NotificationsLocalDataSource _localDataSource;

  @override
  Future<Either<Failure, List<NotificationEntity>>> getNotifications() async {
    try {
      final notifications = await _remoteDataSource.getNotifications();
      await _localDataSource.cacheNotifications(notifications);
      return Right(notifications);
    } catch (_) {
      final cached = await _localDataSource.getCachedNotifications();
      if (cached.isNotEmpty) {
        return Right(cached);
      }
      return const Left(
        ServerFailure('No se pudieron cargar las notificaciones'),
      );
    }
  }

  @override
  Future<Either<Failure, Unit>> markAsRead(String id) async {
    await _remoteDataSource.markAsRead(id);
    return const Right(unit);
  }

  @override
  Future<Either<Failure, Unit>> sendPushToken(String token) async {
    await _remoteDataSource.sendPushToken(token);
    return const Right(unit);
  }
}
