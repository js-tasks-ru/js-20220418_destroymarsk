/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  return arr.slice().sort((a, b) =>
    param === 'asc' ?
      a.localeCompare(b, 'ru-u-kf-upper') : b.localeCompare(a, 'ru-u-kf-upper')
  );
}

