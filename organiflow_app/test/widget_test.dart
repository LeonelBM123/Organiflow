import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:organiflow_app/design/components/buttons/of_button.dart';

void main() {
  testWidgets('OFButton renders label and triggers callback', (
    WidgetTester tester,
  ) async {
    var tapped = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: OFButton(
            label: 'Continuar',
            fullWidth: false,
            onPressed: () => tapped = true,
          ),
        ),
      ),
    );

    expect(find.text('Continuar'), findsOneWidget);

    await tester.tap(find.text('Continuar'));
    await tester.pump();

    expect(tapped, isTrue);
  });
}
