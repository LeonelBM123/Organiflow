import 'package:flutter/material.dart';

enum OFLoadingSize { sm, md, lg }

class OFLoadingIndicator extends StatelessWidget {
  const OFLoadingIndicator({
    super.key,
    this.size = OFLoadingSize.md,
    this.color,
    this.message,
  });

  final OFLoadingSize size;
  final Color? color;
  final String? message;

  @override
  Widget build(BuildContext context) {
    final dimension = switch (size) {
      OFLoadingSize.sm => 20.0,
      OFLoadingSize.md => 28.0,
      OFLoadingSize.lg => 40.0,
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: dimension,
          height: dimension,
          child: CircularProgressIndicator(color: color),
        ),
        if (message != null) ...[const SizedBox(height: 12), Text(message!)],
      ],
    );
  }
}
