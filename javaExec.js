const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

module.exports = function(param){
    let javaPath = param.javaPath || 'java';
    let jvmOption = param.jvmOption || '';
    let classpathArray = param.classpath || [];
    let tempPath = param.tempPath || '';
    let cwdPath = param.cwd || __dirname;
    let systemOutCallback = param.systemOut;
    let systemErrorCallback = param.systemError;

    return {
        execute: execute,
        classpath: classpath,
        systemOut: systemOut,
        systemError: systemError
    };

    ////////// function
    function execute(executableJavaPath, paramString, callback){
        let commandString = generateCommandString(executableJavaPath, paramString);
        let javaProcess = child_process.exec(commandString, {cwd: cwdPath, env: {TEMP: tempPath}}, function(err, stdout, stderr){
            if(callback){
                callback(err, stdout, stderr);
            }
            if(err){
                throw err;
            }

            if(systemOutCallback){
                systemOutCallback(stdout);
            }
            if(systemErrorCallback){
                systemErrorCallback(stderr);
            }
        });
    }
    function classpath(pathParam){
        if(pathParam){
            switch(typeof(pathParam)){
                case 'string':
                    classpathArray.push(pathParam);
                    break;
                case 'object':
                    classpathArray = classpathArray.concat(pathParam);
                    break;
            }
        }
    }
    function systemOut(callback){
        if(callback){
            systemOutCallback = callback;
        }
    }
    function systemError(callback){
        if(callback){
            systemErrorCallback = callback;
        }
    }
    function generateCommandString(executableJavaPath, paramString){
        let command = javaPath; ' ' + executableJavaPath;
        if(jvmOption){
            command += ' ' + jvmOption;
        }
        if(classpathArray && classpathArray.length > 0){
            command += ' -classpath ' + classpathArray.join(path.delimiter);
        }
        command +=  ' ' + executableJavaPath;
        if(paramString){
            command += ' ' + paramString;
        }

        return command;
    }
}