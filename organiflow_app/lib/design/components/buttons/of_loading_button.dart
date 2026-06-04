import 'package:flutter/material.dart';

import 'of_button.dart';

class OFLoadingButton extends StatefulWidget {
  const OFLoadingButton({
    super.key,
    required this.label,
    this.onPressed,
    this.onPressedAsync,
    this.variant = OFButtonVariant.primary,
    this.size = OFButtonSize.md,
    this.leftIcon,
  });

  final String label;
  final VoidCallback? onPressed;
  final Future<void> Function()? onPressedAsync;
  final OFButtonVariant variant;
  final OFButtonSize size;
  final Widget? leftIcon;

  @override
  State<OFLoadingButton> createState() => _OFLoadingButtonState();
}

class _OFLoadingButtonState extends State<OFLoadingButton> {
  bool _isLoading = false;

  Future<void> _handlePressed() async {
    if (_isLoading) return;
    if (widget.onPressedAsync != null) {
      setState(() => _isLoading = true);
      await widget.onPressedAsync!.call();
      if (mounted) {
        setState(() => _isLoading = false);
      }
      return;
    }
    widget.onPressed?.call();
  }

  @override
  Widget build(BuildContext context) {
    return OFButton(
      label: widget.label,
      variant: widget.variant,
      size: widget.size,
      isLoading: _isLoading,
      leftIcon: widget.leftIcon,
      onPressed: _handlePressed,
    );
  }
}
