# dotenv-ultra

[dotenv-ultra](https://www.npmjs.com/package/dotenv-ultra) is a dotenv-inspired package written in typescript,dotenv-ultra is a zero-dependency module that loads environment variables from a .env file into process.env or an object of your choice. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.that supports file extensions, multiline values and many more

## how to use

### basic usage

the function will look for a file named .env at the current working directory.

```typescript
import {config} from 'dotenv-ultra'
config()
```

### detailed usage

```typescript
import {config,DotEnvOptions} from 'dotenv-ultra'
//default configuration is shown 
const options = new DotEnvOptions(
 {
                allowEmptyValues:true
                path:resolve(cwd(), '.env')
                example:resolve(cwd(), '.env.example')
                ignoreProcessEnv:false
                mode:'override'
                safe:false
                overwrite:false
                envFilePrior:true
 })
config(options)
 ```

### options

#### allowEmptyValues : boolean, defaults to true

tells the function whether to allow empty values all delete them.

#### path: string , defaults to resolve(cwd(), '.env')

the path of the .env file containing the definitions of the environment variables.

#### example: string , defaults to resolve(cwd(), '.env.example')

if safe is set to true , then the function will try to read the example file in the same directory as the .env file.

#### ignoreProcessEnv: boolean , defaults to false

tells the function to ignore process.env and generate environment from empty object instead. by default it's set to false and all environment variables will be loaded to process.env.

#### mode: 'keep'|'override' defaults 'override'

tells the parser whether to keep the values inherited from other files or override them as would happen in oop concepts.

#### safe: boolean defaults to false

tells the parser to read entries of the example file and will throw if any key of the keys defined in example files  are missing in the .env file, notice if allowEmptyValues is set to false and safe to true this might throw even if keys are clearly present in .env.

#### overwrite: boolean, defaults to false

tells the parser whether to overwrite the environment variables, useful when  you don't want to mutate process.env, if ignoreProcessEnv is set true , it has no effect.

#### envFilePrior:boolean , defaults to true

tells  the parser when expanding variables whether to prioritize keys already existing in the environment (process.env for example, otherwise this option will have no noticeable effect ) or the ones existing in the .env file.

## file structure and rules

* My_var= value, this designates the basic definition of an environment variable. variable names and keys are trimmed by default.
* empty lines are ignored
* values placed between double quotes are not trimmed but the quotes are removed.
* double quoted values expand new lines
* empty values results in empty string
* multiline values should be placed between single quotes,
my_var='multiline
value
goes
here'
if you're value begins with a single quote and it's not you're intention to define a multiline value then you have to escape it \', the content of what's between the single quotes can contain expanded variables but otherwise is not trimmed or changed in any way
* variables can reference other variable using ${} syntax
foo=${bar},
it'll resolve to the value of the environment variable bar or to the empty string if none is existing , default values for expansions are not supported at the moment. expanded variables can reference other expanded variables and other variables from other inherited files, to escape expansion syntax use $\\{}
* ! designs inheritance it can be followed by one or many other files that the main file inherit from
if the main file inherit from many files they should be separated by commas, additionally all file names are trim by default
 inheritance can appear in any line of the file, encountered names are evaluated from left to right, first line to last, same depth  level to next level , depending on the defined mode the value of the variable will be the first or the last in the stack.
the inheritance syntax can be useful to define default values for different files and to separate .env files depending on the context but still be able to easily integrate all of them with the minimum amount of code
* '#' designs a comment it will be ignored by the parser, inline and multiline comments are not supported at the moment

## plans

* increase type safety and robustness

* implement more features and options

* add support for webpack plugins and other bundlers

* create a Deno port

## inspired by

* dotenv
* dotenv-expand
* dotenv-safe

## Contributing is welcome
