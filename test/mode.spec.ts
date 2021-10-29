import { expect, test } from '@jest/globals'
import { DotEnvOptions } from '../lib/options';
import { config } from '../lib/env'
import { join } from 'path';
import { cwd } from 'process';
const path = join(cwd(), 'test')
const options = new DotEnvOptions({ path: join(path, '.env'), example: join(path, '.env.example'), mode: 'keep', safe: true });
describe('test custom configurations', () => {
    const result = config(options)
    const parsed = result.parsed
    test('expect the parse to be successful',()=>
    {
        expect(result.error).toBeUndefined()
    })
    test('keys should be defined now',()=>
    {
                expect(result.keys).toBeDefined()
    })
    test('test keep mode',()=>{})
    test('testing inheritance',()=>{
        //testing if it inherited the properties in .env.base
        expect(parsed).toHaveProperty('EMPTY')
        expect(parsed?.EMPTY).toEqual('')
        //testing if it inherited the properties in .env.dev
        expect(parsed).toHaveProperty('envdev')
        //keep value from inherited properties
        expect(parsed?.BASIC).toEqual('basic')
})

})