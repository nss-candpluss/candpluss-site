const NOTE_PREFIX = "※";

export function splitFeatureNotes(body: string) {
  const bodyLines: string[] = [];
  const notes: string[] = [];

  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith(NOTE_PREFIX)) {
      notes.push(line.trim());
    } else {
      bodyLines.push(line);
    }
  }

  return {
    body: bodyLines.join("\n").trim(),
    notes,
  };
}
