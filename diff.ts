export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function diffStrings(oldStr: string, newStr: string): { oldParts: DiffPart[], newParts: DiffPart[] } {
  if (oldStr === newStr) {
    return {
      oldParts: [{ value: oldStr }],
      newParts: [{ value: newStr }],
    };
  }
  
  let start = 0;
  while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
    start++;
  }

  let end = 0;
  while (
    end < oldStr.length - start &&
    end < newStr.length - start &&
    oldStr[oldStr.length - 1 - end] === newStr[newStr.length - 1 - end]
  ) {
    end++;
  }

  const prefix = oldStr.substring(0, start);
  const oldMiddle = oldStr.substring(start, oldStr.length - end);
  const newMiddle = newStr.substring(start, newStr.length - end);
  const suffix = oldStr.substring(oldStr.length - end);

  const oldParts: DiffPart[] = [];
  const newParts: DiffPart[] = [];

  if (prefix) {
    oldParts.push({ value: prefix });
    newParts.push({ value: prefix });
  }
  if (oldMiddle) {
    oldParts.push({ value: oldMiddle, removed: true });
  }
  if (newMiddle) {
    newParts.push({ value: newMiddle, added: true });
  }
  if (suffix) {
    oldParts.push({ value: suffix });
    newParts.push({ value: suffix });
  }

  return { oldParts, newParts };
}
