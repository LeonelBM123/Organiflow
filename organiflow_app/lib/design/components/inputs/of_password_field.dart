import 'package:flutter/material.dart';

import 'of_text_field.dart';

class OFPasswordField extends StatefulWidget {
  const OFPasswordField({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.controller,
    this.enabled = true,
    this.onChanged,
    this.onSubmitted,
  });

  final String? label;
  final String? hint;
  final String? errorText;
  final TextEditingController? controller;
  final bool enabled;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onSubmitted;

  @override
  State<OFPasswordField> createState() => _OFPasswordFieldState();
}

class _OFPasswordFieldState extends State<OFPasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return OFTextField(
      label: widget.label,
      hint: widget.hint,
      errorText: widget.errorText,
      controller: widget.controller,
      enabled: widget.enabled,
      onChanged: widget.onChanged,
      obscureText: _obscure,
      suffixIcon: IconButton(
        onPressed: () => setState(() => _obscure = !_obscure),
        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
      ),
    );
  }
}
