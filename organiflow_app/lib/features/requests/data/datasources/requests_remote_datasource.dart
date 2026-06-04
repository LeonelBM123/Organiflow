import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/execution_summary_model.dart';
import '../models/workflow_summary_model.dart';

abstract class RequestsRemoteDataSource {
  Future<List<ExecutionSummaryModel>> getMyExecutions();
  Future<List<WorkflowSummaryModel>> getPublishedWorkflows();
  Future<void> startExecution(String workflowId);
}

class RequestsRemoteDataSourceImpl implements RequestsRemoteDataSource {
  RequestsRemoteDataSourceImpl({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<List<ExecutionSummaryModel>> getMyExecutions() async {
    final response = await _apiClient.get('${ApiConstants.executions}/my');
    final data = response.data as List<dynamic>;
    return data
        .map(
          (item) =>
              ExecutionSummaryModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<List<WorkflowSummaryModel>> getPublishedWorkflows() async {
    final response = await _apiClient.get(
      '${ApiConstants.workflows}/published',
    );
    final data = response.data as List<dynamic>;
    return data
        .map(
          (item) => WorkflowSummaryModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<void> startExecution(String workflowId) async {
    await _apiClient.post(
      ApiConstants.executions,
      data: {'workflowId': workflowId},
    );
  }
}
