# dotenv-ultra

[dotenv-ultra](https://www.npmjs.com/package/dotenv-ultra) is a dotenv-inspired package written in typescript,dotenv-ultra is a zero-dependency module that loads environment variables from a .env file into process.env or an object of your choice,it supports file extensions, multiline values and many more. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology. start supporting me with buycoffee
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/adielzakaria)

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
        path: undefined,
        absDir: undefined,
        relDir: cwd(),
        mainFile: '.env',
        env: '',
        example: '.env.example',
        allowEmptyValues?: true,
        mode: 'override',
        safe: false,
        overwrite: false,
        ignoreProcessEnv: false,
        envFilePrior: true,
        merge: false,
        throwOnError: false,
        debug: false,

 })
config(options)
 ```

### options

the package philosophy revolves around convenience providing multiple options whenever possible to make the developer control the inner workings whilst with minimum amount of code

#### allowEmptyValues : boolean, defaults to true

tells the function whether to allow empty values all delete them.

#### path: string|undefined , defaults to undefined

the full path of the main .env file containing the definitions of the environment variables.

#### absDir: string|undefined, (Absolute directory) defaults to undefined

the absolute path to the directory where you keep your environment variables,useful when you follow the default naming schemes so you could just point to where the main file is , to conveniently minimises the amount of code required to type

#### relDir: string, (Relative directory) defaults to cwd()

the relative path of the directory where you keep your files , the value of it results in joining the current working directory with whatever string you provide

* Note: path, absDir, relDir although highly similar those 3 options were introduced for the convenience of the developer , if the property path is present it takes precedence in defining the main file and the directory where all the other files are,absDir takes precedence over relDir

#### mainfile:string , defaults to '.env' well , almost

the name of the main file where you put your environment variables it defaults to '.env'+ the value of the env property
if env property for example equals 'dev' the main file if not defined will default to '.env.dev' makes it convenient for the developer

#### env:'dev'|'development'|'test'|'prod'|'production'|'local'|'deploy'|'deployment'|string

the type is a bit ridiculous but it was first introduced without the string part to make it convenient for developers following same naming schemes but for the sake of flexibility you can add give it whatever value you wish

* CAUTION : the env property affects what kind of file the function will attempt to read if mainfile property is not set , however for convenient the parser will try to find a value of the name '.env.${prop_env}' if the value of env is not set it'll try to read the NODE_ENV environment variable, if you name your files as for example .env.production and you set NODE_ENV to production , with no required configuration the parser will automatically read .env.production, if you have different naming scheme give this property an empty string.

#### example: string , defaults to  '.env.example'

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

#### merge: boolean , defaults to false

if you have a number of .env file in a directory and you want them all to be parsed , you can set this option to true, and give absDir or relDir a value if absDir is undefined and reldir is cwd the parser will automatically tries to read files in /config or /configuration , inheritance is ignored when this option is set to true , the files are read in the same order readDir returns , so overriding logic will work the same way

#### throwOnError: boolean , defaults to false

set this option to true when you want the parser to throw an error when an exception encountered rather than returing an object with property error

#### debug:boolean, defaults to false

the option make the parser print some useful information to the console , only a few statements are now available, work will be done to imporve the debugging statements

## file structure and rules

---.env files

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
---.example file
* only one example file is currently supported
* the required keys are written one by one, each in a line , just the name of the key with no trailing = or anything ,
* the .example file should contain all the keys from the main file and all the other inherited files
* the .example doesn't support inheritance as of yet, if an inheritance directive is encountered it'll only be ignored

## plans

* increase type safety and robustness

* implement more features and options

* add support for webpack plugins and other bundlers

* create a Deno port

## Changelog

see [changelog](https://github.com/adielzakaria/dotenv-ultra/blob/master/changelog.md)

## inspired by

* dotenv
* dotenv-expand
* dotenv-safe

## Contributing is welcome
