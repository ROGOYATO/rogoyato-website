// The exercises' answers. Blink's ships in examples.js, the rest in
// answers.json: the code (with its compiled hex) and the wiring. The
// competition car has its wiring only; its code is the students' to write.
import ANSWERS from './answers.json'

export const getAnswer = (example) => example.answer ?? ANSWERS[example.id] ?? null
