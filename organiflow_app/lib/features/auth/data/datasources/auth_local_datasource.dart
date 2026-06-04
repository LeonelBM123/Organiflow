import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/constants/storage_keys.dart';

abstract class AuthLocalDataSource {
  Future<void> cacheSession({
    required String accessToken,
    required String refreshToken,
    required String userName,
    required String userEmail,
  });
  Future<void> cacheSelectedTenant({
    required String tenantId,
    required String tenantName,
    required String role,
  });
  Future<String?> getAccessToken();
  Future<String?> getRefreshToken();
  Future<String?> getTenantId();
  Future<String?> getTenantName();
  Future<String?> getUserRole();
  Future<String?> getUserName();
  Future<String?> getUserEmail();
  Future<void> clearAll();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  AuthLocalDataSourceImpl({
    required FlutterSecureStorage secureStorage,
    required SharedPreferences sharedPreferences,
  }) : _secureStorage = secureStorage,
       _sharedPreferences = sharedPreferences;

  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _sharedPreferences;

  @override
  Future<void> cacheSession({
    required String accessToken,
    required String refreshToken,
    required String userName,
    required String userEmail,
  }) async {
    await _secureStorage.write(
      key: StorageKeys.accessToken,
      value: accessToken,
    );
    await _secureStorage.write(
      key: StorageKeys.refreshToken,
      value: refreshToken,
    );
    await _sharedPreferences.setString(StorageKeys.userName, userName);
    await _sharedPreferences.setString(StorageKeys.userEmail, userEmail);
  }

  @override
  Future<void> cacheSelectedTenant({
    required String tenantId,
    required String tenantName,
    required String role,
  }) async {
    await _sharedPreferences.setString(StorageKeys.tenantId, tenantId);
    await _sharedPreferences.setString(StorageKeys.tenantName, tenantName);
    await _sharedPreferences.setString(StorageKeys.userRole, role);
  }

  @override
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _sharedPreferences.clear();
  }

  @override
  Future<String?> getAccessToken() =>
      _secureStorage.read(key: StorageKeys.accessToken);

  @override
  Future<String?> getRefreshToken() =>
      _secureStorage.read(key: StorageKeys.refreshToken);

  @override
  Future<String?> getTenantId() async =>
      _sharedPreferences.getString(StorageKeys.tenantId);

  @override
  Future<String?> getTenantName() async =>
      _sharedPreferences.getString(StorageKeys.tenantName);

  @override
  Future<String?> getUserEmail() async =>
      _sharedPreferences.getString(StorageKeys.userEmail);

  @override
  Future<String?> getUserName() async =>
      _sharedPreferences.getString(StorageKeys.userName);

  @override
  Future<String?> getUserRole() async =>
      _sharedPreferences.getString(StorageKeys.userRole);
}
