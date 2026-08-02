export type SignalPrompt = {
  id: string;
  text: string;
  active: boolean;
  sortOrder: number;
};

export type SignalPromptsResponse = {
  prompts: SignalPrompt[];
};
