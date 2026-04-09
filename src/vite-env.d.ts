/// <reference types="vite/client" />

// Declare GLSL shader files as string modules (handled by vite-plugin-glsl)
declare module '*.vert' {
  const src: string;
  export default src;
}
declare module '*.frag' {
  const src: string;
  export default src;
}
declare module '*.glsl' {
  const src: string;
  export default src;
}

// CSS ?inline imports
declare module '*.css?inline' {
  const css: string;
  export default css;
}
