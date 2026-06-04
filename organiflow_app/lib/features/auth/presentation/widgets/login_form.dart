import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/utils/validators.dart';
import '../../../../design/components/buttons/of_button.dart';
import '../../../../design/components/inputs/of_password_field.dart';
import '../../../../design/components/inputs/of_text_field.dart';
import '../bloc/auth_bloc.dart';

class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _emailController = TextEditingController(text: 'paula@organiflow.com');
  final _passwordController = TextEditingController(text: '123456');
  String? _emailError;
  String? _passwordError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() {
      _emailError = Validators.email(_emailController.text);
      _passwordError = Validators.password(_passwordController.text);
    });

    if (_emailError != null || _passwordError != null) {
      return;
    }

    context.read<AuthBloc>().add(
      LoginSubmitted(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        OFTextField(
          label: 'Correo',
          hint: 'tu@empresa.com',
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          errorText: _emailError,
        ),
        const SizedBox(height: 16),
        OFPasswordField(
          label: 'Contrasena',
          hint: 'Ingresa tu contrasena',
          controller: _passwordController,
          errorText: _passwordError,
        ),
        const SizedBox(height: 24),
        BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            return OFButton(
              label: 'Continuar',
              isLoading: state is AuthLoading,
              onPressed: _submit,
            );
          },
        ),
      ],
    );
  }
}
