module.exports = function(grunt)
{
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            typedoc: {
                tsconfig: { passThrough: true }
            },
            typescript: {
                options: {
                    sourceMap: false,
                    declaration: true
                },
                src: [
                    'typescript/src/compiler/core.ts',
                    'typescript/src/compiler/sys.ts',
                    'typescript/src/compiler/types.ts',
                    'typescript/src/compiler/scanner.ts',
                    'typescript/src/compiler/parser.ts',
                    'typescript/src/compiler/utilities.ts',
                    'typescript/src/compiler/binder.ts',
                    'typescript/src/compiler/checker.ts',
                    'typescript/src/compiler/declarationEmitter.ts',
                    'typescript/src/compiler/emitter.ts',
                    'typescript/src/compiler/program.ts',
                    'typescript/src/compiler/commandLineParser.ts',
                    'typescript/src/compiler/diagnosticInformationMap.generated.ts'
                ],
                out: 'src/typings/typescript/typescript.js'
            }
        },
        tslint: {
            options: {
                configuration: 'tslint.json'
            },
            files: {
                src: [ 'src/**/*.ts', '!src/test/converter/**/*.ts' ]
            }
        },
        'string-replace': {
            version: {
                files: {
                    'dist/lib/application.js': ['dist/lib/application.js']
                },
                options: {
                    replacements: [{
                        pattern: /{{ VERSION }}/g,
                        replacement: '<%= pkg.version %>'
                    }]
                }
            },
            typescript: {
                files: {
                    'src/typings/typescript/typescript.d.ts': ['src/typings/typescript/typescript.d.ts']
                },
                options: {
                    replacements: [{
                        pattern: /\}[\s\n\r]*declare namespace ts \{/g,
                        replacement: ''
                    }, {
                        pattern: /declare namespace ts/g,
                        replacement: 'declare module "typescript"'
                    }]
                }
            }
        },
        watch: {
            source: {
                files: ['src/**/*.ts'],
                tasks: ['ts:typedoc', 'string-replace:version']
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.registerTask('default', ['tslint', 'ts:typedoc', 'string-replace:version']);
    // grunt.registerTask('build_and_test', ['default'/*, 'specs', 'copy', 'mocha_istanbul:coverage'*/]);
    // grunt.registerTask('specs', ['clean:specsBefore', 'build-specs', 'clean:specsAfter']);
};
