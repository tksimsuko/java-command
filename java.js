const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

module.exports = function(param){
    let javaPath = param.javaPath || 'java';
    let jvmOptions = param.jvmOptions || [];
    let classpathArray = param.classpath || [];
    let tempPath = param.tempPath || '';
    let cwdPath = param.cwd || __dirname;
    let systemOutCallback = param.systemOut;
    let systemErrorCallback = param.systemError;
    let endCallback = param.end;
    let errorCallback = param.error;

    return {
        execute: execute,
        classpath: classpath,
        systemOut: systemOut,
        systemError: systemError,
        end: end,
        error: error
    };

    ////////// function
    function execute(executableJavaPath, paramString){
        let commandArgs = generateCommandArgs(executableJavaPath, paramString);
        let javaProcess = child_process.spawn(javaPath, commandArgs, {cwd: cwdPath, env: {TEMP: tempPath}, shell: true});

        //event
        javaProcess.stdout.on('data', function(data){
            if(systemOutCallback){
                systemOutCallback(data);
            }
        });
        javaProcess.stderr.on('data', function(data){
            if(systemErrorCallback){
                systemErrorCallback(data);
            }
        });
        javaProcess.on('close', function(code){
            if(endCallback){
                endCallback(code);
            }
        });
        javaProcess.on('error', function(err){
            if(errorCallback){
                errorCallback(err);
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
    function end(callback){
        if(callback){
            endCallback = callback;
        }
    }
    function error(callback){
        if(callback){
            errorCallback = callback;
        }
    }
    function generateCommandArgs(executableJavaPath, paramString){
        let result = [];

        if(jvmOptions && jvmOptions.length > 0){
            result = result.concat(jvmOptions);
        }
        if(classpathArray && classpathArray.length > 0){
            result.push('-classpath');
            result.push(classpathArray.join(path.delimiter));
        }
        result.push(executableJavaPath);
        if(paramString){
//TODO objectの文字列化
//TODO executeの　パラメータ 可変長リスト化
            result = result.concat(paramString.split(' '));
        }

        return result;
    }
}