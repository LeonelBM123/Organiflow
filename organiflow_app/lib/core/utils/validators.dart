class Validators {
  static String? requiredField(String? value, {String fieldName = 'Campo'}) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName es obligatorio';
    }
    return null;
  }

  static String? email(String? value) {
    final requiredMessage = requiredField(value, fieldName: 'Correo');
    if (requiredMessage != null) {
      return requiredMessage;
    }

    final regex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
    if (!regex.hasMatch(value!.trim())) {
      return 'Correo invalido';
    }

    return null;
  }

  static String? password(String? value) {
    final requiredMessage = requiredField(value, fieldName: 'Contrasena');
    if (requiredMessage != null) {
      return requiredMessage;
    }
    if (value!.length < 6) {
      return 'Minimo 6 caracteres';
    }
    return null;
  }
}
