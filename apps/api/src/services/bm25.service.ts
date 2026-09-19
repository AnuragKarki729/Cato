const K1 = 1.2;
const B = 0.75;

export function tokenizeSearchText(value: string | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function countTerms(tokens: string[]) {
  return tokens.reduce<Record<string, number>>((counts, token) => {
    counts[token] = (counts[token] ?? 0) + 1;
    return counts;
  }, {});
}

export function scoreDocumentsWithBm25(query: string, documents: Array<{ id: string; text: string }>) {
  const queryTerms = Array.from(new Set(tokenizeSearchText(query)));

  if (queryTerms.length === 0 || documents.length === 0) {
    return new Map<string, number>();
  }

  const tokenizedDocuments = documents.map((document) => {
    const tokens = tokenizeSearchText(document.text);
    return {
      id: document.id,
      length: tokens.length,
      termCounts: countTerms(tokens)
    };
  });
  const averageDocumentLength =
    tokenizedDocuments.reduce((total, document) => total + document.length, 0) / Math.max(1, tokenizedDocuments.length);
  const documentFrequency = queryTerms.reduce<Record<string, number>>((frequencies, term) => {
    frequencies[term] = tokenizedDocuments.filter((document) => document.termCounts[term]).length;
    return frequencies;
  }, {});
  const rawScores = tokenizedDocuments.map((document) => {
    const rawScore = queryTerms.reduce((score, term) => {
      const frequency = document.termCounts[term] ?? 0;

      if (frequency === 0) {
        return score;
      }

      const inverseDocumentFrequency = Math.log(1 + (documents.length - (documentFrequency[term] ?? 0) + 0.5) / ((documentFrequency[term] ?? 0) + 0.5));
      const denominator = frequency + K1 * (1 - B + B * (document.length / Math.max(1, averageDocumentLength)));
      return score + inverseDocumentFrequency * ((frequency * (K1 + 1)) / denominator);
    }, 0);

    return {
      id: document.id,
      rawScore
    };
  });
  const maxScore = Math.max(...rawScores.map((score) => score.rawScore), 0);

  return new Map(rawScores.map((score) => [score.id, maxScore > 0 ? Math.round((score.rawScore / maxScore) * 100) : 0]));
}
