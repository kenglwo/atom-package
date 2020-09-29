"use babel";
import path from "path";
import http from "http";
import fs from "fs";
import GitHookView from "./git-hook-view";
import { CompositeDisposable, BufferedProcess } from "atom";
import { createDiv, createDialogPanel, showDialog, onClickLoginButton } from "./module";
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
  sendGitWindows
} from "./module";
import {myStudentID, myClassCode, myClassPassword} from "./credential.js";


const childProcess = require("child_process");
const { execFile } = require("child_process");
const { spawn } = require("child_process");

let studentId;
let classCode;
let classPassword;
const workDir = "git";
const workFolder = "r2enshu2";
let has_credentials = false;

const HOST = 'kento.cla.kobe-u.ac.jp';
const PATH_LOGIN = '/api/login_student';
const PATH_CODE = '/api/save_code';
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

		const credentialPath = __dirname + "/credential.js";
		if(fs.existsSync(credentialPath)){
			has_credentials = true;
			studentId = myStudentID;
			classCode = myClassCode;
			classPassword = myClassPassword;

				let postData = {
						"studentId": studentId,
						"classCode": classCode,
						"classPassword": classPassword
				};

				let postDataStr = JSON.stringify(postData);
				let options = {
						host: HOST,
						port: PORT,
						path: PATH_LOGIN,
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Content-Length': Buffer.byteLength(postDataStr)
						}
				};
				let req = http.request(options, (res) => {
					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						switch(chunk) {
							case 'Success':
								break;
							default:
								window.alert(chunk);
						}
					});
				});

			req.on('error', (e) => {
				window.alert("Login Error");
				console.log('problem with request: ' + e.message);
				req.end();
			});

			req.write(postDataStr);
			req.end();
		} else { console.log("credentail not found"); }

    submitButton.addEventListener("click", e => {
			// has_credentials = onClickLoginButton(panel, studentId, classCode, classPassword);
			studentId = document.getElementById("studentId").value.trim();
			classCode = document.getElementById("classCode").value.trim();
			classPassword = document.getElementById("classPassword").value.trim();

			if (studentId != "" && classCode != "" && classPassword != "") {

				let postData = {
						"studentId": studentId,
						"classCode": classCode,
						"classPassword": classPassword
				};

				let postDataStr = JSON.stringify(postData);
				let options = {
						host: HOST,
						port: PORT,
						path: PATH_LOGIN,
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Content-Length': Buffer.byteLength(postDataStr)
						}
				};
				let req = http.request(options, (res) => {
					console.log('STATUS: ' + res.statusCode);
					console.log('HEADERS: ' + JSON.stringify(res.headers));
					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						console.log('BODY: ' + chunk);
						switch(chunk) {
							case 'Success':
								has_credentials = true
								window.alert(chunk);
								panel.hide();
								break;
							default:
								window.alert(chunk);
						}
					});
				});

			req.on('error', (e) => {
				window.alert("Login Error");
				console.log('problem with request: ' + e.message);
				req.end();
			});

			req.write(postDataStr);
			req.end();
			console.log(`has_credentials: ${has_credentials}`)
			} else {
				window.alert("Please fill in all input fields");
			}
		});

    cancelButton.addEventListener("click", e => {
      panel.hide();
      return false;
    });

    atom.workspace.observeTextEditors(editor => {
      let buffer = editor.getBuffer();
      buffer.onWillSave(event => {
        const cwd_paths = atom.project.getPaths();
        if (cwd_paths.length > 1) {
          window.alert(
            "Multiple directories are opened. Just open one working directory"
          );
        } else {
          const cwd_path = cwd_paths[0];
          const dirName = path.basename(cwd_path);

          if (dirName == workFolder) {
						if ( has_credentials ) {

							if(buffer.isModified()){
								const filepath = buffer.getPath();
								const filename = path.basename(event.path);

								const code = buffer.getText();

								let postData = {
										"student_id": studentId,
										"filename": filename,
										"code": code
								};

								let postDataStr = JSON.stringify(postData);
								let options = {
										host: HOST,
										port: PORT,
										path: PATH_CODE,
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
											'Content-Length': Buffer.byteLength(postDataStr)
										}
								};
								let req = http.request(options, (res) => {
									res.setEncoding('utf8');
									res.on('data', (chunk) => {
										console.log('BODY: ' + chunk);
									});
								});

								req.on('error', (e) => {
									window.alert("Code Upload Error");
									console.log('problem with request: ' + e.message);
									req.end();
								});

								req.write(postDataStr);
								req.end();
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
