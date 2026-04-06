const { spawn } = require("child_process");

function run(file) {
    const p = spawn("node", [file]);

    p.stdout.on("data", data => console.log(`[${file}] ${data}`));
    p.stderr.on("data", data => console.error(`[${file} ERROR] ${data}`));
}

run("index.js");
run("dashboard.js");
