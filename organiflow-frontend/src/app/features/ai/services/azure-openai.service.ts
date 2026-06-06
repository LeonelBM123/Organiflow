import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class OpenRouterService {
  async ask(messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${environment.openRouterApiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Organiflow Assistant',
      },
      body: JSON.stringify({
        model: environment.openRouterModel,
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  }
}
