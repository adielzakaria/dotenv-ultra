import { expect, test} from '@jest/globals'
import { DotEnvOptions } from '../lib/options';
import {config} from '../lib/env'
import { join, resolve } from 'path';
import { cwd } from 'process';
const options=new DotEnvOptions({relDir:'test',env:''});
const directory=join(cwd(),'/test')
test('test options creation',()=>
{

    expect(options.allowEmptyValues).toBeTruthy();
    expect(options.path).toBeUndefined();
    expect(options.absDir).toBeUndefined();
    expect(options.relDir).toEqual(directory)
    expect(options.example).toEqual('.env.example')
    expect(options.ignoreProcessEnv).toBeFalsy();
    expect(options.safe).toBeFalsy();
    expect(options.overwrite).toBeFalsy();
    expect(options.mode).toEqual('override')
    expect(options.mainFile).toEqual('.env')
    expect(options.debug).toBeFalsy();
    expect(options.env).toEqual('')
    expect(options.envFilePrior).toBeTruthy();
    expect(options.merge).toBeFalsy();
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
test('test inline comments', () => {

    expect(parsed?.INLINE_COMMENTS_SINGLE_QUOTES).toEqual('inline comments outside of #singlequotes')
    expect(parsed?.INLINE_COMMENTS_DOUBLE_QUOTES).toEqual('inline comments outside of #doublequotes')
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
test('test merge', () => {
    let options=new DotEnvOptions({relDir:'test/config',merge:true,env:'dev',safe:true});
    //because we're using the merge option the mainfile property will be ignored 
    expect(options.mainFile).toEqual('.env.dev')
    expect(options.merge).toBeTruthy()
    expect(options.getMergeDir()).toEqual(join(cwd(),'test/config'))
    let result=config(options)
    expect(result?.error).toBeDefined()
    options=new DotEnvOptions({relDir:'test',merge:true,env:'dev',safe:true,throwOnError:true});

})

