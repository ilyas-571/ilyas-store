module.exports = {
  zod: {
    input: './openapi.yaml',
    output: {
      mode: 'split',
      client: 'zod',
      target: '../api-zod/src/generated/api.ts',
      mock: false,
    }
  },
  reactQuery: {
    input: './openapi.yaml',
    output: {
      mode: 'split',
      client: 'react-query',
      target: '../api-client-react/src/generated/api.ts',
      mock: false,
      override: {
        mutator: {
          path: '../api-client-react/src/custom-fetch.ts',
          name: 'customFetch',
          isMutator: true
        }
      }
    }
  }
};
