import example from './example.json' with { type: 'json' };

export function createExampleAdventure() {
  return { ...structuredClone(example), id: crypto.randomUUID() };
}
