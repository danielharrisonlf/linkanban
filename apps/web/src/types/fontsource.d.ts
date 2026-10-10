/**
 * Os pacotes do Fontsource exportam CSS sem tipos próprios.
 * A Vite resolve o arquivo; aqui só dizemos isso ao TypeScript.
 */
declare module "@fontsource-variable/*" {
  const css: string;
  export default css;
}

declare module "@fontsource-variable/*/*.css" {
  const css: string;
  export default css;
}
