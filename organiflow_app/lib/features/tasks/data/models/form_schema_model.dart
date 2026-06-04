import '../../domain/entities/form_schema_entity.dart';
import 'form_field_model.dart';

class FormSchemaModel extends FormSchemaEntity {
  const FormSchemaModel({required super.name, required super.fields});

  factory FormSchemaModel.fromJson(Map<String, dynamic> json) {
    return FormSchemaModel(
      name: json['name'] as String? ?? 'Formulario',
      fields: (json['fields'] as List<dynamic>? ?? const [])
          .map((item) => FormFieldModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
