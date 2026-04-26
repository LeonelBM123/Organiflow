import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-connector-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './connector-panel.html',
  styleUrls: ['./connector-panel.scss']
})
export class ConnectorPanelComponent implements OnChanges {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() connector: any = null;
  @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;
  private fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      field: ['', Validators.required],
      operator: ['==', Validators.required],
      value: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['connector'] && this.connector) {
      const addInfo = this.connector?.addInfo || {};
      const rule = addInfo.conditionRule || {};
      this.form.patchValue({
        field: rule.field || '',
        operator: rule.operator || '==',
        value: rule.value || ''
      });
    }
  }

  onSave(): void {
    if (this.form.invalid || !this.connector) return;
    const formData = this.form.value;
    
    const rule = {
      field: formData.field,
      operator: formData.operator,
      value: formData.value
    };

    this.save.emit({
      connectorId: this.connector.id,
      conditionRule: rule
    });
  }
}
