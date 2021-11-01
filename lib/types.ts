export type mode='override' | 'keep' 
export type env='dev'|'development'|'test'|'prod'|'production'|'local'|'deploy'|'deployment'|string
export interface DotenvParseOutput {
    [name: string]: string;
  }
