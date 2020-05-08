"use babel";

export function createDiv(text, id, tabindex, ifAutoFocus) {
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

  input.classList.add("native-key-bindings");
  div.appendChild(input);

  return div;
}

export function createDialogPanel(createDiv) {
  dialog = document.createElement("div");
  dialog.setAttribute("style", "width:100%");

  divStudentId = createDiv("Student ID", "studentId", 1, true);
  divStudentName = createDiv("Your Name", "studentName", 2, false);

  divBlank = document.createElement("div");
  divBlank.setAttribute("style", "margin-bottom: 30px");

  dialog.appendChild(divStudentId);
  dialog.appendChild(divStudentName);
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
  if (panel.isVisible()) {
    panel.hide();
  } else {
    panel.show();
  }
}

export const welcomeBackMessage = studentName => {
  const message = `Welcome back ${studentName}!`;
  return message;
};

export const authSuccessMessage = `Login Success!`;

export const loginErrorMessage = `Login Error`;

export function gitCommitMac(
  cwd_path,
  loginName,
  serverUrl,
  workDir,
  studentId,
  childProcess,
  panel
) {
  command_mac = `
			cd ${cwd_path};
			if !(type git > /dev/null 2>&1); then
				# gitをインストールする処理
				echo "Please install git"
			else
				# gitがインストールされている場合
				if [ ! -e ./.git ]; then # cwdをgit管理していない場合
					git init
					chmod -R 766 .git
				fi
				git add --all;
				git commit -m "commit log" &&
				rsync -auz -e ssh .git ${loginName}@${serverUrl}:${workDir}/${studentId};
				exit
			fi
		`;

  childProcess.exec(command_mac, (error, stdout, stderr) => {
    if (error) {
      // window.alert(stderr);
      console.log(`stdout: ${stdout}`);
      console.log(`stderrr: ${stderr}`);
    } else {
      console.log(stdout);
      console.log(stderr);
      console.log("Hi Hi");
    }
  });
}

export function gitCommitWindows(
  cwd_path,
  loginName,
  serverUrl,
  workDir,
  studentId,
  spawn,
  panel
) {
  const remove_git = ` ssh ${loginName}@${serverUrl} rm -r ~/${workDir}/${studentId}/.git`;
  const pre_bat = spawn("cmd.exe", ["/c", remove_git]);
  pre_bat.stdout.on("data", data => {
    console.log(data);
  });
  pre_bat.stderr.on("data", data => {
    console.log(data);
  });
  pre_bat.on("exit", data => {
    console.log(data);
  });

  const git_windows = ` cd ${cwd_path} & if exist .git (git add --all && git commit -m 'commit_message' & scp -rC .git ${loginName}@${serverUrl}:${workDir}/${studentId}/.git) else (git init & git add --all && git commit -m 'initial_commit' & scp -rC .git ${loginName}@${serverUrl}:${workDir}/${studentId}/.git) `;
  const bat = spawn("cmd.exe", ["/c", git_windows]);

  bat.stdout.on("data", data => {
    console.log(data);
  });
  bat.stderr.on("data", data => {
    console.log(data);
  });
  bat.on("exit", data => {
    console.log(data);
  });
}
