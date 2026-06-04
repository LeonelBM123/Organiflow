import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../requests/data/models/workflow_summary_model.dart';
import '../models/admin_user_model.dart';
import '../models/department_model.dart';

abstract class AdminRemoteDataSource {
  Future<List<WorkflowSummaryModel>> getWorkflows();
  Future<void> publishWorkflow(String id, {String changelog = ''});
  Future<void> archiveWorkflow(String id);
  Future<void> revertWorkflowToDraft(String id);
  Future<List<DepartmentModel>> getDepartments();
  Future<List<AdminUserModel>> getUsers();
  Future<DepartmentModel> addDepartmentMember(
    String departmentId,
    String userId,
  );
  Future<DepartmentModel> removeDepartmentMember(
    String departmentId,
    String userId,
  );
}

class AdminRemoteDataSourceImpl implements AdminRemoteDataSource {
  AdminRemoteDataSourceImpl({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<void> archiveWorkflow(String id) async {
    await _apiClient.post('${ApiConstants.workflows}/$id/archive');
  }

  @override
  Future<DepartmentModel> addDepartmentMember(
    String departmentId,
    String userId,
  ) async {
    final response = await _apiClient.post(
      '${ApiConstants.departments}/$departmentId/members',
      data: {'userId': userId},
    );
    return DepartmentModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<List<DepartmentModel>> getDepartments() async {
    final response = await _apiClient.get(ApiConstants.departments);
    final data = response.data as List<dynamic>;
    return data
        .map((item) => DepartmentModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<AdminUserModel>> getUsers() async {
    final response = await _apiClient.get(ApiConstants.users);
    final data = response.data as List<dynamic>;
    return data
        .map((item) => AdminUserModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<WorkflowSummaryModel>> getWorkflows() async {
    final response = await _apiClient.get(ApiConstants.workflows);
    final data = response.data as List<dynamic>;
    return data
        .map(
          (item) => WorkflowSummaryModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<void> publishWorkflow(String id, {String changelog = ''}) async {
    await _apiClient.post(
      '${ApiConstants.workflows}/$id/publish',
      data: {'changelog': changelog},
    );
  }

  @override
  Future<DepartmentModel> removeDepartmentMember(
    String departmentId,
    String userId,
  ) async {
    final response = await _apiClient.delete(
      '${ApiConstants.departments}/$departmentId/members/$userId',
    );
    return DepartmentModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> revertWorkflowToDraft(String id) async {
    await _apiClient.post('${ApiConstants.workflows}/$id/draft');
  }
}
