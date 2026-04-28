import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/auth_repository.dart';
import '../../data/models/login_response.dart';

part 'auth_controller.g.dart';

@riverpod
class AuthController extends _$AuthController {
  LoginResponse? _loginResponse;

  @override
  FutureOr<void> build() {}

  List<TenantInfo>? get currentUserTenants => _loginResponse?.tenants;

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      _loginResponse = await ref.read(authRepositoryProvider).login(email, password);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}
