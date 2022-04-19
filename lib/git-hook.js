"use babel";
import path from "path";
import http from "http";
import fs from "fs";
import GitHookView from "./git-hook-view";
import { CompositeDisposable, BufferedProcess } from "atom";
// import { createDiv, createDialogPanel, showDialog, onClickLoginButton } from "./module";
// import {
//   welcomeBackMessage,
//   authSuccessMessage,
//   loginErrorMessage
// } from "./module";
import { loginName, serverUrl } from "../temp/temp";
import {
  gitCommitMac,
  sendGitMac,
  gitCommitWindows,
  sendGitWindows,
} from "./module";

const childProcess = require("child_process");
const { execFile } = require("child_process");
const { spawn } = require("child_process");

let studentID;
let classCode;
let classPassword;
const workDir = "git";
let workFolder = "none";
let has_credentials = false;
let connectionCount = 0;

let prevSavedCodeArray = [];
let savedCodeArray = [];

const cwd_paths = atom.project.getPaths();
const projectName = cwd_paths.length > 0 ? cwd_paths[0] : "none";
const outPath =
  cwd_paths.length > 0
    ? path.join(cwd_paths[0], "config", "saved_code.json")
    : "";

const HOST = "kento.cla.kobe-u.ac.jp";
const PATH_LOGIN = "/api/login_student";
const PATH_CODE = "/api/save_code";
const PORT = 3001;

class AuthData {
  constructor(studnetId, classCode, classPassword) {
    this.studentId = obj.student_id;
    this.classCode = classCode;
    this.classPassword = classPassword;
  }

  serialize() {
    return {
      deserializer: "AuthData",
      studentId: this.studentId,
      classCode: this.classCode,
      classPassword: this.classPassword,
    };
  }
}

export default {
  gitHookView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.gitHookView = new GitHookView(state.gitHookViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.gitHookView.getElement(),
      visible: false,
    });

    // const auth = deserializeAuthData({studentId, classCode, classPassword}){
    // 	return new AuthData(studentId, classCode, classPassword)
    // }

    const platform = process.platform; // darwin, win32 or linux

    // const dialog = createDialogPanel(createDiv);
    // const panel = atom.workspace.addModalPanel({ item: dialog });

    fs.readFile(outPath, "utf-8", (err, data) => {
      if (err) {
        console.log(err);
        window.alert(err);
      } else {
        prevSavedCodeArray = JSON.parse(data);
      }
    });

    const credentialPath =
      cwd_paths.length > 0
        ? path.join(cwd_paths[0], "config", "myinfo.json")
        : "";
    if (fs.existsSync(credentialPath)) {
      let text = fs.readFileSync(credentialPath, "utf-8");
      const credentialJson = JSON.parse(text);
      has_credentials = true;
      workFolder = credentialJson.projectFolderName;
      studentID = credentialJson.studentID;
      classCode = credentialJson.classCode;
      classPassword = credentialJson.classPassword;

      let postData = {
        student_id: studentID,
        class_code: classCode,
        class_password: classPassword,
      };

      let postDataStr = JSON.stringify(postData);
      let options = {
        host: HOST,
        port: PORT,
        path: PATH_LOGIN,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postDataStr),
        },
      };
      let req = http.request(options, (res) => {
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          switch (chunk) {
            case "Success":
              connectionCount += 1;
              if (connectionCount == 1) {
                window.alert("Connection Success!");
              }

              // send saved code data if saved_code.json is not empty
              if (prevSavedCodeArray.length > 0) {
                const postDataStr = JSON.stringify(prevSavedCodeArray);
                const options = {
                  host: HOST,
                  port: PORT,
                  path: PATH_CODE,
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(postDataStr),
                  },
                };
                const req = http.request(options, (res) => {
                  res.setEncoding("utf8");
                  res.on("data", (chunk) => {
                    switch (chunk) {
                      case "Success":
                        connectionCount += 1;
                        if (connectionCount == 1) {
                          window.alert("Connection Success!");
                        }
                        // initialize saved_code.json
                        prevSavedCodeArray = [];
                        break;
                      default:
                        window.alert(chunk);
                    }
                  });
                });
                req.on("error", (e) => {
                  window.alert("Network Disconnected");
                  window.alert(e.message);
                  console.log("problem with request: " + e.message);
                  req.end();
                });

                req.write(postDataStr);
                req.end();
              }

              break;
            default:
              window.alert(chunk);
          }
        });
      });

      req.on("error", (e) => {
        window.alert("Login Error");
        window.alert(e.message);
        console.log("problem with request: " + e.message);
        req.end();
      });

      req.write(postDataStr);
      req.end();
    } else {
      // window.alert("myinfo.json not found in the class folder. If the class folder is opend, your data is saved in ./config/code_log.json.");
    }

    atom.workspace.observeTextEditors((editor) => {
      let buffer = editor.getBuffer();
      buffer.onWillSave((event) => {
        const cwd_paths = atom.project.getPaths();
        if (cwd_paths.length > 1) {
          window.alert(
            "Multiple directories are opened. Just open one working directory"
          );
        } else {
          const cwd_path = cwd_paths[0];
          const dirName = path.basename(cwd_path);

          if (dirName == workFolder) {
            const filepath = buffer.getPath();
            const dirpath = path.dirname(filepath);
            const dirpathArray =
              platform === "win32" ? dirpath.split("\\") : dirpath.split("/");
            const filename = path.join(
              dirpathArray[dirpathArray.length - 1],
              path.basename(event.path)
            );
            const code = buffer.getText();

            const date = new Date();
            const savedAt = `${date.getFullYear()}-${
              date.getMonth() + 1
            }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            if (has_credentials) {
              if (buffer.isModified()) {
                const postDataArray = [];
                const postData = {
                  student_id: studentID,
                  filename: filename,
                  code: code,
                  saved_at: savedAt,
                  class_code: classCode,
                };
                postDataArray.push(postData);

                const postDataStr = JSON.stringify(postDataArray);
                const options = {
                  host: HOST,
                  port: PORT,
                  path: PATH_CODE,
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(postDataStr),
                  },
                };
                let req = http.request(options, (res) => {
                  res.setEncoding("utf8");
                  res.on("data", (chunk) => {
                    // console.log("BODY: " + chunk);
                  });
                });

                req.on("error", (e) => {
                  window.alert(`Network Disconnected
Your data is saved at local`);
                  console.log("problem with request: " + e.message);
                  window.alert(e.message);
                  req.end();
                  // save code data in a file
                  const codeData = {
                    student_id: studentId,
                    filename: filename,
                    code: code,
                    saved_at: savedAt,
                  };
                  savedCodeArray.push(codeData);
                });

                req.write(postDataStr);
                req.end();
              }
            } else {
              // window.alert("Please input credentials");
              // panel.show();
              // window.addEventListener('online', (e) => {
              // 		console.log('onlineです。');
              // });
              //
              // window.addEventListener('offline', (e) => {
              // 		console.log('offlineです。');
              // });
            }
          }
        }
      });
    });

    // Observe image files added
    const disposable = atom.project.onDidChangeFiles((events) => {
      for (const event of events) {
        // "created", "modified", "deleted", or "renamed"
        if (event.action == "created") {
          const image_extensions = ["png", "jpeg", "jpg", "svg", "gif"];
          const is_image = image_extensions.some((ext) =>
            event.path.includes(ext)
          );
          if (is_image) {
            const image_path = event.path;
            const extension = path.extname(image_path).replace(".", "");
            let content_type = "";
            switch (extension) {
              case "png":
                content_type = "png";
                break;
              case "jpeg" || "jpg":
                content_type = "jpeg";
                break;
              case "gif":
                content_type = "gif";
                break;
              case "svg":
                content_type = "svg+xml";
                break;
            }
            fs.readFile(image_path, (err, data) => {
              if (err) {
                window.alert(err);
                console.log(err);
              }
              // send image data to the server;
              const options = {
                host: HOST,
                port: PORT,
                path: "/api/save_image",
                method: "POST",
                headers: {
                  "Content-Type": content_type,
                  "Content-Length": Buffer.byteLength(data),
                },
              };
              const req = http.request(options, (res) => {
                res.setEncoding("utf8");
                res.on("data", (chunk) => {
                  switch (chunk) {
                    case "success":
                      console.log("image successfully saved!");
                      break;
                    default:
                      window.alert(chunk);
                  }
                });
              });
              req.on("error", (e) => {
                window.alert("Image cannot be sent to the server");
                window.alert(e.message);
                console.log(e.message);
                req.end();
              });

              // req.write(postDataStr);
              req.end();
            });
          }
        }
      }
    });
  },

  deactivate() {
    const outCodeArray =
      prevSavedCodeArray.length > 0
        ? prevSavedCodeArray.concat(savedCodeArray)
        : savedCodeArray;

    const path =
      cwd_paths.length > 0
        ? path.join(cwd_paths[0], "config", "myinfo.json")
        : "none";
    if (fs.existsSync(path)) {
      fs.writeFile(
        outPath,
        JSON.stringify(outCodeArray, null, "    "),
        (err) => {
          if (err) {
            window.alert(err);
            console.log(err);
            throw err;
          } else {
            console.log("write success!!");
          }
        }
      );
    }

    disposable.dispose();
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gitHookView.destroy();
  },
};
