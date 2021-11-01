import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs'
import { cwd } from 'process'
import { homedir } from 'os'
import { env, mode } from './types';

function resolveHome(envPath: string) {
        return envPath[0] === '~' ? join(homedir(), envPath.slice(1)) : envPath
}

export interface IDotEnvOptions {
        path?: string;
        absDir?: string;
        relDir?: string,
        mainFile?: string
        env?: env
        example?: string
        allowEmptyValues?: boolean;
        mode?: mode
        safe?: boolean
        overwrite?: boolean
        ignoreProcessEnv?: boolean
        envFilePrior?: boolean
        merge?: boolean
        throwOnError?: boolean
        debug?: boolean

}

export class DotEnvOptions {
        example: string;
        allowEmptyValues: boolean;
        ignoreProcessEnv: boolean;
        mode: mode;
        safe: boolean;
        overwrite: boolean;
        envFilePrior: boolean;
        mainFile: string;
        path: string | undefined
        env: env;
        relDir: string;
        absDir: string | undefined
        debug: boolean;
        merge: boolean;
        throwOnError: boolean

        constructor(options?: IDotEnvOptions) {
                this.allowEmptyValues = options?.allowEmptyValues ?? true
                this.relDir = options?.relDir ? join(cwd(), options?.relDir) : cwd()
                this.absDir = options?.absDir ? resolveHome(options?.absDir) : undefined
                this.env = options?.env ?? process.env.NODE_ENV ?? ''
                const ext = this.env ? `.${this.env}` : ''
                const file = `.env${ext}`
                this.mainFile = options?.mainFile ?? file
                this.path = options?.path ? resolveHome(options?.path) : undefined
                this.example = options?.example ?? '.env.example'
                this.ignoreProcessEnv = options?.ignoreProcessEnv ?? false
                this.mode = options?.mode ?? 'override'
                this.safe = options?.safe ?? false
                this.overwrite = options?.overwrite ?? false
                this.envFilePrior = options?.envFilePrior ?? true
                this.merge = options?.merge ?? false
                this.debug = options?.debug ?? false
                this.throwOnError = options?.throwOnError ?? false
        }
        getEnvFile() {
                if (this.path)
                        return this.path
                else
                        return resolve(this.getDir(), this.mainFile)
        }
        getExampleFile() {
                return resolve(this.getDir(), this.example)
        }
        getDir() {
                if (this.path)
                        return dirname(this.path)
                else if (this.absDir)
                        return this.absDir
                else
                        return this.relDir
        }
        getMergeDir() {
                if (this.absDir)
                        return this.absDir
                else if (this.relDir != cwd()) {
                        return this.relDir
                }
                else {
                        if (existsSync(join(this.relDir, '/config')))
                                return join(this.relDir, '/config')
                        else
                                return join(this.relDir, '/configuration')
                }
        }

}