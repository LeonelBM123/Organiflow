import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import '../provider/auth_controller.dart';

// 1. Cambiamos de ConsumerWidget a ConsumerStatefulWidget
// Esto nos permite manejar la memoria de los campos de texto correctamente.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar Sesión')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            ShadInput(
              controller: _emailController, // Conectamos el controlador
              placeholder: const Text('Tu correo electrónico'),
              keyboardType:
                  TextInputType.emailAddress, // Muestra el teclado con el "@"
            ),
            const SizedBox(height: 16),
            ShadInput(
              controller: _passwordController, // Conectamos el controlador
              placeholder: const Text('Contraseña'),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            ShadButton(
              width: double.infinity,
              onPressed: authState.isLoading
                  ? null
                  : () async {
                      // Opcional: Validación rápida para evitar peticiones vacías al servidor
                      if (_emailController.text.isEmpty ||
                          _passwordController.text.isEmpty) {
                        ShadToaster.of(context).show(
                          const ShadToast.destructive(
                            title: Text('Campos vacíos'),
                            description: Text(
                              'Por favor, ingresa tu correo y contraseña.',
                            ),
                          ),
                        );
                        return; // Detenemos la ejecución aquí
                      }

                      // 4. Enviamos los datos reales capturados al Provider
                      final success = await ref
                          .read(authControllerProvider.notifier)
                          .login(
                            _emailController.text
                                .trim(), // trim() borra espacios en blanco por error
                            _passwordController.text,
                          );

                      // Regla de Flutter: siempre verificar si la pantalla sigue existiendo después de un 'await'
                      if (!context.mounted) return;

                      // 5. Los famosos "Breads" (Toasts)
                      if (success) {
                        // Toast de éxito inicial
                        ShadToaster.of(context).show(
                          const ShadToast(
                            title: Text('¡Autenticado!'),
                            description: Text('Validando organizaciones...'),
                          ),
                        );

                        // Rescatamos la información del usuario del estado (asumiendo que la guardas ahí)
                        // Ajusta esto dependiendo de cómo estructuraste el estado en tu authControllerProvider
                        final userTenants = ref
                            .read(authControllerProvider.notifier)
                            .currentUserTenants;
                        if (userTenants == null || userTenants.isEmpty) {
                          // Caso borde (no debería pasar por tu corrección en backend, pero mejor prevenir)
                          ShadToaster.of(context).show(
                            const ShadToast.destructive(
                              title: Text('Error de acceso'),
                              description: Text(
                                'No perteneces a ninguna organización.',
                              ),
                            ),
                          );
                        } else if (userTenants.length == 1) {
                          // Caso A: Solo pertenece a una empresa.
                          // El backend ya debería haber devuelto el JWT final en este caso.
                          context.go('/home');
                        } else {
                          // Caso B: Pertenece a múltiples empresas.
                          // Necesita ir a la pantalla de selección de Tenant.
                          // Pasamos la lista de empresas como parámetro (o la pantalla la lee del provider)
                          context.go('/select-tenant');
                        }
                      } else {
                        // Rescatamos el mensaje de error exacto del estado de Riverpod
                        final errorMensaje =
                            ref
                                .read(authControllerProvider)
                                .error
                                ?.toString() ??
                            'Credenciales incorrectas.';

                        ShadToaster.of(context).show(
                          ShadToast.destructive(
                            title: const Text('Error de Autenticación'),
                            description: Text(errorMensaje),
                          ),
                        );
                      }
                    },
              child: authState.isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Entrar'),
            ),
          ],
        ),
      ),
    );
  }
}
