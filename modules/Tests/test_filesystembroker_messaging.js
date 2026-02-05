import { getI18nMsg, formatMsToDateTime12HR , formatMsToDateTime24HR } from '../utilities.js';



export class FileSystemBrokerMessagingTest {
  #CLASS_NAME = this.constructor.name;

  #LOG        = false;
  #DEBUG      = false;

  #FS_BROKER_EXTENSION_ID = "file-system-broker@localmotive.com"; // MABXXX Configuration option???

  #logger;



  constructor(logger) {
    this.#logger = logger;
  }
  


  log(...info) {
    if (! this.#LOG) return;
    const msg = info.shift();
    this.#logger.log(this.#CLASS_NAME + "#" + msg, ...info);
  }

  debug(...info) {
    if (! this.#DEBUG) return;
    const msg = info.shift();
    this.#logger.debug(this.#CLASS_NAME + "#" + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    this.#logger.debugAlways(this.#CLASS_NAME + "#" + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    this.#logger.error(this.#CLASS_NAME + "#" + msg, ...info);
  }

  caught(e, msg, ...info) {
    // always log exceptions
    this.#logger.error( this.#CLASS_NAME + "#" + msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async testFileSystemBroker() {
    this.debugAlways("\n\n********** TESTING FileSystemBroker (using Messaging) **********\n\n");

    /* These Tests Are Avalable:
     *
     *  await this.testAccessCommand();
     *  await this.testExistsCommand(FileName);
     *  await this.testIsRegularFileCommand(FileName);
     *  await this.testIsDirectoryCommand(directoryName);
     *  await this.testHasFilesCommand(directoryName);
     *  await this.testGetFileCountCommand(directoryName);
     *  await this.testWriteFileCommand(fileName, writeMode, data);
     *  await this.testReplaceFileCommand(fileName, data);
     *  await this.testAppendToFileCommand(fileName, data);
     *  await this.testWriteJSONFileCommand(fileName, data);
*    *  await this.testWriteObjectToJSONFileCommand(fileName, object);
     *  await this.testReadFileCommand(fileName);
     *  await this.testReadJSONFileCommand(fileName);
*    *  await this.testReadObjectFromJSONFileCommand(fileName);
     *  await this.testGetFileInfoCommand(fileName);
     *  await this.testDeleteFileCommand(fileName) {
     *  await this.testDeleteDirectoryCommand(directoryName, recursive);
     *  await this.testMakeDirectoryCommand();
     *  await this.testListFilesCommand( [matchGLOB] );
*    *  await this.testListFileInfoCommand( [matchGLOB] );
     *  await this.testListCommand( [matchGLOB] );
*    *  await this.testListInfoCommand( [matchGLOB] );
     *  await this.testGetFullPathNameCommand( [fileName] );
     *  await this.testIsValidFileNameCommand(fileName);
     *  await this.testIsValidDirectoryNameCommand(DirectoryName);
     *  await this.testGetFileSystemPathNameCommand();
     *  await this.testUnknownCommand(command);
     */

    await this.testAccessCommand(          "depends on FileSystemBroker settings"                                 ); // "my" directory - should already exist
    await this.testGetFileSystemPathNameCommand( "full pathName of FileSystemBroker in user's profile directory"  );
////await this.testExistsCommand(          "return false"                                                         ); // "my" directory
////await this.testIsRegularFileCommand(   "return error"                                                         ); // "my" directory - error because fileName is not optional
////await this.testIsDirectoryCommand(     "return error"                                                         ); // "my" directory
////await this.testHasFilesCommand(        "return error"                                                         ); // "my" directory
////await this.testGetFileCountCommand(    "return error"                                                         ); // "my" directory
////await this.testGetFileInfoCommand(     "return null"                                                          ); // "my" directory
    await this.testMakeDirectoryCommand(   "return false"                                                         ); // "my" directory - should already exist
    await this.testExistsCommand(          "return true"                                                          ); // "my" directory
    await this.testIsRegularFileCommand(   "return error"                                                         ); // "my" directory - error because fileName is not optional
    await this.testIsDirectoryCommand(     "return true"                                                          ); // "my" directory
    await this.testHasFilesCommand(        "return true"                                                          ); // "my" directory
    await this.testGetFileCountCommand(    "return 1"                                                             ); // "my" directory
    await this.testGetFileInfoCommand(     "return FileInfo"                                                      ); // "my" directory

    await this.testExistsCommand(          "return true",                       "EMPTY"                           );
    await this.testExistsCommand(          "return false",                      "file1.txt"                       );
    await this.testIsRegularFileCommand(   "return false",                      "file1.txt"                       );
    await this.testIsDirectoryCommand(     "return false",                      "file1.txt"                       );
    await this.testExistsCommand(          "return true",                       "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs
    await this.testIsRegularFileCommand(   "return false",                      "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs
    await this.testIsDirectoryCommand(     "return true",                       "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs
    await this.testGetFileInfoCommand(     "return FileInfo",                   "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs

    await this.testListCommand(            "return 1 file name - file 'EMPTY'"                                    );
    await this.testListInfoCommand(        "return 1 file - file 'EMPTY'"                                         );
    await this.testListFilesCommand(       "return 1 file name - file 'EMPTY'"                                    );
    await this.testListFileInfoCommand(    "return 1 file - file 'EMPTY'"                                         );
    await this.testWriteFileCommand(       "return bytesWritten=17",            "file1.txt", undefined, "this is file1.txt" ); // default writeMode: 'overwrite'
    await this.testWriteFileCommand(       "return bytesWritten=17",            "file2.txt", undefined, "this is file2.txt" ); // default writeMode: 'overwrite'
    await this.testExistsCommand(          "return true",                       "file1.txt"                       );
    await this.testExistsCommand(          "return true",                       "file2.txt"                       );
    await this.testIsRegularFileCommand(   "return true",                       "file1.txt"                       );
    await this.testIsRegularFileCommand(   "return true",                       "file2.txt"                       );
    await this.testIsDirectoryCommand(     "return false",                      "file1.txt"                       );
    await this.testIsDirectoryCommand(     "return false",                      "file2.txt"                       );
    await this.testGetFileInfoCommand(     "return FileInfo",                   "file1.txt"                       );
    await this.testGetFileInfoCommand(     "return FileInfo",                   "file2.txt"                       );
    await this.testReadFileCommand(        "return data \"this is file1.txt\"", "file1.txt"                       );
    await this.testReadFileCommand(        "return data \"this is file2.txt\"", "file2.txt"                       );
    await this.testListFilesCommand(       "return 3 file names"                                                  );
    await this.testListFilesCommand(       "return 1 file name",                "file1.txt"                       );
    await this.testListFilesCommand(       "return 0 file names",               "fileX.txt"                       );
    await this.testHasFilesCommand(        "return true"                                                          ); // "my" directory
    await this.testGetFileCountCommand(    "return 3"                                                             ); // "my" directory

    await this.testWriteObjectToJSONFileCommand("return bytesWritten=27", "object.json", { 'a': 'a', 'b': 'b' }   );
    await this.testReadObjectFromJSONFileCommand("???", "object.json"                                             );

    await this.testDeleteDirectoryCommand( "return error, has files",           undefined, false                  ); // delete my directory, but not the files in it

    await this.testDeleteFileCommand(      "return true",                       "file1.txt"                       );
    await this.testExistsCommand(          "return false",                      "file1.txt"                       );
    await this.testIsRegularFileCommand(   "return false",                      "file1.txt"                       );
    await this.testGetFileInfoCommand(     "return error",                      "file1.txt"                       );
    await this.testReadFileCommand(        "return error",                      "file1.txt"                       );
    await this.testListFilesCommand(       "return 2 file names"                                                  );
    await this.testHasFilesCommand(        "return true"                                                          ); // "my" directory
    await this.testGetFileCountCommand(    "return 2"                                                             ); // "my" directory

    await this.testDeleteFileCommand(      "return true",                       "file2.txt"                       );
    await this.testExistsCommand(          "return false",                      "file2.txt"                       );
    await this.testIsRegularFileCommand(   "return false",                      "file2.txt"                       );
    await this.testGetFileInfoCommand(     "return error",                      "file2.txt"                       );
    await this.testReadFileCommand(        "return error",                      "file2.txt"                       );
    await this.testListFilesCommand(       "return 1 file name"                                                   );
    await this.testHasFilesCommand(        "return true"                                                          ); // "my" directory
    await this.testGetFileCountCommand(    "return 1"                                                             ); // "my" directory

    await this.testDeleteDirectoryCommand( "return error, has files",           undefined, false                  ); // delete my directory, but not the files in it
    await this.testDeleteDirectoryCommand( "return true",                       undefined, true                   ); // delete my directory and *ALL* the files in it
    await this.testExistsCommand(          "return false"                                                         ); // "my" directory
    await this.testIsRegularFileCommand(   "return error, no fileName"                                            ); // "my" directory
    await this.testIsDirectoryCommand(     "return false"                                                         ); // "my" directory
    await this.testGetFileInfoCommand(     "return null"                                                          ); // "my" directory
    await this.testHasFilesCommand(        "return error, directory does not exist"                               ); // "my" directory
    await this.testGetFileCountCommand(    "return error, directory does not exist"                               ); // "my" directory

    await this.testMakeDirectoryCommand(   "return true"                                                          ); // "my" directory
    await this.testExistsCommand(          "return true"                                                          ); // "my" directory
    await this.testIsRegularFileCommand(   "return error, no fileName"                                            ); // "my" directory
    await this.testIsDirectoryCommand(     "return true"                                                          ); // "my" directory
    await this.testGetFileInfoCommand(     "return FileInfo"                                                      ); // "my" directory
    await this.testHasFilesCommand(        "return false"                                                         ); // "my" directory
    await this.testGetFileCountCommand(    "return 0"                                                             ); // "my" directory

    await this.testWriteFileCommand(       "return bytesWritten=0",             "EMPTY", undefined, ""            ); // default writeMode: 'overwrite'
    await this.testHasFilesCommand(        "return true"                                                          ); // "my" directory
    await this.testGetFileCountCommand(    "return 1"                                                             ); // "my" directory

    await this.testGetFullPathNameCommand( "return full path name",             "randomFileName.txt"              );

    await this.testIsValidFileNameCommand( "return error",                      ""                                );
    await this.testIsValidFileNameCommand( "return true",                       "file1.txt"                       );
    await this.testIsValidFileNameCommand( "return true",                       "xxx"                             );
    await this.testIsValidFileNameCommand( "return false",                      "f:le1.txt"                       );
    await this.testIsValidFileNameCommand( "return false",                      "f*le1.txt"                       );

    await this.testIsValidDirectoryNameCommand( "return error",                 ""                                );
    await this.testIsValidDirectoryNameCommand( "return true",                  "dir1"                            );
    await this.testIsValidDirectoryNameCommand( "return true",                  "xxx"                             );
    await this.testIsValidDirectoryNameCommand( "return false",                 "d*r1"                            );
    await this.testIsValidDirectoryNameCommand( "return false",                 "d:r1"                            );
    await this.testIsValidDirectoryNameCommand( "return false",                 ".."                              );

    await this.testUnknownCommand(         "return error",                      ""                                );
    await this.testUnknownCommand(         "return error",                      "*"                               );
    await this.testUnknownCommand(         "return error",                      "command"                         );

    this.debugAlways("\n\n********** DONE TESTING FileSystemBroker (using Messaging) **********\n\n");
  }



  async sendFSBrokerCommand(command) {
    this.debug(`-- ######## sending command command.command="${command.command}" to Extension with ID="${this.#FS_BROKER_EXTENSION_ID}"`);
    try {
      this.debug(`-- sending command command.command="${command.command}" to Extension with ID="${this.#FS_BROKER_EXTENSION_ID}"`);
      const message = { 'Command': command };
      const response = await messenger.runtime.sendMessage(this.#FS_BROKER_EXTENSION_ID, message);

      if (response) {
        this.debug("-- Got a Response!!!");
        return response;

      } else {
        this.debug("-- GOT NO RESPONSE!!!");
      }

    } catch(error) {
      this.caught(error, "sendFSBrokerCommand !!!!! MESSAGE SEND FAILED !!!!!");
    }
  }



  async testAccessCommand(expecting) {
    this.debugAlways(`########## access: "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "access"} );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- access="${response.access}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testAccessCommand: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testExistsCommand(expecting, fileName) {
    this.debugAlways(`########## exists: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "exists", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" exists="${response.exists}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testExistsCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsRegularFileCommand(expecting, fileName) {
    this.debugAlways(`########## isRegularFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "isRegularFile", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" isRegularFile="${response.isRegularFile}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsRegularFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsDirectoryCommand(expecting, directoryName) {
    this.debugAlways(`########## isDirectory: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "isDirectory", "directoryName": directoryName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- directoryName="${response.directoryName}" isDirectory="${response.isDirectory}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsDirectoryCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testHasFilesCommand(expecting, directoryName) {
    this.debugAlways(`########## hasFiles: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "hasFiles", "directoryName": directoryName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- directoryName="${response.directoryName}" hasFiles="${response.hasFiles}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testHasFilesCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFileCountCommand(expecting, directoryName) {
    this.debugAlways(`########## getFileCount: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "getFileCount", "directoryName": directoryName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- directoryName="${response.directoryName}" fileCount="${response.fileCount}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testGetFileCountCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testWriteFileCommand(expecting, fileName, writeMode, data) {
    this.debugAlways(`########## writeFile: fileName="${fileName}" writeMode="${writeMode}" expecting "${expecting}"`);
    try {
      let response;
      if (writeMode) {
        response = await this.sendFSBrokerCommand( { "command": "writeFile", "fileName": fileName, "writeMode": writeMode, "data": data } );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "writeFile", "fileName": fileName, "data": data } );
      }
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testWriteFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReplaceFileCommand(expecting, fileName, data) {
    this.debugAlways(`########## replaceFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "replaceFile", "fileName": fileName, "data": data } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testReplaceFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testAppendToFileCommand(expecting, fileName, data) {
    this.debugAlways(`########## appendToFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "appendToFile", "fileName": fileName, "data": data } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testAppendToFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testWriteJSONFileCommand(expecting, fileName, data) {
    this.debugAlways(`########## writeJSONFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "writeJSONFile", "fileName": fileName, "data": data } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testWriteJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testWriteObjectToJSONFileCommand(expecting, fileName, object) {
    this.debugAlways(`########## writeObjectToJSONFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "writeObjectToJSONFile", "fileName": fileName, "object": object } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testWriteObjectToJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReadFileCommand(expecting, fileName) {
    this.debugAlways(`########## readFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "readFile", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}"`);
          this.debugAlways(`-- data="${response.data}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testReadFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReadJSONFileCommand(expecting, fileName) {
    this.debugAlways(`########## readJSONFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "readJSONFile", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}"`);
          this.debugAlways(`-- data="${response.data}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testReadJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReadObjectFromJSONFileCommand(expecting, fileName) {
    this.debug(`########## readObjectFromJSONFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "readObjectFromJSONFile", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}"`);
          this.debugAlways(`-- object=${response.object}`, response.object);
        }
      }
    } catch (error) {
      this.caught(error, `testReadObjectFromJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFileInfoCommand(expecting, fileName) {
    this.debugAlways(`########## getFileInfo fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "getFileInfo", "fileName": fileName } );
      if (response) { // errors and missing response are already handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          const fileInfo = response.fileInfo;
          if (! fileInfo) { // this should never happen. FSBroker (currently) returns an error if the file does not exist
            this.debugAlways(`-- ERROR: FileSystemBroker returned null for file "${fileName}"`);
          } else {
            this.debugAlways( `-- fileName="${response.fileName}" fileInfo:`
                              + `\n- fileName="${fileInfo.fileName}"`
                              + `\n- path="${fileInfo.path}"`
                              + `\n- type="${fileInfo.type}"`
                              + `\n- size="${fileInfo.size}"`
                              + `\n- creationTime="${formatMsToDateTime12HR(fileInfo.creationTime)}"`
                              + `\n- lastAccessed="${formatMsToDateTime12HR(fileInfo.lastAccessed)}"`
                              + `\n- lastModified="${formatMsToDateTime12HR(fileInfo.lastModified)}"`
                              + `\n- permissions="${fileInfo.permissions}"`
                            );
          }
        }
      }
    } catch (error) {
      this.caught(error, `testGetFileInfoCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testDeleteFileCommand(expecting, fileName) {
    this.debugAlways(`########## deleteFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "deleteFile", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" deleted="${response.deleted}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testDeleteFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testDeleteDirectoryCommand(expecting, directoryName, recursive) {
    this.debugAlways(`########## deleteDirectory: directoryName="${directoryName}" recursive=${recursive} expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "deleteDirectory", "directoryName": directoryName, "recursive": recursive } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- directoryName="${response.directoryName}" recursive="${response.recursive}" deleted="${response.deleted}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testDeleteDirectoryCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testMakeDirectoryCommand(expecting) {
    this.debugAlways(`########## makeDirectory: expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "makeDirectory" } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- directoryName="${response.directoryName}" created="${response.created}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testMakeDirectoryCommand: !!!!!  !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListFilesCommand(expecting, matchGLOB) {
    this.debugAlways(`########## listFiles: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "listFiles", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "listFiles" } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- length=${response.length}`);
          const fileNames = response.fileNames;
          for (const fileName of fileNames) {
            this.debugAlways(`-- fileName="${fileName}"`);
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListFilesCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListFileInfoCommand(expecting, matchGLOB) {
    this.debugAlways(`########## listFileInfo: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "listFileInfo", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "listFileInfo" } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- length=${response.length}`);
          const fileInfo = response.fileInfo;
          for (const info of fileInfo) {
            this.debugAlways( `-- fileInfo:`
                              + `\n- fileName="${info.fileName}"`
                              + `\n- path="${info.path}"`
                              + `\n- type="${info.type}"`
                              + `\n- size="${info.size}"`
                              + `\n- creationTime="${formatMsToDateTime12HR(info.creationTime)}"`
                              + `\n- lastAccessed="${formatMsToDateTime12HR(info.lastAccessed)}"`
                              + `\n- lastModified="${formatMsToDateTime12HR(info.lastModified)}"`
                              + `\n- permissions="${info.permissions}"`
                            );
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListFileInfoCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListCommand(expecting, matchGLOB) {
    this.debugAlways(`########## list: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "list", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "list" } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- length=${response.length}`);
          const fileNames = response.fileNames;
          for (const fileName of fileNames) {
            this.debugAlways(`-- fileName="${fileName}"`);
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListInfoCommand(expecting, matchGLOB) {
    this.debugAlways(`########## listInfo: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "listInfo", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "listInfo" } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- length=${response.length}`);
          const fileInfo = response.fileInfo;
          for (const info of fileInfo) {
            this.debugAlways( `-- fileInfo:`
                              + `\n- fileName="${info.fileName}"`
                              + `\n- path="${info.path}"`
                              + `\n- type="${info.type}"`
                              + `\n- size="${info.size}"`
                              + `\n- creationTime="${formatMsToDateTime12HR(info.creationTime)}"`
                              + `\n- lastAccessed="${formatMsToDateTime12HR(info.lastAccessed)}"`
                              + `\n- lastModified="${formatMsToDateTime12HR(info.lastModified)}"`
                              + `\n- permissions="${info.permissions}"`
                            );
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListInfoCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFullPathNameCommand(expecting, fileName) {
    this.debugAlways(`########## getFullPathName: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "getFullPathName", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" fullPathName="${response.fullPathName}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testGetFullPathNameCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsValidFileNameCommand(expecting, fileName) {
    this.debugAlways(`########## isValidFileName: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "isValidFileName", "fileName": fileName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- fileName="${response.fileName}" valid="${response.valid}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsValidFileNameCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsValidDirectoryNameCommand(expecting, directoryName) {
    this.debugAlways(`########## isValidDirectoryName: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "isValidDirectoryName", "directoryName": directoryName } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- directoryName="${response.directoryName}" valid="${response.valid}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsValidDirectoryNameCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFileSystemPathNameCommand(expecting) {
    this.debugAlways(`########## getFileSystemPathName: expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "getFileSystemPathName" } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`-- pathName="${response.pathName}"`); 
        }
      }
    } catch (error) {
      this.caught(error, `testGetFileSystemPathNameCommand: !!!!! command="${command}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testUnknownCommand(expecting, command) {
    this.debugAlways(`########## unkownCommand: command="${command}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": command } );
      if (response) { // missing response handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`-- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`-- ERROR: "${response.error}"`);
        } else {
          this.debugAlways("-- ??? WHY DID WE NOT GET AN ERROR ???"); 
        }
      }
    } catch (error) {
      this.caught(error, `testUnknownCommand: !!!!! command="${command}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

}
