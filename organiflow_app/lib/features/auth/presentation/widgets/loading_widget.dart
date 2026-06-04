import 'package:flutter/material.dart';

import '../../../../design/components/feedback/of_loading_indicator.dart';

class LoadingWidget extends StatelessWidget {
  const LoadingWidget({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(child: OFLoadingIndicator(message: message));
  }
}
