import { diagnoseAdventureDocument } from '../store/flamAdventure/diagnostics.js';

// Échapper les octets UTF-8 évite toute interprétation de code ou ambiguïté
// entre échappements JSON et Lua (notamment NUL, retours ligne et antislashs).
function luaString(value) {
  return `"${Array.from(new TextEncoder().encode(value), byte => `\\${String(byte).padStart(3, '0')}`).join('')}"`;
}

function luaValue(value) {
  if (value === null) return 'nil';
  if (typeof value === 'string') return luaString(value);
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return `{${value.map(luaValue).join(',')}}`;
  return `{${Object.entries(value).map(([key, item]) => `[${luaString(key)}]=${luaValue(item)}`).join(',')}}`;
}

// Ce module produit uniquement les données du runtime. La préparation des
// médias, le manifeste, le pack et le transfert appartiennent au lot suivant.
export function compileAdventureData(document) {
  const diagnostics = diagnoseAdventureDocument(document);
  if (diagnostics.some(entry => entry.severity === 'error')) {
    const error = new Error('INVALID_ADVENTURE_CONTENT');
    error.diagnostics = diagnostics;
    throw error;
  }
  return `-- Document FLAM validé, version 1.\nreturn ${luaValue(document)}\n`;
}
