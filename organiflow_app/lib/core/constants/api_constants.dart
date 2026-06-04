import 'app_constants.dart';

class ApiConstants {
  // Keep the host at the domain root because request paths already include
  // the API prefix/version (for example, "/api/v1/auth").
  static String get baseUrl => 'https://rganiflow-sw1.duckdns.org';

  static const auth = '${AppConstants.apiVersion}/auth';
  static const notifications = '/api/notifications';
  static const deviceRegistration = '${AppConstants.apiVersion}/users/devices';
  static const workflows = '${AppConstants.apiVersion}/workflows';
  static const executions = '${AppConstants.apiVersion}/executions';
  static const tasks = '${AppConstants.apiVersion}/tasks';
  static const departments = '${AppConstants.apiVersion}/departments';
  static const users = '${AppConstants.apiVersion}/users';
}
