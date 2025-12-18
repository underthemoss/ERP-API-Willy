export function assertNoNulls<T extends object>(
  obj: T,
  context = 'input',
): asserts obj is { [K in keyof T]: Exclude<T[K], null> } {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      throw new Error(
        `Field "${key}" in ${context} cannot be null. Omit the field entirely if you don't want to update it.`,
      );
    }
  }
}

type NonNullObject<T> = {
  [K in keyof T as T[K] extends null ? never : K]: Exclude<T[K], null>;
};

export function dropNullKeys<T extends Record<string, any>>(
  filter: T,
): NonNullObject<T> {
  const cleaned = Object.fromEntries(
    Object.entries(filter).filter(([_, value]) => value !== null),
  );

  return cleaned as NonNullObject<T>;
}

type NonUndefinedObject<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: Exclude<
    T[K],
    undefined
  >;
};

export function dropUndefinedKeys<T extends Record<string, any>>(
  filter: T,
): NonUndefinedObject<T> {
  const cleaned = Object.fromEntries(
    Object.entries(filter).filter(([_, value]) => value !== undefined),
  );

  return cleaned as NonUndefinedObject<T>;
}

type NonNullishObject<T> = {
  [K in keyof T as T[K] extends null | undefined ? never : K]: Exclude<
    T[K],
    null | undefined
  >;
};

export function dropNullishKeys<T extends Record<string, any>>(
  filter: T,
): NonNullishObject<T> {
  const cleaned = Object.fromEntries(
    Object.entries(filter).filter(
      ([_, value]) => value !== null && value !== undefined,
    ),
  );

  return cleaned as NonNullishObject<T>;
}
