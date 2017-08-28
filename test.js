const Java = require('./java.js');

let java = Java({
	javaPath: 'C:/neko/openJdk/bin/java.exe',
	jvmOptions: ['-Xms256M', '-Xmx512M'],
	tempPath: 'C:/neko/java/tmp',
	classpath: [
		'C:/neko/java/classes/',
		'C:/neko/java/'
	],
	cwd: 'C:/neko/java'
});

java.execute('hoge.neko.Test', 'a b c');
java.systemOut(function(out){
	console.log('OUT', out.toString());
});
java.systemError(function(err){
	console.log('ERROR', err.toString());
});
java.end(function(code){
	console.log('END', code);
});
java.error(function(err){
	console.log('error', err);
});