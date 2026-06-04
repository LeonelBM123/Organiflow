class ApiResponse<T> {
  const ApiResponse({required this.data, this.message, this.success = true});

  final T data;
  final String? message;
  final bool success;
}
