import 'package:equatable/equatable.dart';

import 'form_field_entity.dart';

class FormSchemaEntity extends Equatable {
  const FormSchemaEntity({required this.name, required this.fields});

  final String name;
  final List<FormFieldEntity> fields;

  @override
  List<Object?> get props => [name, fields];
}
