import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app.dart';
import '../../../../design/components/buttons/of_button.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../../design/components/feedback/of_snackbar.dart';
import '../../domain/entities/tenant_entity.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/tenant_card.dart';

class TenantSelectionPage extends StatefulWidget {
  const TenantSelectionPage({super.key});

  @override
  State<TenantSelectionPage> createState() => _TenantSelectionPageState();
}

class _TenantSelectionPageState extends State<TenantSelectionPage> {
  TenantEntity? _selected;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          context.go(AppRouter.home);
        }
        if (state is AuthError) {
          OFSnackbar.show(
            context,
            message: state.message,
            type: OFSnackbarType.error,
          );
        }
      },
      builder: (context, state) {
        if (state is! AuthNeedsTenantSelection && state is! AuthLoading) {
          return const Scaffold(
            body: Center(child: Text('No hay tenants disponibles')),
          );
        }

        final tenants = state is AuthNeedsTenantSelection
            ? state.tenants
            : const <TenantEntity>[];

        return Scaffold(
          appBar: const OFAppBar(title: 'Selecciona un tenant'),
          body: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Elige el espacio de trabajo que quieres administrar en esta sesion.',
                ),
                const SizedBox(height: 24),
                Expanded(
                  child: ListView.separated(
                    itemCount: tenants.length,
                    separatorBuilder: (_, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final tenant = tenants[index];
                      return TenantCard(
                        tenant: tenant,
                        selected: _selected?.id == tenant.id,
                        onTap: () => setState(() => _selected = tenant),
                      );
                    },
                  ),
                ),
                OFButton(
                  label: 'Entrar al tenant',
                  isLoading: state is AuthLoading,
                  onPressed: _selected == null
                      ? null
                      : () => context.read<AuthBloc>().add(
                          TenantSelected(_selected!),
                        ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
