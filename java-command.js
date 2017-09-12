const path = require('path');
const child_process = require('child_process');

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
        execute: spawnCommand,
        executeSync: spawnSync,
        classpath: classpath
    };

    ////////// function
    //Javaを実行する
    //@param executableJavaName - required
    //@param 第2引数以降　　コマンドパラメータとしてJavaに渡る
    function spawnCommand(executableJavaName){
        let argArray = Array.prototype.slice.call(arguments);
        let args = argArray.length > 1 ? argArray.slice(1) : [];
        let javaProcess = executeSpawn(executableJavaName, args);
        return applyEvent(javaProcess);
    }
    //Javaを実行する
    //同期的に実行する
    //@param executableJavaName - required
    //@param input　　System.inに渡るデータ
    //@param paramArray コマンドパラメータとしてJavaに渡る配列
    //@return object (status, signal, pid, output, stdout, stderr, err, envPairs, options, args)
    function spawnSync(executableJavaName, input, paramArray){
        let spawnArgs = generateSpawnArgs(executableJavaName, paramArray);
        if(typeof(input) === 'object'){
            input = JSON.stringify(input);
        }
        return child_process.spawnSync(javaPath, spawnArgs, {input: input, cwd: cwdPath, env: {TEMP: tempPath}});
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

    function executeSpawn(executableJavaName, args){
        let spawnArgs = generateSpawnArgs(executableJavaName, args);
        return child_process.spawn(javaPath, spawnArgs, {cwd: cwdPath, env: {TEMP: tempPath}});
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
                endCallback(stdoutBuffer, stderrBuffer, code);
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
                return this;
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
    function generateSpawnArgs(executableJavaName, args){
        let result = [];
        if(jvmOptions && jvmOptions.length > 0){
            result = result.concat(jvmOptions);
        }
        if(classpathArray && classpathArray.length > 0){
            result.push('-classpath');
            result.push(classpathArray.join(path.delimiter));
        }
        result.push(executableJavaName);

        if(args && args.length > 0){
            result = result.concat(args);
        }
        return result;
    }
};