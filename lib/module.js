"use babel";

const iconv = require("iconv-lite");
const execa = require("execa");

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

  divBlank = document.createElement("div");
  divBlank.setAttribute("style", "margin-bottom: 30px");

  dialog.appendChild(divStudentId);
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

export const welcomeBackMessage = studentId => {
  const message = `Welcome back ${studentId}!`;
  return message;
};

export const authSuccessMessage = `Login Success!`;

export const loginErrorMessage = `Login Error`;

export function gitCommitMac(cwd_path, childProcess) {
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
				git commit -m "commit log"
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
    }
  });
}

export function sendGitMac(
  cwd_path,
  loginName,
  serverUrl,
  workDir,
  studentId,
  childProcess
) {
  command_mac = `
			cd ${cwd_path};
			if !(type git > /dev/null 2>&1); then
				# gitをインストールする処理
				echo "Please install git"
			else
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
    }
  });
}

export async function gitCommitWindows(cwd_path, spawn) {
  const git_windows = `if exist .git (git add --all && git commit -m 'commit_message') else (git init & git add --all && git commit -m 'initial_commit')`;

  console.log(git_windows);
  console.log(cwd_path);

  const bat = spawn("cmd.exe", ["/c", git_windows], { cwd: `"${cwd_path}"` });

  bat.stdout.on("data", data => {
    const data_utf = iconv.decode(data, "SHIFT_JIS");
    console.log(data_utf);
  });
  bat.stderr.on("data", data => {
    const stderr = iconv.decode(data, "SHIFT_JIS");
    console.log(stderr);
  });
  bat.on("exit", data => {
    console.log(data);
  });
}
export async function sendGitWindows(
  cwd_path,
  loginName,
  serverUrl,
  workDir,
  studentId,
  spawn
) {
  const remove_git = `ssh ${loginName}@${serverUrl} rm -r ~/${workDir}/${studentId}/.git`;

  (async () => {
    try {
      const { stdout, exitCode, stderr } = await execa.commandSync(remove_git);

      if (exitCode == 0) {
        console.log("Remove git success!!");
      }
    } catch (error) {
      console.log(error);
    } finally {
      const git_windows = `scp -rC .git ${loginName}@${serverUrl}:${workDir}/${studentId}/.git`;
      try {
        const { stdout, exitCode, stderr } = execa.command(git_windows, {
          cwd: `${cwd_path}`,
          shell: true
        });
        if (exitCode == 0) {
          console.log("Send git success!!");
        } else {
          console.log(stderr);
        }
      } catch (error) {
        const error_utf = iconv.decode(error, "SHIFT_JIS");
        window.alert(error);
      }
    }
  })();
}
