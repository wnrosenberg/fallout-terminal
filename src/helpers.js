export const isAlpha = str => {
  var code, i, len;
  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 64 && code < 91) && !(code > 96 && code < 123)) {
      return false;
    }
  }
  return true;
};

// rndItem, get a random item from a set, with optional filter
// // Get a random character that isn't a word.
// let c = rndItem(chars, [char=>char!=='w']);
// // Get a random action, not equal to 't' if lastAction was 't'.
// let lastAction = 't';
// let action = rndItem(actions, [action=>action!==lastAction]);
export const rndItem = (arr, filters=[]) => {
  if (!arr) return null;
  if (arr.length === 1) return arr[0];
  let newArr = [...arr];
  if (filters && filters.length) filters.forEach(filter=>{
    newArr = newArr.filter(filter);
  });
  let i = Math.floor(Math.random() * newArr.length);
  return newArr[i];
};