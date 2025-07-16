/**
 * Defines a dynamic selector type.
 * @template T The tuple of all possible field names (e.g., ['id', 'name']).
 * @template S The string literal representing the comma-separated list of fields selected so far.
 */
export type DynamicSelector<T extends readonly string[], S extends string = ''> = {
  // Creates a method for each possible field K in T.
  // Calling this method returns a new DynamicSelector with an updated string literal type S.
  [K in T[number]]: () => DynamicSelector<T, S extends '' ? K : `${S}, ${K}`>;
} & {
  /**
   * Returns the fully constructed, comma-separated string of selected fields.
   * The return type is a specific string literal (e.g., "game_type, game_settings"),
   * which allows TypeScript and Supabase to infer the exact shape of the query result.
   */
  build(): S;
  /**
   * Resets the selector to its initial empty state, allowing you to build a new query.
   * Returns a selector with an empty string literal type.
   */
  reset(): DynamicSelector<T, ''>;
};

/**
 * Creates a type-safe, chainable selector for building Supabase query strings.
 * @param elements A `const` array of strings representing the table columns.
 */
export function createSelector<T extends readonly string[]>(
  elements: T
): DynamicSelector<T, ''> {
  // A Set is used at runtime to track the selected fields. It's fast and handles duplicates.
  let selectedFields = new Set<string>();

  const methods = {
    // The runtime implementation of build() joins the fields from the Set.
    // The return type is inferred by TypeScript from the DynamicSelector<T, S> type.
    build: () => Array.from(selectedFields).join(', '),
    
    // The runtime implementation of reset() clears the set and returns the proxy.
    reset: () => {
      selectedFields.clear();
      // We cast to `any` because the proxy itself doesn't change, but its type does.
      return proxy as any;
    },
  };

  // A Proxy is used to dynamically create the chainable methods (e.g., .game_type(), .id()).
  const proxy = new Proxy(methods, {
    get(target, prop) {
      // First, check if the property is one of our defined methods ('build', 'reset').
      if (prop in target) {
        return target[prop as keyof typeof target];
      }

      // Next, check if the property is a valid column name from the elements array.
      if (typeof prop === 'string' && (elements as readonly string[]).includes(prop)) {
        // If it is, return a function that adds the field to our set...
        return () => {
          selectedFields.add(prop);
          // ...and returns the proxy to allow for further chaining.
          return proxy;
        };
      }

      // If the property doesn't exist, return undefined.
      return undefined;
    },
  }) as DynamicSelector<T, ''>; // We cast the proxy to the initial, empty selector type.

  return proxy;
}