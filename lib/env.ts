
import { readFileSync } from 'fs';
import { log } from 'console';
import { DotEnvOptions, DotenvParseOutput } from './options';
import { basename, join } from 'path';
import { Stack } from './stack';
import { Queue } from './queue';
import MissingEnvVarsError from './err';
//const COMMENT = '#'
const INHERITANCE = /^!(.*)/gm
const NEWLINE = '\n'
const MULTILINE = /\s*([\w.-]+)\s*=\s*'(?:[^\\']|\\\\|\\')*'/mg
const RE_INI_KEY_VAL = /([\w.-]+)\s*=\s*(.*)?/
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
    const filesQueue = new Queue<string>()
    const stackDefinitions = new Stack()
    parseRecursive(options.dir, options.path, filesQueue, stackDefinitions)
    while (filesQueue.size() > 0) {
        const filename = filesQueue.dequeue()
        if (filename) {
            parseRecursive(options.dir, filename, filesQueue, stackDefinitions)
        }
    }
    return reduce(stackDefinitions, options.mode)
}
function reduce(stack: Stack<unknown>, mode: string) {
    return stack.toArray().reduce((first: any, last: any) => {
        if (mode === 'override') {
            return { ...last, ...first }
        }
        else {
            return { ...first, ...last }
        }
    }, {})
}

function parseRecursive(dir: string, filename: string, filesQueue: Queue<string>, stackDefinitions: Stack<unknown> | {}[]) {
    const fileString = parseFile(dir, filename)
    const inherited = cascadeInheritance(fileString)
    if (inherited) {
        filesQueue.enqueue(inherited)
    }
    stackDefinitions.push(parseString(fileString))
}

function parseFile(dir: string, filename: string) {
    return readFileSync(join(dir, basename(filename.trim()))).toString()
}
function parseExample(options: DotEnvOptions, env: {}) {
    const src = parseFile(options.dir, options.example)
    const parsed = src.split(NEWLINES_MATCH).filter(x => filterOut(x)).map(x=>x.trim())
    const missing = difference(parsed, Object.keys(env));
    if (missing.length > 0) {
        throw new MissingEnvVarsError(options.allowEmptyValues, options.path, options.example, missing);
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
    const matches = src.split(NEWLINES_MATCH).filter(x => filterOut(x)).map(line => {
        const keyValueArr = line.match(RE_INI_KEY_VAL)
        const parsedVal = parseValue(keyValueArr)
        if (parsedVal) {
            return parsedVal
        }
        else if (debug) {
            log(`did not match key and value when parsing  ${line}`)
        }
    })
    return Object.fromEntries(matches as any)
}
function parse(options: DotEnvOptions) {
    return Object.assign({}, initialParse(options))

}
export function config(options: DotEnvOptions = new DotEnvOptions()) {
    try {
        const parsed = parse(options)
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