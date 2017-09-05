const Java = require('./java-command.js');

let java = Java({
	javaPath: 'C:/neko/openJdk/bin/java.exe',
	jvmOptions: ['-Xms256M', '-Xmx512M'],
	classpath: [
		'C:/neko/java/classes/',
		'C:/neko/build/bin/'
	],
	cwd: 'C:/neko/java',
	tempPath: 'C:/neko/java/tmp'
});

java.execute('hoge.neko.Test', 'a b c', 'd', 'e')
	.systemIn('nekoneko')
	.systemOut(function(out){
		console.log('OUT', out.toString());
	})
	.systemError(function(err){
		console.log('ERROR', err.toString());
	})
	.end(function(buff, errorBuff, code){
		console.log('END', code);
	})
	.error(function(err){
		console.log('error', err);
	});