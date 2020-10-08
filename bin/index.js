#!/usr/bin/env node

const chalk = require('chalk');
const cli = require('cli');
const args = process.argv.slice(2);
const fs = require("fs");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const pmPath = path.join(process.mainModule.path, "../");
const projectsPath = path.join(process.mainModule.path, "../templates/");

const message = (text) => {
	console.log(chalk.cyan(text));
}

const success = (text) => {
	console.log(chalk.green(text));
}

const highlight = (text) => {
	console.log(chalk.magenta(text));
}

const normal = (text) => {
	console.log(text);
}

const error = (text) => {
	console.log(chalk.red(text));
	cli.exit();
}

const actionInPM = async (action) => {
	await exec(`cd ${pmPath} && ${action}`);
};

cli.main(async () => {
	switch(args[0]){
		case "new":
			switch(args[1]){
				case "project":
					const template = args[2];
					const path = args[3];
					const current_path = process.cwd();
					const project_path = current_path + "/" + path;

					if (!fs.existsSync(projectsPath + template)) {
						error(`Error: ${template} doesn't exists`);
					}

					if (fs.existsSync(project_path)) {
						error(`Error: ${project_path} already exists`);
					}

					await exec(`mkdir ${path}`);
					await exec(`cp -R ${projectsPath}/${template}/ ./${path} && rm -rf ./${path}/.git`);
					await exec(`cd ./${path} && yarn && git init && git add --all && git commit -m "First commit"`);
					break;
				case "template":
					message("Installing template...");
					const template_url = args[2];
					const template_name = args[3];
					const save = args[4] == "--save" ? true : false;
					await actionInPM(`git submodule --quiet add ${template_url} templates/${template_name}`);
					await actionInPM(`git submodule --quiet update --init --recursive`);
					if( save ){
						await actionInPM(`git add --all && git commit -m "feat: template ${template_name} added to the project" && git push`);
					}
					success("Templated saved successfully");
					break;
				default:
					break;
			}
			break;
		case "update":
			message("Updating templates...");
			await actionInPM(`git submodule --quiet update --init --recursive`);
			await actionInPM(`git submodule foreach git pull origin master`);
			await actionInPM(`git pull`);
			await actionInPM(`git add --all && git commit -m "feat: templates version update" && git push`);
			message("Templates updated successfully");
			break;
		case "help":
			success("Usage:")
			highlight("$ pm new project $template $project_name");
			message("Templates available:");
			const templates = fs.readdirSync(projectsPath);
			templates.map((file) => {
				normal("\t -> "+file);
			});
			message("\n");
			highlight("$ pm new template $template_url $template_name --save?\n");
			highlight("$ pm update\n");
			break;
		default:
			break;
	}
});
