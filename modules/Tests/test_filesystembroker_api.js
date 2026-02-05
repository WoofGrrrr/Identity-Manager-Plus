import { FileSystemBrokerAPI } from '../../modules/FileSystemBroker/filesystem_broker_api.js';
import { formatMsToDateTime12HR } from '../utilities.js';

export class FileSystemBrokerApiTest {
  #CLASS_NAME = this.constructor.name;

  #LOG   = false;
  #DEBUG = false;

  #logger;
  #fsBrokerApi = new FileSystemBrokerAPI();


    
  constructor(logger) {
    this.#logger = logger;
  }
  


  log(...info) {
    if (! this.#LOG) return;
    this.#logger.log(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (! this.#DEBUG) return;
    this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.#logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  error(...info) {
    this.#logger.error(this.#CLASS_NAME, ...info);
  }

  caught(e, msg, ...info) {
    // always log exceptoions
    this.#logger.error( this.#CLASS_NAME,
                        msg,
                        "\n name:    " + e.name,
                        "\n message: " + e.message,
                        "\n stack:   " + e.stack,
                        ...info
                      );
  }



  /* MISSING:
   * - - writeFile (writeMode)
   * - replaceFIle
   * - appendToFie
   * - writeJSONFile (and with writeMode)
   * - - writeObjectToJSONFile (writeMode)
   * - readJSONFile
   * - makeDirectory
   * - deleteDirectory
   * - - listFiles    (matchGLOB)
   * - - listFileInfo (matchGLOB)
   * - - list         (matchGLOB)
   * - - listInfo     (matchGLOB)  
   * - getFileSystemPathName
   */
  async testExists(test, fileName) {
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.exists(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
         this.debugAlways(`-- exists=${response.exists}`);
      }
    } catch (error) {
      this.caught(error, "testExists");
    }
  }

  async testIsRegularFile(test, fileName) {
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.isRegularFile(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
         this.debugAlways(`-- isRegularFile=${response.isRegularFile}`);
      }
    } catch (error) {
      this.caught(error, "testIsRegularFile");
    }
  }

  async testIsDirectory(test, directoryName) { // directoryName is optional
    try {
      this.debugAlways(`-- Testing ${test} -- directoryName="${directoryName}"`);
      const response = await this.fsBrokerApi.isDirectory(directoryName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
         this.debugAlways(`-- isDirectory=${response.isDirectory}`);
      }
    } catch (error) {
      this.caught(error, "testIsDirectory");
    }
  }

  async testHasFiles(test, directoryName) { // directoryName is optional
    try {
      this.debugAlways(`-- Testing ${test} -- directoryName="${directoryName}"`);
      const response = await this.fsBrokerApi.hasFiles(directoryName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
         this.debugAlways(`-- hasFiles=${response.hasFiles}`);
      }
    } catch (error) {
      this.caught(error, "testHasFiles");
    }
  }

  async testGetFileCount(test, directoryName) { // directoryName is optional
    try {
      this.debugAlways(`-- Testing ${test} -- directoryName="${directoryName}"`);
      const response = await this.fsBrokerApi.getFileCount(directoryName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
         this.debugAlways(`-- fileCount=${response.fileCount}`);
      }
    } catch (error) {
      this.caught(error, "testGetFileCount");
    }
  }

  async testWriteFile(test, fileName, data) { // MABXXX writeMode
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.writeFile(fileName, data);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        this.debugAlways(`-- wrote file into the extension directory, bytesWritten=${response.bytesWritten}`);
      }
    } catch (error) {
      this.caught(error, "testWriteFile");
    }
  }

  // MABXXX testReplaceFile
 
  // MABXXX testAppendToFile

  // MABXXX testWriteJSONFile

  async testWriteObjectToJSONFile(test, fileName, obj) { // MABXXX writeMode
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}" obj:`, obj);
      const response = await this.fsBrokerApi.writeObjectToJSONFile(fileName, obj);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        this.debugAlways(`-- wrote object to JSON file into the extension directory, bytesWritten=${response.bytesWritten}`);
      }
    } catch (error) {
      this.caught(error, "testWriteObjectToJSONFile -- writing JSON file into the extension directory");
    }
  }

  async testReadFile(test, fileName) {
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.readFile(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        this.debugAlways(`-- data="${response.data}"`);
      }
    } catch (error) {
      this.caught(error, "testReadFile");
    }
  }

  // MABXXX testReadJSONFile

  async testReadObjectFromJSONFile(test, fileName) {
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.readObjectFromJSONFile(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else if (! response.object) {
        this.debugAlways("-- GOT NO response.object");
      } else {
        this.debugAlways("-- object=", response.object);
      }
    } catch (error) {
      this.caught(error, "-- reading JSON file in the extension directory");
    }
  }

  // MABXXX testMakeDirectory

  async testGetFileInfo(test, fileName) { // fileName is optional
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.getFileInfo(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else if (! response.fileInfo) {
        this.debugAlways("-- GOT NO FileInfo");
      } else {
        const fileInfo = response.fileInfo;
        this.debugAlways( "-- fileInfo:"
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
    } catch (error) {
      this.caught(error, "testGetFileInfo");
    }
  }

  async testDeleteFile(test, fileName) {
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.deleteFile(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        this.debugAlways(`-- deleted="${response.deleted}"`);
      }
    } catch (error) {
      this.caught(error, "testDeleteFile");
    }
  }

  // MABXXX testDeleteDirectory (directoryName is optional) recursive???

  async testListFiles(test) { // MABXXX matchGlob
    try {
      this.debugAlways(`-- Testing ${test}`);
      const response = await this.fsBrokerApi.listFiles();
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        const list = response.fileNames;
        if (! list || list.length == 0) {
          this.debugAlways("-- no files in the extension directory");
        } else {
          this.debugAlways(`-- number extension files: list.length="${list.length}"`);
          for (const fileName of list) {
            this.debugAlways(`-- extension file: fileName="${fileName}"`);
          }
        }
      }
    } catch (error) {
      this.caught(error, "testListFiles");
    }
  }

  async testListFileInfo(test) { // MABXXX matchGlob
    try {
      this.debugAlways(`-- Testing ${test}`);
      const response = await this.fsBrokerApi.listFileInfo();
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        const list = response.fileInfo;
        if (! list || list.length == 0) {
          this.debugAlways("-- no files in the extension directory");
        } else {
          this.debugAlways(`-- number extension files: list.length="${list.length}"`);
          for (const fileInfo of list) {
            this.debugAlways( "-- fileInfo:"
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
      this.caught(error, "testListFileInfo");
    }
  }

  async testList(test) { // MABXXX matchGlob
    try {
      this.debugAlways(`-- Testing ${test}`);
      const response = await this.fsBrokerApi.list();
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        const list = response.fileNames;
        if (! list || list.length == 0) {
          this.debugAlways("-- no files in the extension directory");
        } else {
          this.debugAlways(`-- number extension files: list.length="${list.length}"`);
          for (const fileName of list) {
            this.debugAlways(`-- extension file: fileName="${fileName}"`);
          }
        }
      }
    } catch (error) {
      this.caught(error, "testList");
    }
  }

  async testListInfo(test) { // MABXXX matchGlob
    try {
      this.debugAlways(`-- Testing ${test}`);
      const response = await this.fsBrokerApi.listInfo();
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        const list = response.fileInfo;
        if (! list || list.length == 0) {
          this.debugAlways("-- no files in the extension directory");
        } else {
          this.debugAlways(`-- number extension files: list.length="${list.length}"`);
          for (const fileInfo of list) {
            this.debugAlways( "-- fileInfo:"
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
      this.caught(error, "testListInfo");
    }
  }

  async testGetFullPathName(test, fileName) { // fileName is optional
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.getFullPathName(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        this.debugAlways(`-- fullPathName="${response.fullPathName}"`);
      }
    } catch (error) {
      this.caught(error, "testGetFullPathName");
    }
  }

  async testIsValidFileName(test, fileName) {
    try {
      this.debugAlways(`-- Testing ${test} -- fileName="${fileName}"`);
      const response = await this.fsBrokerApi.isValidFileName(fileName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        this.debugAlways(`-- valid="${response.valid}"`);
      }
    } catch (error) {
      this.caught(error, "-- checking if filename is valid");
    }
  }

  async testIsValidDirectoryName(test, directoryName) {
    try {
      this.debugAlways(`-- Testing ${test} -- directoryName="${directoryName}"`);
      const response = await this.fsBrokerApi.isValidDirectoryName(directoryName);
      if (! response) {
        this.debugAlways("-- GOT NO RESPONSE");
      } else if (response.invalid) {
        this.debugAlways(`-- GOT INVALID RESPONSE: "${response.invalid}"`);
      } else if (response.error) {
        this.debugAlways(`-- GOT ERROR RESPONSE: "${response.error}"`);
      } else {
        this.debugAlways(`-- valid="${response.valid}"`);
      }
    } catch (error) {
      this.caught(error, "-- checking if filename is valid");
    }
  }

  // MABXXX testGetFileSystemPathName



  async testFileSystemApi() {
    this.debugAlways("\n\n********** TESTING FileSystemBroker (Using FileSystemBroker API) **********\n\n");

    await this.testIsValidFileName(        'if filename "file1.txt" is valid - YES',                  "file1.txt"                          );
    await this.testIsValidFileName(        'if filename "*" is valid - NO',                           "*"                                  );
    await this.testIsValidFileName(        'if filename "{" is valid - NO',                           "{"                                  );
    await this.testIsValidFileName(        'if filename ":" is valid - NO',                           ":"                                  );

    await this.testIsValidDirectoryName(   'if directoryname "dir1" is valid - YES',                  "dir1"                               );
    await this.testIsValidDirectoryName(   'if directoryname "d*r1" is valid - NO',                   "d*r1"                               );
    await this.testIsValidDirectoryName(   'if directoryname "d:r1" is valid - NO',                   "d:r1"                               );
    await this.testIsValidDirectoryName(   'if directoryname ".." is valid - NO',                     ".."                                 );

    await this.testExists(                 'if Extension Directory exists - YES'                                                           );
    await this.testIsDirectory(            'if Extension Directory is a Directory - YES'                                                   );
    await this.testList(                   'list ALL Files in Extension Directory'                                                         );
    await this.testListInfo(               'list FileInfo for ALL Files in Extension Directory'                                            );
    await this.testListFiles(              'list Regular Files in Extension Directory'                                                     );
    await this.testListFileInfo(           'list FileInfo for Regular Files in Extension Directory'                                        );
    await this.testExists(                 'if file "file1.txt" exists - NO',                         "file1.txt"                          );
    await this.testIsRegularFile(          'if file "file1.txt" is a Regular File - NO',              "file1.txt"                          );
    await this.testIsDirectory(            'if file "file1.txt" is a Directory - NO',                 "file1.txt"                          );
    await this.testGetFileInfo(            'get FileInfo for "file1.txt" - ERROR',                    "file1.txt"                          );

    await this.testWriteFile(              'write "data" to file "file1.txt"',                        "file1.txt",  "data"                 );
    await this.testExists(                 'if file "file1.txt" exists - YES',                        "file1.txt"                          );
    await this.testIsRegularFile(          'if file "file1.txt" is a Regular File - YES',             "file1.txt"                          );
    await this.testIsDirectory(            'if file "file1.txt" is a Directory - NO',                 "file1.txt"                          );
    await this.testGetFullPathName(        'get full PathName for "file1.txt"',                       "file1.txt"                          );
    await this.testGetFileInfo(            'get FileInfo for "file1.txt"',                            "file1.txt"                          );
    await this.testReadFile(               'read "data" from file "file1.txt"',                       "file1.txt"                          );
    await this.testList(                   'list ALL Files in Extension Directory'                                                         );
    await this.testListInfo(               'list FileInfo for ALL Files in Extension Directory'                                            );
    await this.testListFiles(              'list Regular Files in Extension Directory'                                                     );
    await this.testListFileInfo(           'list FileInfo for Regular Files in Extension Directory'                                        );

    await this.testWriteObjectToJSONFile(  'write object "x:x, y:y" to "xxx.json"',                   "xxx.json",   { 'x': 'x', 'y': 'y' } );
    await this.testExists(                 'if file "xxx.json" exists - YES',                         "xxx.json"                           );
    await this.testIsRegularFile(          'if file "xxx.json" is a Regular File - YES',              "xxx.json"                           );
    await this.testIsDirectory(            'if file "xxx.json" is a Directory - NO',                  "xxx.json"                           );
    await this.testGetFullPathName(        'get full PathName for "xxx.json"',                        "xxx.json"                           );
    await this.testListFiles(              'list Regular Files in Extension Directory',                                                    );
    await this.testGetFileInfo(            'get FileInfo for "xxx.json"',                             "xxx.json"                           );
    await this.testReadObjectFromJSONFile( 'read object "x:x, y:y" from "xxx.json"',                  "xxx.json"                           );

    await this.testDeleteFile(             'delete file "xxx.json" - DELETED',                        "xxx.json"                           );
    await this.testExists(                 'if file "xxx.json" exists - NO',                          "xxx.json"                           );
    await this.testIsRegularFile(          'if file "xxx.json" is a Regular File - NO',               "xxx.json"                           );
    await this.testIsDirectory(            'if file "xxx.json" is a Directory - NO',                  "xxx.json"                           );
    await this.testGetFullPathName(        'get full PathName for "xxx.json"',                        "xxx.json"                           );
    await this.testGetFileInfo(            'get FileInfo for "xxx.json" - ERROR',                     "xxx.json"                           );
    await this.testReadFile(               'read "data" from file "xxx.json" - ERROR',                "xxx.json"                           );
    await this.testList(                   'list ALL Files in Extension Directory'                                                         );
    await this.testDeleteFile(             'delete file "xxx.json" - ERROR???',                       "xxx.json"                           );

    await this.testDeleteFile(             'delete file "file1.txt" - DELETED',                       "file1.txt"                          );
    await this.testExists(                 'if file "file1.txt" exists - NO',                         "file1.txt"                          );
    await this.testIsRegularFile(          'if file "file1.txt" is a Regular File - NO',              "file1.txt"                          );
    await this.testIsDirectory(            'if file "file1.txt" is a Directory - NO',                 "file1.txt"                          );
    await this.testGetFullPathName(        'get full PathName for "file1.txt"',                       "file1.txt"                          );
    await this.testGetFileInfo(            'get FileInfo for "file1.txt" - ERROR',                    "file1.txt"                          );
    await this.testReadFile(               'read "data" from file "file1.txt" - ERROR',               "file1.txt"                          );
    await this.testList(                   'list ALL Files in Extension Directory'                                                         );
    await this.testDeleteFile(             'delete file "file1.txt" - ERROR???',                      "file1.txt"                          );

    this.debugAlways("\n\n********** DONE TESTING FileSystemBroker (Using FileSystemBroker API) **********\n\n");
  }

}
