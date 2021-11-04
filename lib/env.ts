
import { readFileSync,readdirSync } from 'fs';

import { DotEnvOptions } from './options';
import { basename, join } from 'path';
import { Stack } from './stack';
import { Queue } from './queue';
import MissingEnvVarsError from './err';
import { DotenvParseOutput } from './types';
import { log } from 'console';
const INHERITANCE = /^!(.*)/gm
const NEWLINE = '\n'
const MULTILINE = /\s*([\w.-]+)\s*=\s*'(?:[^\\']|\\\\|\\')*'/mg
const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*("[^"]*"|'[^']*'|[^#]*)?(\s*|\s*#.*)?$/
const RE_NEWLINES = /\\n/g
const NEWLINES_MATCH = /\r\n|\n|\r/
//const EXPANDED_VARIABLES=/\${(?:[^\\}]|\\\\|\\})*}/g
function difference(arrA: string[], arrB: string[]) {
    return arrA.filter(a => !arrB.includes(a));
}

function compact(obj: NodeJS.ProcessEnv) {
    let result: { [x: string]: string | undefined; } = {}
    Object.keys(obj).forEach(key => {
        if (obj[key]) {
            result[key] = obj[key];
        }
    });
    return result;
}

function parseValue(keyValueArr: any[] | null) {
    if (keyValueArr != null) {
        const key = keyValueArr[1]
        // default undefined or missing values to empty string
        let val = (keyValueArr[2] || '')
        const end = val.length - 1
        const isDoubleQuoted = val[0] === '"' && val[end] === '"'

        // if double quoted, remove quotes
        if (isDoubleQuoted) {
            val = val.substring(1, end).replace(RE_NEWLINES, NEWLINE)

        } else {
            // remove surrounding whitespace
            //remove escape character from leading single quote
            if (val.startsWith("\\'")) {
                val = val.replace("\\'", "'")
            }
            val = val.trim()
        }
        return [key, val]
    }
    return null
}
function cascadeInheritance(src: string): string[] | undefined {
    return src.match(INHERITANCE)?.flatMap(x => x.slice(1).trim().split(','))
}
function initialParse(options: DotEnvOptions) {
    if(options.merge)
    {
        return reduce(readdirSync(options.getMergeDir()).map(x=>parseString(parseFile(x,options.getMergeDir()))),options.mode)
    }
    const filesQueue = new Queue<string>()
    const stackDefinitions = new Stack()
    debug(options.debug,`parsing main (or first encountered if merge=true) file`)
    parseRecursive(options.getEnvFile(), filesQueue, stackDefinitions)
    while (filesQueue.size() > 0) {
        const filename = filesQueue.dequeue()
        if (filename) {
            parseRecursive(filename.trim(), filesQueue, stackDefinitions,options.getDir(),options.debug)
        }
    }
    return reduce(stackDefinitions.toArray(), options.mode)
}

function reduce(definitions: any[], mode: string)
{
    return definitions.reduce((first: any, last: any) => {
        if (mode === 'override') {
            return { ...last, ...first }
        }
        else {
            return { ...first, ...last }
        }
    }, {})
}


function parseRecursive(filename: string, filesQueue: Queue<string>, stackDefinitions: Stack<unknown>,dir?:string,deb?:boolean) {
    debug(deb,`parsing file${filename}`)
    const fileString = parseFile(filename,dir)
    const inherited = cascadeInheritance(fileString)
    if (inherited) {
        filesQueue.enqueue(inherited)
    }
    stackDefinitions.push(parseString(fileString))
}

function parseFile(filename: string,dir?: string,) {
    if(dir)
    {
        return readFileSync(join(dir, basename(filename))).toString()
    }
    else
    {
        return readFileSync(filename).toString()
    }
    
}
function parseExample(options: DotEnvOptions, env: {}) {
    const src = parseFile(options.getExampleFile())
    const parsed = src.split(NEWLINES_MATCH).filter(x => filterOut(x)).map(x=>x.trim())
    const missing = difference(parsed, Object.keys(env));
    if (missing.length > 0) {
        throw new MissingEnvVarsError(options.allowEmptyValues, options.mainFile, options.example, missing);
    }
    return parsed

}
function parseString(src: string) {
    const obj = {}
    let parsed = parseMultipleLines(src)
    if (parsed != null) {
        Object.assign(obj, parsed)
        src = src.replace(MULTILINE, '')
    }
    Object.assign(obj, parseLines(src, false))
    return obj
}
function parseMultipleLines(src: string) {
    const matches = src.match(MULTILINE)?.map(x => {
        const arr = x.trim().split('=')
        return [arr[0], arr.slice(1).join('=').slice(1, -1)]
    })
    if (matches == null) {
        return null
    }
    return Object.fromEntries(matches)
}
function filterOut(x: string) { return Boolean(x) && x[0] != '#' && x[0] != '!' }
function parseLines(src: string, debug: boolean) {
    const matches = src.split(NEWLINES_MATCH)?.filter(x => filterOut(x))?.map(line => {
        const keyValueArr = line.match(RE_INI_KEY_VAL)
        const parsedVal = parseValue(keyValueArr)
        if (parsedVal) {
            return parsedVal
        }
        else if (debug) {
            log(`did not match key and value when parsing  ${line}`)
        }
    })?.filter(x=>x)
    if(matches){
        return Object.fromEntries(matches as any)
    }
    else
        return {}

}
function parse(options: DotEnvOptions) {
    return Object.assign({}, initialParse(options))

}
function debug(deb,context)
{
if(deb){
    log(context)
}
}
export function config(options: DotEnvOptions = new DotEnvOptions()):{
    [key: string]: any
} {
    try {
        debug(options.debug,'initializing')
        const parsed = parse(options)
        debug(options.debug,'parsed finished')
        const env = options.ignoreProcessEnv ? {} : process.env;
        const Env = options.allowEmptyValues ? env : compact(env);
        const keys = options.safe ? parseExample(options, parsed) : undefined
        for (const configKey in parsed) {
            const value = Env.hasOwnProperty(configKey) ? Env[configKey] : parsed[configKey];
            parsed[configKey] = interpolate(value, Env, parsed, options.envFilePrior)
        }
        for (const processKey in parsed) {
            Env[processKey] = parsed[processKey]
        }
        return { parsed, keys }
    } catch (e) {
        if(options.throwOnError)
            throw e
        else
            return { error: e }
    }
}
function interpolate(envValue: string, env: { [x: string]: string | undefined; }, parsed: DotenvParseOutput, priority: boolean): any {
    const matches = envValue.match(/(\${[\w]+})/g) || [];
    return matches.reduce((newEnv: string, match: string) => {
        const parts = /(.?)\${([\w]+)?}/g.exec(match);
        let value
        const key = parts?.[2];

        if (key) {
            // process.env value 'wins' over .env file's value
            if (!priority) {
                value = process.env.hasOwnProperty(key) ? env[key] : (parsed[key] || '')
            }
            else {
                value = (parsed[key] || '')
            }

            // Resolve recursive interpolations
            value = interpolate(value as string, env, parsed, priority)
        }

        return newEnv.replace((parts?.[0]) as string , value)
    }, envValue);
}