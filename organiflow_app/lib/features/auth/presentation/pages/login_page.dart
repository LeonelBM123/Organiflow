import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app.dart';
import '../../../../design/components/feedback/of_snackbar.dart';
import '../../../../design/utils/component_decorations.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/loading_widget.dart';
import '../widgets/login_form.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthNeedsTenantSelection) {
          context.go(AppRouter.tenantSelection);
        }
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
      child: Scaffold(
        body: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFF4F7FB), Color(0xFFE7F0FF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Container(
                  padding: const EdgeInsets.all(28),
                  decoration: ComponentDecorations.panelDecoration(),
                  child: BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      if (state is AuthLoading) {
                        return const LoadingWidget(
                          message: 'Validando credenciales...',
                        );
                      }

                      return const Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Organiflow',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Gestiona tenants, usuarios y notificaciones desde una arquitectura limpia y preparada para backend real.',
                          ),
                          SizedBox(height: 28),
                          LoginForm(),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
