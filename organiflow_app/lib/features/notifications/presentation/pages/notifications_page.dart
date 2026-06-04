import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../bloc/notifications_bloc.dart';
import '../widgets/notification_item.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationsBloc>().add(NotificationsRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const OFAppBar(title: 'Notificaciones', showBackButton: true),
      body: BlocBuilder<NotificationsBloc, NotificationsState>(
        builder: (context, state) {
          if (state is NotificationsLoading || state is NotificationsInitial) {
            return const LoadingWidget(message: 'Cargando notificaciones...');
          }

          if (state is NotificationsError) {
            return OFEmptyState(
              title: 'No se pudieron cargar',
              description: state.message,
            );
          }

          if (state is NotificationsLoaded) {
            if (state.notifications.isEmpty) {
              return const OFEmptyState(
                title: 'Sin notificaciones',
                description:
                    'Cuando lleguen eventos del sistema apareceran aqui.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: state.notifications.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final notification = state.notifications[index];
                return NotificationItem(
                  notification: notification,
                  onTap: () => context.read<NotificationsBloc>().add(
                    NotificationReadRequested(notification.id),
                  ),
                );
              },
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
