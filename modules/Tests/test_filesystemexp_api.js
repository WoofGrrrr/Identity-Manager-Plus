import { formatMsToDateTime12HR } from '../utilities.js';

export class FileSystemExpApiTest {
  #CLASS_NAME = this.constructor.name;

  #LOG   = false;
  #DEBUG = false;
  #logger;



  constructor(logger) {
    this.#logger = logger;
  }
  


  log(...info) {
    if (this.#LOG) this.#logger.log(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (this.#DEBUG) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.#logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  error(...info) {
    // always log errors
    this.#logger.error(this.#CLASS_NAME, ...info);
  }

  caught(e, msg, ...info) {
    // always log exceptions
    this.#logger.error( this.#CLASS_NAME,
                        msg,
                        "\n- name:    " + e.name,
                        "\n- message: " + e.message,
                        "\n- stack:   " + e.stack,
                        ...info
                      );
  }



  async testFileSystemExpApi() {
    this.debugAlways("\n\n********** TESTING FileSystemExp API (using Extension Experiments API) **********\n\n");

    try {
      this.debugAlways('-- if filename "file1.txt" is valid');
      const valid = await messenger.FileSystemExp.isValidFileName("file1.txt");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if filename is valid");
    }

    try {
      this.debugAlways('-- if filename "*" is valid');
      const valid = await messenger.FileSystemExp.isValidFileName("*");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if filename is valid");
    }

    try {
      this.debugAlways('-- if filename "{" is valid');
      const valid = await messenger.FileSystemExp.isValidFileName("{");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if filename is valid");
    }

    try {
      this.debugAlways('-- if filename ":" is valid');
      const valid = await messenger.FileSystemExp.isValidFileName(":");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if filename is valid");
    }

    try {
      this.debugAlways('-- if directoryname "dir1" is valid');
      const valid = await messenger.FileSystemExp.isValidDirectoryName("dir1");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if directoryname is valid");
    }

    try {
      this.debugAlways('-- if directoryname "d*r1" is valid');
      const valid = await messenger.FileSystemExp.isValidDirectoryName("d*r1");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if directoryname is valid");
    }

    try {
      this.debugAlways('-- if directoryname "{" is valid');
      const valid = await messenger.FileSystemExp.isValidDirectoryName("{");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if directoryname is valid");
    }

    try {
      this.debugAlways('-- if directoryname "d:r1" is valid');
      const valid = await messenger.FileSystemExp.isValidDirectoryName("d:r1");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if directoryname is valid");
    }

    try {
      this.debugAlways('-- if directoryname ".." is valid');
      const valid = await messenger.FileSystemExp.isValidDirectoryName("//");
      this.debugAlways(`-- valid="${valid}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if directoryname is valid");
    }

    let fileNameList;
    try {
      this.debugAlways('-- getting list of files in the extension directory');
      fileNameList = await messenger.FileSystemExp.listFiles();
    } catch (error) {
      this.caught(error, "-- Caught exception while listing files in the extension directory");
    }
    if (! fileNameList || fileNameList.length == 0) {
      this.debugAlways("-- no files in the extension directory");
    } else {
      this.debugAlways(`-- number extension files: fileNameList.length="${fileNameList.length}"`);
      for (const fileName of fileNameList) {
        this.debugAlways(`-- extension file: fileName="${fileName}"`);
      }
    }

    try {
      this.debugAlways('-- checking if file "file1.txt" exists in the extension directory');
      const exists = await messenger.FileSystemExp.exists("file1.txt");
      this.debugAlways(`-- exists=${exists}`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if file exists in the extension directory");
    }

    try {
      this.debugAlways('-- writing file "file1.txt" into the extension directory');
      const bytesWritten = await messenger.FileSystemExp.writeFile("file1.txt", "data");
      this.debugAlways(`-- wrote file into the extension directory, bytesWritten=${bytesWritten}`);
    } catch (error) {
      this.caught(error, "-- Caught exception while writing file into the extension directory");
    }

    try {
      this.debugAlways('-- checking if file "file1.txt" exists in the extension directory');
      const exists = await messenger.FileSystemExp.exists("file1.txt");
      this.debugAlways(`-- exists=${exists}`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if file exists in the extension directory");
    }

    try {
      this.debugAlways('-- getting Full Pathname for file "file1.txt" in the extension directory');
      const path = await messenger.FileSystemExp.getFullPathName("file1.txt");
      this.debugAlways(`-- path="${path}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while getting the full pathname of the file in the extension directory");
    }

    try {
      this.debugAlways('-- getting FileInfo for file "file1.txt" in the extension directory');
      const fileInfo = await messenger.FileSystemExp.getFileInfo("file1.txt");
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
    } catch (error) {
      this.caught(error, "-- Caught exception while getting FileInfo for the file in the extension directory");
    }

    try {
      this.debugAlways('-- reading file "file1.txt" in the extension directory');
      const data = await messenger.FileSystemExp.readFile("file1.txt");
      this.debugAlways(`-- data="${data}"`);
    } catch (error) {
      this.caught(error, "-- Caught exception while reading file in the extension directory");
    }

    try {
      this.debugAlways("-- getting list of files in the extension directory");
      fileNameList = await messenger.FileSystemExp.listFiles();
    } catch (error) {
      this.caught(error, "-- Caught exception while listing files in the extension directory");
    }
    if (! fileNameList || fileNameList.length == 0) {
      this.debugAlways("-- no files in the extension directory");
    } else {
      this.debugAlways(`-- number extension files: fileNameList.length="${fileNameList.length}"`);
      for (const fileName of fileNameList) {
        this.debugAlways(`-- extension file: fileName="${fileName}"`);
      }
    }

    try {
      this.debugAlways('-- deleting file "file1.txt" from the extension directory');
      await messenger.FileSystemExp.deleteFile("file1.txt");
    } catch (error) {
      this.caught(error, "-- Caught exception while deleting file from the extension directory");
    }

    try {
      this.debugAlways('-- checking if file "file1.txt" exists in the extension directory');
      const exists = await messenger.FileSystemExp.exists("file1.txt");
      this.debugAlways(`-- exists=${exists}`);
    } catch (error) {
      this.caught(error, "-- Caught exception while checking if file exists in the extension directory");
    }

    this.debugAlways("\n\n********** DONE TESTING FileSystemExp API (using Extension Experiments API) **********\n\n");
  }

}
