import { log } from "node:console";
import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path/win32";

// type definitions
type available_skill =
	| "HTML"
	| "JAVASCRIPT"
	| "CSS"
	| "NODEJS"
	| "REACT"
	| "TYPESCRIPT"
	| "MONGODB"
	| "EXPRESS"
	| "ANGULAR"
	| "JAVA"
	| "SPRINGBOOT"
	| "DOCKER"
	| "KUBERNETES";

type skill_level = "critical" | "average" | "good" | "excellent";
interface Skill {
	name: available_skill;
	level: skill_level;
}
interface Student {
	id: string;
	first_name: string;
	last_name: string;
	present: boolean;
	skills: Skill[];
}
class Class_Manger {
	constructor() {}
	add_student(student: Student) {}
	mark_attendance() {}
	add_skill() {}
	show_student_record() {}
	show_valid_students() {}
	save_data_file() {}
	load_data_file() {}
	exit() {}
	data: Student[] = [];
}

function generate_id() {
	return crypto.randomUUID().toLocaleUpperCase().slice(0, 4);
	// keep the IDs short
}
async function read_json_file(path: string) {
	const formated_path = join("src", path);
	const data = (await readFile(formated_path)).toLocaleString();
	const json = JSON.parse(data);
	return JSON.stringify(json);
}
async function write_json_file(path: string, data: Student[]) {
	const formated_path = join("src", path);
	let success = false;
	try {
		await writeFile(formated_path, JSON.stringify(data));
		success = true;
	} catch (error) {
		log(error);
	} finally {
		return success;
	}
}

async function file_exist(path: string) {
	const formated_path = join("src", path);
	let file_exist = false;
	try {
		await access(formated_path);
		file_exist = true;
	} catch (error) {
		if (error === "ENOENT") {
			// file exists
			file_exist = false;
		}
	}
	return file_exist;
}

// tests
// log("write file")
// await write_json_file("test.json", [
// 	{
// 		first_name: "Walid",
// 		last_name: "O",
// 		id: generate_id(),
// 		present: false,
// 		skills: [{ name: "REACT", level: "average" }],
// 	},
// ]);
// log(await file_exist("test.json"));
// log("read file")
// log(await read_json_file("test.json"));