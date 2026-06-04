import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/admin_repository.dart';

class RevertWorkflowToDraftUseCase {
  const RevertWorkflowToDraftUseCase(this.repository);

  final AdminRepository repository;

  Future<Either<Failure, Unit>> call(String id) {
    return repository.revertWorkflowToDraft(id);
  }
}
