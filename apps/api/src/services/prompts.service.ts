const defaultSignalPrompts = [
  "What's your hot take?",
  "What's a hill you'd die on?",
  "What's something people misunderstand about you?",
  "What's a problem you love solving?",
  "What's a rule you think should be broken?",
  "What's a moment that changed how you work?"
] as const;

export function listSignalPrompts() {
  return defaultSignalPrompts.map((text, index) => ({
    id: String(index + 1),
    text,
    active: true,
    sortOrder: index + 1
  }));
}

export function findSignalPromptById(promptId: string) {
  return listSignalPrompts().find((prompt) => prompt.id === promptId && prompt.active) ?? null;
}
