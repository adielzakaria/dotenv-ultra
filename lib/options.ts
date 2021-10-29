import { dirname, join, resolve } from 'path';
import { cwd } from 'process'
import { homedir } from 'os'

function resolveHome(envPath: string) {
        return envPath[0] === '~' ? join(homedir(), envPath.slice(1)) : envPath
}
export type mode='override' | 'keep' 
export interface IDotEnvOptions
{
        allowEmptyValues?: boolean;
        path?: string
        debug?:boolean
        mode?:mode
        safe?:boolean
        overwrite?:boolean
        example?:string
        ignoreProcessEnv?:boolean
        envFilePrior?:boolean
}
export class DotEnvOptions {
        path:string;
        example:string; 
        dir: string
        allowEmptyValues: boolean;
        ignoreProcessEnv: boolean;
        mode: mode;
        safe: boolean;
        overwrite: boolean;
        envFilePrior: boolean;
        constructor(options?:IDotEnvOptions)
        {
                this.allowEmptyValues=options?.allowEmptyValues??true
                this.path=options?.path?resolveHome(options.path):resolve(cwd(), '.env')
                this.dir=this.path?dirname(this.path):dirname(resolve(cwd(), '.env'))
                this.example=options?.example?resolveHome(options.example):resolve(cwd(), '.env.example')
                this.ignoreProcessEnv=options?.ignoreProcessEnv??false
                this.mode=options?.mode??'override'
                this.safe=options?.safe??false
                this.overwrite=options?.overwrite??false
                this.envFilePrior=options?.envFilePrior??true
        }

}
export interface DotenvParseOutput {
        [name: string]: string;
      }