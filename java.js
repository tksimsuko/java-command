const path = require('path');
const child_process = require('child_process');

//TODO　data文字列化　文字コード指定
module.exports = function(param){
    let javaPath;
    let jvmOptions = param.jvmOptions || [];
    let classpathArray = param.classpath || [];
    let tempPath = param.temp || '';
    let cwdPath = param.cwd || __dirname;
    let isBufferMode = param.bufferMode;

    if(param.java){
        javaPath = path.resolve(cwdPath, param.java);
    }else{
        javaPath = 'java';
    }
    
    return {
        execute: execute,
        executeCommand: executeCommand,
        classpath: classpath
    };

    ////////// function
    //Javaを実行する
    //@param executableJavaName @required
    //@param data Javaに渡すデータ(System.inに渡す)
    function execute(executableJavaName, data){
        let javaProcess = executeJava(executableJavaName, data);
        let processHandler = applyEvent(javaProcess);

        if(data){
            processHandler.systemIn(data);
        }

        return processHandler;
    }
    //Javaコマンドを実行する
    //@param executableJavaName @required
    //@param 第2引数以降：　可変長リストをjavaコマンドのパラメータとして渡す
    function executeCommand(executableJavaName){
        let argArray = Array.prototype.slice.call(arguments);
        let args = argArray.length > 1 ? argArray.slice(1) : [];
        let javaProcess = executeJavaCommand(executableJavaName, args);
        return applyEvent(javaProcess);
    }
    //classpthをセットする
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


    function executeJava(executableJavaName){
        let spawnArgs = generateSpawnArgs(executableJavaName);
        return child_process.spawn(javaPath, spawnArgs, {cwd: cwdPath, env: {TEMP: tempPath}});
    }
    function executeJavaCommand(executableJavaName, args){
        let command = generateCommand(executableJavaName, args);
        //shell: false -> パラメータ文字列を空白文字で区切らない　空白文字が含まれていても一つのパラメータとしてjavaに渡す
        return child_process.exec(command, {cwd: cwdPath, env: {TEMP: tempPath}, shell: false});
    }
    function applyEvent(javaProcess){
        let stdoutBuffer = Buffer.from('');
        let stderrBuffer = Buffer.from('');

        let systemOutCallback = param.systemOut;
        let systemErrorCallback = param.systemError;
        let endCallback = param.end;
        let errorCallback = param.error;


        //event
        javaProcess.stdout.on('data', function(data){
            if(isBufferMode){
                stdoutBuffer = Buffer.concat([stdoutBuffer, Buffer.from(data)]);
            }
            if(systemOutCallback){
                systemOutCallback(data);
            }
        });
        javaProcess.stderr.on('stderr data', function(data){
            if(isBufferMode){
                stderrBuffer = Buffer.concat([stderrBuffer, Buffer.from(data)]);
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
            systemIn: function(data){
                if(typeof(data) === 'object'){
                    data = JSON.stringify(data);
                }
                javaProcess.stdin.write(data);
                javaProcess.stdin.end();
            },
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
    function generateCommand(executableJavaName, args){
        let command = javaPath;
        if(jvmOptions && jvmOptions.length > 0){
            command += ' ' + jvmOptions.join(' ');
        }
        if(classpathArray && classpathArray.length > 0){
            command += ' -classpath';
            command += ' ' + classpathArray.join(path.delimiter);
        }
        command += ' ' + executableJavaName;

        if(args && args.length > 0){
            args.forEach(function(arg){
                if(typeof(arg) === 'object'){
                    command += ' ' + JSON.stringify(arg);
                }else{
                    command += ' ' + arg;
                }
            });
        }
        return command;
    }
    function generateSpawnArgs(executableJavaName){
        let result = [];
        if(jvmOptions && jvmOptions.length > 0){
            result = result.concat(jvmOptions);
        }
        if(classpathArray && classpathArray.length > 0){
            result.push('-classpath');
            result.push(classpathArray.join(path.delimiter));
        }
        result.push(executableJavaName);
        return result;
    }
};