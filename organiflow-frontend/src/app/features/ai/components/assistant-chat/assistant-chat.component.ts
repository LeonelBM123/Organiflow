import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssistantService } from '../../services/assistant.service';

@Component({
  selector: 'app-assistant-chat',
  imports: [FormsModule],
  templateUrl: './assistant-chat.component.html',
  styleUrl: './assistant-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'chat-host' },
})
export class AssistantChatComponent {
  private readonly assistantService = inject(AssistantService);

  readonly askQuestion = output<string>();

  readonly isThinking = this.assistantService.isThinking;

  readonly question = signal('');

  handleSend(): void {
    const q = this.question().trim();
    if (!q || this.isThinking()) return;
    this.askQuestion.emit(q);
    this.question.set('');
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  }
}
