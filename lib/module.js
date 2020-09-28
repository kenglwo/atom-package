"use babel";

import path from "path";
import http from "http";

const HOST = 'transgit.cla.kobe-u.ac.jp';
const PATH_LOGIN = '/api/login_student';
const PATH_CODE = '/api/save_code';
const PORT = 3001;
const workFolder = "r2enshu2";

export function createDiv(text, id, tabindex, ifAutoFocus, isPW) {
  div = document.createElement("div");
  div.setAttribute(
    "style",
    "margin-right:10px; margin-bottom: 10px;" +
      "font-size: 15px; font-weight:bold;"
  );
  div.appendChild(document.createTextNode(`${text} : `));

  input = document.createElement("input");
  input.setAttribute("id", id);
  input.setAttribute("style", "width:350px");
  input.setAttribute("tabindex", tabindex);

  if (ifAutoFocus) {
    input.autofocus = true;
  }

	if (isPW) {
		input.setAttribute("type", "password");
	}

  input.classList.add("native-key-bindings");
  div.appendChild(input);

  return div;
}

export function createDialogPanel(createDiv) {
  dialog = document.createElement("div");
  dialog.setAttribute("style", "width:100%");

  divStudentId = createDiv("Student ID", "studentId", 1, true, false);
  divClassCode = createDiv("Class Code", "classCode", 2, false, false);
  divClassPassword = createDiv("Class Password", "classPassword", 3, false, true);

  divBlank = document.createElement("div");
  divBlank.setAttribute("style", "margin-bottom: 30px");

  dialog.appendChild(divStudentId);
  dialog.appendChild(divClassCode);
  dialog.appendChild(divClassPassword);
  dialog.appendChild(divBlank);

  submitButton = document.createElement("button");
  submitButton.setAttribute("id", "submit");
  submitButton.textContent = "OK";
  submitButton.setAttribute("type", "button");
  submitButton.setAttribute("tabindex", "5");
  dialog.appendChild(submitButton);

  cancelButton = document.createElement("button");
  cancelButton.setAttribute("id", "cancel");
  cancelButton.textContent = "Cancel";
  cancelButton.setAttribute("type", "button");
  dialog.appendChild(cancelButton);

  return dialog;
}

export function showDialog(panel) {
  const cwd_paths = atom.project.getPaths();
  if (cwd_paths.length > 1) {
    window.alert(
      "Multiple directories are opened. Just open one working directory"
    );
  } else {
    const cwd_path = cwd_paths[0];
    const dirName = path.basename(cwd_path);
    if (dirName == workFolder) {
      panel.isVisible() ? panel.hide() : panel.show();
    }
  }
}

// export function onClickLoginButton(panel, studentId, classCode, classPassword){
// 	let ifLoginSuccess = false;
// 	studentId = document.getElementById("studentId").value.trim();
// 	classCode = document.getElementById("classCode").value.trim();
// 	classPassword = document.getElementById("classPassword").value.trim();
//
// 	if (studentId != "" && classCode != "" && classPassword != "") {
// 		// const cwd_path = atom.project.getPaths();
//
// 		let postData = {
// 				"studentId": studentId,
// 				"classCode": classCode,
// 				"classPassword": classPassword
// 		};
//
// 		let postDataStr = JSON.stringify(postData);
// 		let options = {
// 				host: HOST,
// 				port: PORT,
// 				path: PATH_LOGIN,
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'Content-Length': Buffer.byteLength(postDataStr)
// 				}
// 		};
//
// 		let req = http.request(options, (res) => {
// 			console.log('STATUS: ' + res.statusCode);
// 			console.log('HEADERS: ' + JSON.stringify(res.headers));
// 			res.setEncoding('utf8');
// 			res.on('data', (chunk) => {
// 				console.log('BODY: ' + chunk);
// 				switch(chunk) {
// 					case 'Success':
// 						ifLoginSuccess = true
// 						window.alert(chunk);
// 						panel.hide();
// 						req.end();
// 						return true;
// 						break;
// 					default:
// 						window.alert(chunk);
// 						return false;
// 				}
// 			});
// 		});
// 		req.on('error', (e) => {
// 			window.alert("Login Error");
// 			console.log('problem with request: ' + e.message);
// 			req.end();
// 			return false;
// 		});
//
// 		req.write(postDataStr);
// 		req.end();
//
// 		// console.log(`modlue:151 ${ifLoginSuccess}`)
// 		// return ifLoginSuccess;
// 	} else {
// 		window.alert("Please fill in all input fields");
// 	}
// }

export function onSaveFile(studentId){
		let postData = {
				"studentId": studentId,
				"fileName": "test",
				"code": "AAAAAA"
		};

		let postDataStr = JSON.stringify(postData);
		let options = {
				host: HOST,
				port: PORT,
				path: PATH,
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
						ifLoginSuccess = true
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
			return false;
		});

		req.write(postDataStr);
		req.end();

}
