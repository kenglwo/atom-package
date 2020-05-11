"use babel";
import path from "path";
import GitHookView from "./git-hook-view";
import { CompositeDisposable, BufferedProcess } from "atom";
import { createDiv, createDialogPanel, showDialog } from "./module";
import {
  welcomeBackMessage,
  authSuccessMessage,
  loginErrorMessage
} from "./module";
import { loginName, serverUrl } from "../temp/temp";
import { gitCommitMac, gitCommitWindows } from "./module";

const childProcess = require("child_process");
const { execFile } = require("child_process");
const { spawn } = require("child_process");

let studentId, studentName;
const workDir = "git";
let has_credentials = false;

// class Authentication {
//   constructor(obj) {
//     this.obj = obj;
//     this.studentId = obj.student_id;
//     this.studentName = obj.student_name;
//     this.url = obj.url;
//     this.username = obj.username;
//     this.password = obj.password;
//   }
//
//   serialize() {
//     return {
//       deserializer: "Authentication",
//       data: this.obj
//     };
//   }
// }

export default {
  gitHookView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.gitHookView = new GitHookView(state.gitHookViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.gitHookView.getElement(),
      visible: false
    });

    const platform = process.platform; // darwin, win32 or linux

    const dialog = createDialogPanel(createDiv);
    const panel = atom.workspace.addModalPanel({ item: dialog });

    submitButton.addEventListener("click", e => {
      studentId = document.getElementById("studentId").value.trim();
      studentName = document.getElementById("studentName").value.trim();
      studentName = studentName.replace(/\s+/g, "");

      if (studentId != "" && studentName != "") {
        if (platform == "darwin" || platform == "linux") {
          const ssh_mkdir = `ssh ${loginName}@${serverUrl} "mkdir -p ~/${workDir}/${studentId}/${studentName}" `;

          childProcess.exec(ssh_mkdir, (error, stdout, stderr) => {
            if (error) {
              window.alert(loginErrorMessage);
              has_credentials = false;
              window.alert(`stderr: ${stderr}`);
              return;
            }

            if (stderr.match(/File exists/)) {
              window.alert(welcomeBackMessage(studentName));
              panel.hide();
              has_credentials = true;
              return;
            }

            window.alert(authSuccessMessage);
            panel.hide();
            has_credentials = true;
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);

            // execute git commit!!!
            const cwd_path = atom.project.getPaths();
            gitCommitMac(
              cwd_path,
              loginName,
              serverUrl,
              workDir,
              studentId,
              childProcess,
              panel
            );
          }); // ###############################################################
        } else if (platform == "win32") {
          const ssh_mkdir_windows = `ssh ${loginName}@${serverUrl} mkdir -p ~/${workDir}/${studentId}/${studentName}`;
          const bat = spawn("cmd.exe", ["/c", ssh_mkdir_windows]);
          bat.stdout.on("data", data => {
            console.log(`stdout: ${data}`);
          });

          bat.stderr.on("data", data => {
            const stderr = String(data);
            if (stderr.match(/File exists/)) {
              window.alert(welcomeBackMessage(studentName));
              has_credentials = true;
              panel.hide();
            } else {
              window.alert(loginErrorMessage);
              window.alert(stderr);
            }
          });

          bat.on("close", code => {
            console.log(`child process exited with code ${code}`);
            if (code == 0) {
              has_credentials = true;
              panel.hide();
              window.alert(authSuccessMessage);

              // execute git commit!!
              const cwd_path = atom.project.getPaths();
              gitCommitWindows(
                cwd_path,
                loginName,
                serverUrl,
                workDir,
                studentId,
                spawn,
                panel
              );
            }
          });
        }
      } else {
        window.alert("Please fill in all input fields");
      }
      return false;
    });

    cancelButton.addEventListener("click", e => {
      panel.hide();
      return false;
    });

    atom.workspace.observeTextEditors(editor => {
      let buffer = editor.getBuffer();
      buffer.onDidSave(event => {
        const cwd_paths = atom.project.getPaths();
        if (cwd_paths.length > 1) {
          window.alert(
            "Multiple directories are opened. Just open one working directory"
          );
        } else {
          const cwd_path = cwd_paths[0];
          const dirName = path.basename(cwd_path);

          if (dirName == "r2enshu2") {
            if (has_credentials == true) {
              if (platform == "win32") {
                gitCommitWindows(
                  cwd_path,
                  loginName,
                  serverUrl,
                  workDir,
                  studentId,
                  spawn,
                  panel
                );
              } else {
                gitCommitMac(
                  cwd_path,
                  loginName,
                  serverUrl,
                  workDir,
                  studentId,
                  childProcess,
                  panel
                );
              }
            } else {
              window.alert("Please input credentials");
              panel.show();
            }
          }
        }
      });
    });

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "atom-package: show-dialog": () => showDialog(panel)
      })
    );

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "git-hook:onDidSave": () => this.onDidSave()
      })
    );
  },

  deactivate() {
    const path = atom.project.getPaths();

    // command_mac = `
    //   cd ${path};
    //   cp -r .git ${studentId}.git;
    //   sftp ${loginName}@${serverUrl} << EOF
    //   cd git
    //   put -r ${studentId}.git
    //   quit
    //   EOF
    // `;

    // command_windows = "cd " + path + " & xcopy .git " + studentId + ".git\  & " +
    //   "sftp " + loginName + "@" + serverUrl + " << EOF cd git put -r " + studentId + ".git quit EOF";

    // command_windows = ` cd ${path} & echo D | xcopy .git ${studentId}.git`;

    if (platform == "win32") {
      // childProcess.execSync(command_windows, (error, stdout, stderr) => {
      //   if(error) return window.alert(error);
      //   window.alert(stdout);
      //   window.alert(stderr);
      // });
      //
      // command_final = ` cd ${path} & rd /s ${studentId}.git`
      //
      // childProcess.execSync(command_final, (error, stdout, stderr) => {
      //   if(error) return window.alert(error);
      //   window.alert(stdout);
      //   window.alert(stderr);
      // });
    } else {
      // childProcess.execSync(command_mac, (error, stdout, stderr) => {
      //   if(error) return window.alert(error);
      //   window.alert(stdout);
      //   window.alert(stderr);
      // });
      // command_final = `
      //   rm -r ${studentId}.git
      // `;
      //
      // childProcess.execSync(command_final, (error, stdout, stderr) => {
      //   if(error) return window.alert(error);
      //   window.alert(stdout);
      //   window.alert(stderr);
      // });
    }

    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gitHookView.destroy();
  }

  // serialize() {
  //   return {
  //     gitHookViewState: this.gitHookView.serialize()
  //   };
  // },

  // deserializeAuthentication({ data }) {
  //   return new Authentication(data);
  // },

  // onDidSave() {
  //   atom.workspace.observeTextEditors(editor => {
  //     let buffer = editor.getBuffer();
  //     buffer.onDidSave(event => {
  //       window.alert("File Saved");
  //     });
  //   });
  // }
};
