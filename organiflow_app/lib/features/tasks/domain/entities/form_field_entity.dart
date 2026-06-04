import 'package:equatable/equatable.dart';

class FormFieldEntity extends Equatable {
  const FormFieldEntity({
    required this.name,
    required this.label,
    required this.type,
    required this.required,
    this.options = const [],
  });

  final String name;
  final String label;
  final String type;
  final bool required;
  final List<String> options;

  @override
  List<Object?> get props => [name, label, type, required, options];
}
