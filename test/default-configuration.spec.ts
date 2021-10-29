import { expect, test} from '@jest/globals'
import { DotEnvOptions } from '../lib/options';
import {config} from '../lib/env'
import { dirname, join, resolve } from 'path';
import { cwd } from 'process';
const path=join(cwd(),'test')
const options=new DotEnvOptions({path:join(path,'.env'),example:join(path,'.env.example')});
test('test options creation',()=>
{

    expect(options.allowEmptyValues).toBeTruthy();
    expect(options.path).toEqual(resolve(path, '.env'))
    expect(options.dir).toEqual(dirname(options.path));
    expect(options.example).toEqual(resolve(path, '.env.example'))
    expect(options.ignoreProcessEnv).toBeFalsy();
    expect(options.safe).toBeFalsy();
    expect(options.overwrite).toBeFalsy();
    expect(options.mode).toEqual('override')
})
const result=config(options)

const parsed=result.parsed
describe('test parsing .env file',()=>
{
    test('expect the parse to be successful',()=>
{
    //since safe options is false by default,then no need to read .env.example file , hence keys is undefined
    expect(result.keys).toBeUndefined()
    expect(result.error).toBeUndefined()
})
test('testing inheritance',()=>{
        //testing if it inherited the properties in .env.base
        expect(parsed).toHaveProperty('EMPTY')
        expect(parsed?.EMPTY).toEqual('')
        //testing if it inherited the properties in .env.dev
        expect(parsed).toHaveProperty('envdev')
        //test override
        expect(parsed?.BASIC).toEqual('env value')
})
test('test multiline values',()=>
{
            //test multiline values
            expect(parsed?.envdev).toEqual('multiline \nenv \ndev;')
}
)
test('test retained values',()=>
{
    expect(parsed?.RETAIN_ESCAPED_LEADING_SQUOTE).toEqual("'retained")
    expect(parsed?.RETAIN_LEADING_DQUOTE).toEqual('"retained')
    expect(parsed?.RETAIN_TRAILING_DQUOTE).toEqual('retained"')
    expect(parsed?.RETAIN_TRAILING_SQUOTE).toEqual("retained'")
    expect(parsed?.RETAIN_INNER_QUOTES).toEqual('{"foo": "bar"}')
    
})
test('test space logic ',()=>{
    expect(parsed?.TRIM_SPACE_FROM_UNQUOTED).toEqual('some spaced out string')
    expect(parsed?.SPACED_KEY).toEqual('parsed')
    expect(parsed?.AFTER_LINE).toEqual('after_line')
    expect(parsed?.USERNAME).toEqual(process.env.USERNAME)
})
test('test quotes logic',()=>
{
    expect(parsed?.SINGLE_QUOTES).toEqual('single_quotes')
    expect(parsed?.SINGLE_QUOTES_SPACED).toEqual('    single quotes    ')
    expect(parsed?.DOUBLE_QUOTES).toEqual("double_quotes")
    expect(parsed?.DOUBLE_QUOTES_SPACED).toEqual("    double quotes    ")
})
test('test expansions',()=>{

    expect(parsed?.BASIC_DOLLER_UNEXPAND).toEqual('$BASIC')
    // .env value 'wins' over process.env file's value
    expect(parsed?.MACHINE_EXPAND).toEqual('machine_env')
    expect(parsed?.UNDEFINED_EXPAND).toEqual('')
    expect(parsed?.ESCAPED_EXPAND).toEqual("$\\{ESCAPED}")
    expect(parsed?.MONGOLAB_URI).toEqual('mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')
    expect(parsed?.MONGOLAB_URI_RECURSIVELY).toEqual(parsed?.MONGOLAB_URI)
    expect(parsed?.REFERENCING_OTHER_FILES_VARIABLES).toEqual(`${parsed?.AFTER_LINE}-.env-${parsed?.envdev}`)
})

})

