class MissingEnvVarsError extends Error {
    missing: any[];
    example: string;
    constructor(allowEmptyValues: boolean, dotenvFilename: string, exampleFilename: string, missingVars: any[]) {
        const errorMessage = `The following variables were defined in ${exampleFilename} but are not present in the environment:\n  ${missingVars.join(', ')}
    Make sure to add them to ${dotenvFilename} or directly to the environment.`;
        const allowEmptyValuesMessage = !allowEmptyValues ? `If you expect any of these variables to be empty, you can use the allowEmptyValues option:
    require('dotenv-safe').config({
      allowEmptyValues: true
    });` : '';
    
        super();
        this.name = this.constructor.name;
        this.missing = missingVars;
        this.example  = exampleFilename;
        this.message = [errorMessage, allowEmptyValuesMessage]
            .filter(Boolean)
            .join('\n\n');
        Error.captureStackTrace(this, this.constructor);
    }
}

export default MissingEnvVarsError;