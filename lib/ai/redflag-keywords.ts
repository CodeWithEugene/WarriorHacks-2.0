/**
 * Deterministic red-flag backstop for athlete check-ins (English and Spanish).
 * Matching is accent- and case-insensitive. This list can only ESCALATE a check-in;
 * it never clears one. Sources: UIL heat illness resources, NATA exertional heat stroke guidance.
 */

const RED_FLAG_PATTERNS: readonly RegExp[] = [
  // Central nervous system changes
  /confus/, /confund/, /desorient/, /disorient/, /mareo fuerte/, /don'?t know where/, /dont know where/, /no se donde/, /where am i/, /slurr/, /acting (weird|strange)/,
  // Collapse or fainting
  /pass(ed)? out/, /faint/, /collaps/, /can'?t stand/, /cant stand/, /fell down/, /desmay/, /me cai/, /no puedo pararme/,
  // Vomiting
  /vomit/, /throw(ing)? up/, /threw up/, /puking/, /puke/, /devolv/,
  // Stopped sweating or very hot
  /stopp?ed sweating/, /not sweating/, /no (estoy )?sud/, /deje de sudar/, /skin (is )?(hot|dry)/, /burning up/,
  // Seizure or unresponsive
  /seiz/, /convuls/, /shaking (all over|uncontrol)/, /unresponsive/, /not respond/, /no responde/, /won'?t wake/,
  // Breathing and chest
  /can'?t breath/, /cant breath/, /trouble breath/, /hard to breath/, /no puedo respirar/, /asthma attack/, /ataque de asma/,
  /chest (pain|hurts)/, /dolor (en el|de) pecho/, /me duele el pecho/, /heart (is )?(racing|pounding)/,
  // Help requests about someone else
  /someone (is )?down/, /(he|she|they)('s| is| are) not okay/, /help (him|her|them)/, /ayuda/, /emergenc/,
]

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

export function matchesRedFlagKeywords(text: string | null | undefined): boolean {
  if (!text) return false
  const t = normalize(text)
  return RED_FLAG_PATTERNS.some((re) => re.test(t))
}
