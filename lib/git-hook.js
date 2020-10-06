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

const childProcess = require("child_process");
const { execFile } = require("child_process");
const { spawn } = require("child_process");

let studentId;
let classCode;
let classPassword;
const workDir = "git";
const workFolder = "r2enshu2";
let has_credentials = false;
let connectionCount = 0;

let prevSavedCodeArray = [];
let savedCodeArray = [];

const cwd_paths = atom.project.getPaths();
const outPath = path.join(cwd_paths[0], 'config', 'saved_code.json');

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

		fs.readFile(outPath, "utf-8", (err, data) => {
			if (err){
				console.log(err);
			} else {
				prevSavedCodeArray = JSON.parse(data);
			}
		});

		const credentialPath = path.join(atom.project.getPaths()[0], "config", "myinfo.json");
		if(fs.existsSync(credentialPath)){
			let text = fs.readFileSync(credentialPath, 'utf-8');
			const credentialJson = JSON.parse(text);
			has_credentials = true;
			studentId = credentialJson.studentID;
			classCode = credentialJson.classCode;
			classPassword = credentialJson.classPassword;

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
							connectionCount += 1;
							if(connectionCount == 1){ window.alert("Connection Success!") }


							// send saved code data if saved_code.json is not empty
							if (prevSavedCodeArray.length > 0){
									const postDataStr = JSON.stringify(prevSavedCodeArray);
									const options = {
											host: HOST,
											port: PORT,
											path: PATH_CODE,
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'Content-Length': Buffer.byteLength(postDataStr)
											}
									};
									const req = http.request(options, (res) => {
										res.setEncoding('utf8');
										res.on('data', (chunk) => {
											switch(chunk) {
												case 'Success':
													connectionCount += 1;
													if(connectionCount == 1){ window.alert("Connection Success!") }
													// initialize saved_code.json
													prevSavedCodeArray = [];
													break;
												default:
													window.alert(chunk);
											}
										});
									});
									req.on('error', (e) => {
										window.alert("Network Disconnected");
										console.log('problem with request: ' + e.message);
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

			req.on('error', (e) => {
				window.alert("Login Error");
				console.log('problem with request: ' + e.message);
				req.end();
			});

			req.write(postDataStr);
			req.end();
		} else { window.alert("myinfo.json not found. Your data will be saved in code_log.json."); }


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

          // if (dirName == workFolder) {
						const filepath = buffer.getPath();
						const filename = path.basename(event.path);
						const code = buffer.getText();

						const date = new Date();
						const savedAt = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
						if ( has_credentials ) {

							if(buffer.isModified()){

								const postDataArray = [];
								const postData = {
										"student_id": studentId,
										"filename": filename,
										"code": code,
										"saved_at": savedAt
								};
								postDataArray.push(postData);

								const postDataStr = JSON.stringify(postDataArray);
								const options = {
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
									window.alert(`Network Disconnected
Your data is saved at local`);
									console.log('problem with request: ' + e.message);
									req.end();
									// save code data in a file
									const codeData = {
											"student_id": studentId,
											"filename": filename,
											"code": code,
											"saved_at": savedAt
									};
									savedCodeArray.push(codeData);
									console.log(savedCodeArray);

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
					// } 
				}
			});
		});

    // this.subscriptions = new CompositeDisposable();
    // this.subscriptions.add(
    //   atom.commands.add("atom-workspace", {
    //     "atom-package: show-dialog": () => showDialog(panel)
    //   })
    // );

    // this.subscriptions.add(
    //   atom.commands.add("atom-workspace", {
    //     "git-hook:onDidSave": () => this.onDidSave()
    //   })
    // );
  },

  deactivate() {
	const outCodeArray = prevSavedCodeArray.length > 0 ? prevSavedCodeArray.concat(savedCodeArray) : savedCodeArray

		fs.writeFile(outPath, JSON.stringify(outCodeArray, null, '    '), (err) => {
			if(err){
				window.alert(err);
				console.log(err);
				throw err;
			} else {
				console.log("write success!!");
			}
		});
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gitHookView.destroy();
  }
};
