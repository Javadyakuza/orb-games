import "../../../types/globals";

global.convertCode = (codeString: string | null | undefined): number => {
  // Return 500 immediately if the input is null, undefined, or an empty string.
  if (!codeString) {
    return 500;
  }

  // Use a regular expression to find the first sequence of one or more digits (\d+).
  const match = codeString.match(/\d+/);

  // If a match is found, `match` will be an array (e.g., ['204']).
  // We parse the first matched group as an integer.
  if (match && match[0]) {
    const numericValue = parseInt(match[0], 10);
    return numericValue;
  }

  // If no numeric part is found in the string, return the default error code.
  return 500;
};
