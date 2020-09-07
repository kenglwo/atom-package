"use babel";
import path from "path";
import GitHookView from "./git-hook-view";
import { CompositeDisposable, BufferedProcess } from "atom";
import { createDiv, createDialogPanel, showDialog, onClickLoginButton } from "./module";
import {
  welcomeBackMessage,
  authSuccessMessage,
  loginErrorMessage
} from "./module";
import { loginName, serverUrl } from "../temp/temp";
import {
  gitCommitMac,
  sendGitMac,
  gitCommitWindows,
  sendGitWindows
} from "./module";

const childProcess = require("child_process");
const { execFile } = require("child_process");
const { spawn } = require("child_process");
const iconv = require("iconv-lite");
const execa = require("execa");


let studentId;
let classCode;
let classPassword;
const workDir = "git";
const workFolder = "r2enshu2";
let has_credentials = false;

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
			classPassword: this.classPassword
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
      visible: false
    });

		// const auth = deserializeAuthData({studentId, classCode, classPassword}){
		// 	return new AuthData(studentId, classCode, classPassword)
		// }

    const platform = process.platform; // darwin, win32 or linux

    const dialog = createDialogPanel(createDiv);
    const panel = atom.workspace.addModalPanel({ item: dialog });

    submitButton.addEventListener("click", e => {
			has_credentials = onClickLoginButton(panel, studentId, classCode, classPassword);
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

          if (dirName == workFolder) {
            // execute git
            if (platform == "win32") {
              // gitCommitWindows(cwd_path, spawn);

              // ####################
              if (has_credentials == true) {
                (async () => {
                  await gitCommitWindows(cwd_path, spawn);
                  await sendGitWindows(
                    cwd_path,
                    loginName,
                    serverUrl,
                    workDir,
                    studentId,
                    spawn
                  );
                })().catch(e => console.error(e));
              } else {
                gitCommitWindows(cwd_path, spawn);
              }
              // ####################
            } else {
              gitCommitMac(cwd_path, childProcess);
            }

            if (has_credentials == true) {
              if (platform == "win32") {
                // sendGitWindows(
                //   cwd_path,
                //   loginName,
                //   serverUrl,
                //   workDir,
                //   studentId,
                //   spawn
                // );
              } else {
                sendGitMac(
                  cwd_path,
                  loginName,
                  serverUrl,
                  workDir,
                  studentId,
                  childProcess
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

    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gitHookView.destroy();
  }
};
