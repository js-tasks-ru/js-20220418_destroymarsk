/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const props = path.split('.');

  return (object) => {
    let currentObject = object;

    props.forEach((prop) => {
      if (!currentObject) {
        currentObject = null;
        return;
      }

      currentObject = currentObject[prop];
    });

    return currentObject || undefined;
  };
}
