import type { CharacterId } from './types';

export const CHARACTERS: Record<CharacterId, { name: string; role: string }> = {
  you: { name: 'You', role: 'Obituary writer, The Halcyon Herald' },
  vance: { name: 'Det. Roz Vance', role: 'Homicide, Fourth Precinct' },
  finch: { name: 'Mrs. Ada Finch', role: "Pryce's housekeeper" },
  desmond: { name: 'Desmond Pryce', role: "The victim's nephew" },
  halloway: { name: 'Leon Halloway', role: 'Owner, Halloway Shipping' },
  crane: { name: 'Silas Crane', role: 'Agent, Bulwark Mutual Assurance' },
  lark: { name: 'Vivian Lark', role: 'Singer, the Blue Moon' },
  weiss: { name: 'Dr. Otto Weiss', role: 'City Coroner' },
};
