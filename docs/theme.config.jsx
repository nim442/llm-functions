// eslint-disable-next-line import/no-anonymous-default-export
export default {
  logo: <span>LLM functions</span>,
  project: {
    link: "https://github.com/nim442/llm-ts",
  },
  docsRepositoryBase:'https://github.com/nim442/llm-ts',
  footer: false,
  nextThemes: {
    defaultTheme: "dark",
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="LLM functions" />
      <meta property="og:description" content="LLM functions" />
      <title property="og:description" content="LLM functions" />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: "%s – LLM functions",
    };
  },
};
