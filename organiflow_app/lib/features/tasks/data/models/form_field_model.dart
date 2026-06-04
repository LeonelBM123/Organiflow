import '../../domain/entities/form_field_entity.dart';

class FormFieldModel extends FormFieldEntity {
  const FormFieldModel({
    required super.name,
    required super.label,
    required super.type,
    required super.required,
    super.options,
  });

  factory FormFieldModel.fromJson(Map<String, dynamic> json) {
    return FormFieldModel(
      name: json['name'] as String? ?? '',
      label: json['label'] as String? ?? '',
      type: json['type'] as String? ?? 'text',
      required: json['required'] as bool? ?? false,
      options: (json['options'] as List<dynamic>? ?? const [])
          .map((item) => item as String)
          .toList(),
    );
  }
}
