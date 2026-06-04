import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/buttons/of_button.dart';
import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../../design/components/inputs/of_text_field.dart';
import '../bloc/tasks_bloc.dart';

class TaskFormPage extends StatefulWidget {
  const TaskFormPage({super.key, required this.taskId});

  final String taskId;

  @override
  State<TaskFormPage> createState() => _TaskFormPageState();
}

class _TaskFormPageState extends State<TaskFormPage> {
  final Map<String, TextEditingController> _controllers = {};

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const OFAppBar(title: 'Formulario', showBackButton: true),
      body: BlocBuilder<TasksBloc, TasksState>(
        builder: (context, state) {
          final task = state.tasks
              .where((item) => item.id == widget.taskId)
              .firstOrNull;
          if (task == null) {
            return const OFEmptyState(
              title: 'Tarea no encontrada',
              description: 'Vuelve a la lista y recarga tus formularios.',
            );
          }
          final schema = task.formSchema;
          if (schema == null || schema.fields.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Esta tarea no tiene un formulario definido.'),
                    const SizedBox(height: 16),
                    OFButton(
                      label: 'Completar tarea',
                      isLoading: state.isSubmitting,
                      onPressed: () => context.read<TasksBloc>().add(
                        TaskCompleted(id: task.id, formData: const {}),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          for (final field in schema.fields) {
            _controllers.putIfAbsent(
              field.name,
              () => TextEditingController(
                text: task.formData?[field.name]?.toString() ?? '',
              ),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                schema.name,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(task.nodeName),
              const SizedBox(height: 24),
              ...schema.fields.map(
                (field) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: OFTextField(
                    label: field.label,
                    hint: field.required ? 'Obligatorio' : 'Opcional',
                    controller: _controllers[field.name],
                    maxLines: field.type == 'textarea' ? 4 : 1,
                  ),
                ),
              ),
              OFButton(
                label: 'Enviar formulario',
                isLoading: state.isSubmitting,
                onPressed: () {
                  final formData = <String, dynamic>{
                    for (final field in schema.fields)
                      field.name: _controllers[field.name]?.text ?? '',
                  };
                  context.read<TasksBloc>().add(
                    TaskCompleted(id: task.id, formData: formData),
                  );
                  Navigator.of(context).maybePop();
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
