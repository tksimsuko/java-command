const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

//TODO　data文字列化　文字コード指定
module.exports = function(param){
    let javaPath = param.javaPath || 'java';
    let jvmOptions = param.jvmOptions || [];
    let classpathArray = param.classpath || [];
    let tempPath = param.tempPath || '';
    let cwdPath = param.cwd || __dirname;
    let isBufferMode = param.bufferMode;

    return {
        execute: execute,
        classpath: classpath
    };

    ////////// function
    //Javaコマンドを実行する
    //@require executableJavaPath
    //第2引数以降：　可変長リストを受け取り、javaコマンドのパラメータとして渡す
    function execute(executableJavaPath){
        if(!executableJavaPath){
            throw new Error('executableJavaPath is required.');
        }

        let stdoutBuffer = Buffer.from('');
        let stderrBuffer = Buffer.from('');

        let systemOutCallback = param.systemOut;
        let systemErrorCallback = param.systemError;
        let endCallback = param.end;
        let errorCallback = param.error;

        let argArray = Array.prototype.slice.call(arguments);
        let args = argArray.length > 1 ? argArray.slice(1) : [];

        let commandArgs = generateCommandArgs(executableJavaPath, args);
        //shell: false -> パラメータ文字列を空白文字で区切らない　空白文字が含まれていても一つのパラメータとしてjavaに渡す
        let javaProcess = child_process.spawn(javaPath, commandArgs, {cwd: cwdPath, env: {TEMP: tempPath}, shell: false});

        //event
        javaProcess.stdout.on('data', function(data){
            if(isBufferMode){
                stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
            }
            if(systemOutCallback){
                systemOutCallback(data);
            }
        });
        javaProcess.stderr.on('data', function(data){
            if(isBufferMode){
                stderrBuffer = Buffer.concat([stderrBuffer, data]);
            }
            if(systemErrorCallback){
                systemErrorCallback(data);
            }
        });
        javaProcess.on('close', function(code){
            if(endCallback){
                endCallback(code, stdoutBuffer, stderrBuffer);
            }
        });
        javaProcess.on('error', function(err){
            if(errorCallback){
                errorCallback(err);
            }
        });

        return {
            childProcess: javaProcess,
            systemOut: function(callback){
                if(callback){
                    systemOutCallback = callback;
                }
                return this;
            },
            systemError: function(callback){
                if(callback){
                    systemErrorCallback = callback;
                }
                return this;
            },
            end: function(callback){
                if(callback){
                    endCallback = callback;
                }
                return this;
            },
            error: function(callback){
                if(callback){
                    errorCallback = callback;
                }
                return this;
            }
        };
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
    function generateCommandArgs(executableJavaPath, args){
        let result = [];

        if(jvmOptions && jvmOptions.length > 0){
            result = result.concat(jvmOptions);
        }
        if(classpathArray && classpathArray.length > 0){
            result.push('-classpath');
            result.push(classpathArray.join(path.delimiter));
        }
        result.push(executableJavaPath);
        if(args && args.length > 0){
            args.forEach(function(arg){
                if(typeof(arg) === 'string'){
                    result = result.concat(arg);
                }else if(typeof(arg) === 'object'){
                    result.push(JSON.stringify(arg));
                }
            });
        }

        return result;
    }
};