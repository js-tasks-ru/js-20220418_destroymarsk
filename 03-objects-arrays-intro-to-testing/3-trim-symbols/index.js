/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  let lastChar, lastLongSize = 0;

  const charArray = [...string].map((char) => {
    if (lastChar !== char) {
      lastChar = char;
      lastLongSize = 0;
    }

    if (lastLongSize >= size) {
      return null;
    }

    lastChar = char;
    lastLongSize = lastLongSize + 1;

    return char;
  });

  return charArray.join("");
}
