/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="webpack" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
  }
}

declare module 'webpack-manifest-plugin' {
  import { WebpackPluginInstance, Compiler } from 'webpack'
  import { SyncWaterfallHook } from 'tapable'
  export type Options = {
    fileName: string
    map: (file: FileDescriptor) => FileDescriptor
    publicPath?: string
  }
  export type FileDescriptor = {
    name: string
  }
  export class WebpackManifestPlugin extends WebpackPluginInstance {
    constructor(options: Options)
    apply(compiler: Compiler): void
  }

  export function getCompilerHooks(
    compiler: Compiler
  ): {
    afterEmit: SyncWaterfallHook
    beforeEmit: SyncWaterfallHook
  }
}
