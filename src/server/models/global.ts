type DynamicSelector<T extends readonly string[], S extends string = ''> = {
  [K in T[number]]: () => DynamicSelector<T, S extends '' ? K : `${S}, ${K}`>;
} & {
  build(): S;
  reset(): DynamicSelector<T, ''>;
  hasNext(): boolean;
  getNextMethod(): string | null;
};

export function createSelector<T extends readonly string[]>(
  elements: T
): DynamicSelector<T, ''> {
  let currentIndex = 0;
  let result = '';
  
  const methods = {
    hasNext: () => currentIndex < elements.length,
    build: () => result as any, // Type assertion needed for runtime
    reset: () => {
      currentIndex = 0;
      result = '';
      return proxy as any;
    },
    getNextMethod: () => currentIndex < elements.length ? elements[currentIndex] : null
  };
  
  const proxy = new Proxy(methods, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      
      if (typeof prop === 'string' && 
          currentIndex < elements.length && 
          elements[currentIndex] === prop) {
        return () => {
          if (result.length > 0) {
            result += ', ';
          }
          result += elements[currentIndex];
          currentIndex++;
          return proxy;
        };
      }
      
      return undefined;
    }
  }) as DynamicSelector<T, ''>;
  
  return proxy;
}
// Example usage:
// const result = selector
//   .groceries() 
//   .clothes()   
//   .electronics().electronics()
//   .build();

// console.log(result); // "groceries, clothes, electronics"
