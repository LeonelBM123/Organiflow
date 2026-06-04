import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/task_model.dart';

abstract class TasksRemoteDataSource {
  Future<List<TaskModel>> getMyTasks();
  Future<TaskModel> startTask(String id);
  Future<TaskModel> completeTask(String id, Map<String, dynamic> formData);
  Future<TaskModel> escalateTask(String id);
}

class TasksRemoteDataSourceImpl implements TasksRemoteDataSource {
  TasksRemoteDataSourceImpl({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<TaskModel> completeTask(
    String id,
    Map<String, dynamic> formData,
  ) async {
    final response = await _apiClient.post(
      '${ApiConstants.tasks}/$id/complete',
      data: {'formData': formData},
    );
    return TaskModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<TaskModel> escalateTask(String id) async {
    final response = await _apiClient.post(
      '${ApiConstants.tasks}/$id/escalate',
    );
    return TaskModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<List<TaskModel>> getMyTasks() async {
    final response = await _apiClient.get(ApiConstants.tasks);
    final data = response.data as List<dynamic>;
    return data
        .map((item) => TaskModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<TaskModel> startTask(String id) async {
    final response = await _apiClient.post('${ApiConstants.tasks}/$id/start');
    return TaskModel.fromJson(response.data as Map<String, dynamic>);
  }
}
