// /**
//  * Defines a dynamic selector type.
//  * @template T The tuple of all possible field names (e.g., ['id', 'name']).
//  * @template S The string literal representing the comma-separated list of fields selected so far.
//  */
// export type DynamicSelector<T extends readonly string[], S extends string = ''> = {
//   // Creates a method for each possible field K in T.
//   // Calling this method returns a new DynamicSelector with an updated string literal type S.
//   [K in T[number]]: () => DynamicSelector<T, S extends '' ? K : `${S}, ${K}`>;
// } & {
//   /**
//    * Returns the fully constructed, comma-separated string of selected fields.
//    * The return type is a specific string literal (e.g., "game_type, game_settings"),
//    * which allows TypeScript and Supabase to infer the exact shape of the query result.
//    */
//   build(): S;
//   /**
//    * Resets the selector to its initial empty state, allowing you to build a new query.
//    * Returns a selector with an empty string literal type.
//    */
//   reset(): DynamicSelector<T, ''>;
// };

// /**
//  * Creates a type-safe, chainable selector for building Supabase query strings.
//  * @param elements A `const` array of strings representing the table columns.
//  */
// export function createSelector<T extends readonly string[]>(
//   elements: T
// ): DynamicSelector<T, ''> {
//   // A Set is used at runtime to track the selected fields. It's fast and handles duplicates.
//   let selectedFields = new Set<string>();

//   const methods = {
//     // The runtime implementation of build() joins the fields from the Set.
//     // The return type is inferred by TypeScript from the DynamicSelector<T, S> type.
//     build: () => Array.from(selectedFields).join(', '),
    
//     // The runtime implementation of reset() clears the set and returns the proxy.
//     reset: () => {
//       selectedFields.clear();
//       // We cast to `any` because the proxy itself doesn't change, but its type does.
//       return proxy as any;
//     },
//   };

//   // A Proxy is used to dynamically create the chainable methods (e.g., .game_type(), .id()).
//   const proxy = new Proxy(methods, {
//     get(target, prop) {
//       // First, check if the property is one of our defined methods ('build', 'reset').
//       if (prop in target) {
//         return target[prop as keyof typeof target];
//       }

//       // Next, check if the property is a valid column name from the elements array.
//       if (typeof prop === 'string' && (elements as readonly string[]).includes(prop)) {
//         // If it is, return a function that adds the field to our set...
//         return () => {
//           selectedFields.add(prop);
//           // ...and returns the proxy to allow for further chaining.
//           return proxy;
//         };
//       }

//       // If the property doesn't exist, return undefined.
//       return undefined;
//     },
//   }) as DynamicSelector<T, ''>; // We cast the proxy to the initial, empty selector type.

//   return proxy;
// }

// A helper type to join a tuple of strings into a single string literal.
// e.g., Join<["a", "b"], ", "> will produce the type "a, b".
type Join<T extends readonly string[], D extends string> = T extends []
  ? ""
  : T extends [string]
  ? `${T[0]}`
  : T extends readonly [string, ...infer R]
  ? `${T[0]}${D}${Join<Extract<R, readonly string[]>, D>}`
  : string;

/**
 * Defines a dynamic selector type.
 * @template T The tuple of all possible field names (e.g., ['id', 'name']).
 * @template S The string literal representing the comma-separated list of fields selected so far.
 */
export type DynamicSelector<T extends readonly string[], S extends string = ''> = {
  // Creates a method for each possible field K in T.
  [K in T[number]]: () => DynamicSelector<T, S extends '' ? K : `${S}, ${K}`>;
} & {
  /**
   * Returns the fully constructed, comma-separated string of selected fields.
   */
  build(): S;
  /**
   * Resets the selector to its initial empty state.
   */
  reset(): DynamicSelector<T, ''>;
  /**
   * Selects all available fields at once.
   * The return type is a fully-formed string literal of all fields.
   */
  all(): DynamicSelector<T, Join<T, ', '>>;
};

/**
 * Creates a type-safe, chainable selector for building Supabase query strings.
 * @param elements A `const` array of strings representing the table columns.
 */
export function createSelector<T extends readonly string[]>(
  elements: T
): DynamicSelector<T, ''> {
  // A Set is used at runtime to track the selected fields.
  let selectedFields = new Set<string>();

  const methods = {
    build: () => Array.from(selectedFields).join(', '),
    
    reset: () => {
      selectedFields.clear();
      return proxy as any;
    },

    // The runtime implementation for the all() method.
    all: () => {
      // Add every element from the initial array to the set.
      elements.forEach(el => selectedFields.add(el));
      return proxy as any;
    },
  };

  const proxy = new Proxy(methods, {
    get(target, prop) {
      // First, check for our built-in methods ('build', 'reset', 'all').
      if (prop in target) {
        return target[prop as keyof typeof target];
      }

      // Next, check if the property is a valid column name.
      if (typeof prop === 'string' && (elements as readonly string[]).includes(prop)) {
        return () => {
          selectedFields.add(prop);
          return proxy;
        };
      }

      return undefined;
    },
  }) as DynamicSelector<T, ''>;

  return proxy;
}

// Example Usage:
// const gameSettingStatics = ["id", "created_at", "game_type", "game_settings"] as const;
// const selector = createSelector(gameSettingStatics);

// const result = selector.all().build();
// console.log(result); // "id, created_at, game_type, game_settings"

// const partialResult = selector.reset().game_type().game_settings().build();
// console.log(partialResult); // "game_type, game_settings"