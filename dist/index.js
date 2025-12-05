import { select, input } from "@inquirer/prompts";
import { log } from "node:console";
import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path/win32";
// helper constants + functions to load an arbitrary JSON file and validate it
const ALL_SKILLS = [
    "HTML",
    "JAVASCRIPT",
    "CSS",
    "NODEJS",
    "REACT",
    "TYPESCRIPT",
    "MONGODB",
    "EXPRESS",
    "ANGULAR",
    "JAVA",
    "SPRINGBOOT",
    "DOCKER",
    "KUBERNETES",
];
const VALID_LEVELS = ["critical", "average", "good", "excellent"];
async function file_exists_path(path) {
    try {
        await access(path);
        return true;
    }
    catch (err) {
        return false;
    }
}
async function load_json_from_path(path) {
    if (!(await file_exists_path(path))) {
        log("file not found:", path);
        return null;
    }
    try {
        const raw = await readFile(path, "utf-8");
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            log("invalid file: expected an array of students");
            return null;
        }
        // basic validation for each student object
        for (const item of parsed) {
            if (typeof item !== "object" ||
                typeof item.id !== "string" ||
                typeof item.first_name !== "string" ||
                typeof item.last_name !== "string" ||
                typeof item.present !== "boolean") {
                log("invalid student entry (missing required fields):", JSON.stringify(item));
                return null;
            }
            if (item.skills !== undefined) {
                if (!Array.isArray(item.skills)) {
                    log("invalid student entry (skills must be an array):", item.id);
                    return null;
                }
                for (const sk of item.skills) {
                    if (typeof sk !== "object" ||
                        typeof sk.name !== "string" ||
                        typeof sk.level !== "string" ||
                        !ALL_SKILLS.includes(sk.name) ||
                        !VALID_LEVELS.includes(sk.level)) {
                        log("invalid skill entry for student:", item.id, JSON.stringify(sk));
                        return null;
                    }
                }
            }
        }
        // Looks valid
        return parsed;
    }
    catch (err) {
        log("error reading/parsing file:", err?.message ?? err);
        // this ?? is called the nullish coalescing operator, so if err?.message is null or undefined log whatever err is
        return null;
    }
}
async function prompt_and_load(manager) {
    const path = await input({ message: "enter path to json file (absolute or relative):", required: true });
    const loaded = await load_json_from_path(path);
    if (!loaded) {
        log("load failed or file invalid.");
        return false;
    }
    manager.data = loaded;
    log(`loaded ${loaded.length} students from ${path}`);
    return true;
}
class Class_Manger {
    available_skills = [
        "HTML",
        "JAVASCRIPT",
        "CSS",
        "NODEJS",
        "REACT",
        "TYPESCRIPT",
        "MONGODB",
        "EXPRESS",
        "ANGULAR",
        "JAVA",
        "SPRINGBOOT",
        "DOCKER",
        "KUBERNETES",
    ];
    data = [];
    constructor() { }
    async add_student() {
        const student = {
            id: generate_id(),
            first_name: await input({ message: "first name : ", required: true }),
            last_name: await input({ message: "last name : ", required: true }),
            present: false,
            skills: await add_skill(this.available_skills),
        };
        this.data.push(student);
        const ok = await this.save_data_file();
        log(ok ? "student added and saved." : "student added but save failed.");
    }
    async mark_attendance() {
        if (!this.data.length) {
            log("no students loaded.");
            return;
        }
        const student_id = await input({
            message: "enter student id",
            required: true,
            validate: (v) => (this.data.find((s) => s.id === v) ? true : "student not found"),
        });
        const state = await select({ message: "is student present ? ", choices: ["yes", "no"] });
        const student = this.data.find((s) => s.id === student_id);
        student.present = state === "yes";
        const ok = await this.save_data_file();
        log(ok ? "attendance updated." : "attendance updated but save failed.");
    }
    async add_student_skills() {
        if (!this.data.length) {
            log("no students loaded.");
            return;
        }
        const student_id = await input({
            message: "enter student id to add skills",
            required: true,
            validate: (v) => (this.data.find((s) => s.id === v) ? true : "student not found"),
        });
        const student = this.data.find((s) => s.id === student_id);
        const newSkills = await add_skill(this.available_skills);
        if (!student.skills)
            student.skills = [];
        student.skills.push(...newSkills);
        const ok = await this.save_data_file();
        log(ok ? "skills added and saved." : "skills added but save failed.");
    }
    async show_student_record() {
        if (!this.data.length) {
            log("no students loaded.");
            return;
        }
        const student_id = await input({
            message: "enter student id to view",
            required: true,
            validate: (v) => (this.data.find((s) => s.id === v) ? true : "student not found"),
        });
        const student = this.data.find((s) => s.id === student_id);
        const lines = [
            `ID      : ${student.id}`,
            `Name    : ${student.first_name} ${student.last_name}`,
            `Present : ${student.present ? "Yes" : "No"}`,
            `Skills  :`,
        ];
        if (!student.skills || student.skills.length === 0) {
            lines.push("  - none");
        }
        else {
            for (const skill of student.skills) {
                lines.push(`  - ${skill.name.padEnd(12)} : ${skill.level}`);
            }
        }
        log(lines.join("\n"));
    }
    async show_valid_students() {
        const valid = this.data.filter((s) => Array.isArray(s.skills) &&
            s.skills.length > 0 &&
            s.skills.every((sk) => sk.level === "good" || sk.level === "excellent"));
        if (!valid.length) {
            log("no students found with all skills 'good' or 'excellent'.");
            return;
        }
        for (const s of valid) {
            log(`${s.id} - ${s.first_name} ${s.last_name} - skills: ${s.skills.map((k) => `${k.name}(${k.level})`).join(", ")}`);
        }
    }
    async save_data_file() {
        return await write_json_file("data.json", this.data);
    }
    async load_data_file() {
        const exists = await file_exist("data.json");
        if (!exists) {
            this.data = [];
            return;
        }
        const loaded = await read_json_file("data.json");
        if (Array.isArray(loaded)) {
            this.data = loaded;
        }
        else {
            this.data = [];
        }
    }
    async exit() {
        await this.save_data_file();
        log("exiting...");
        process.exit(0);
    }
}
function generate_id() {
    return crypto.randomUUID().toUpperCase().slice(0, 4);
    // keep the IDs short
}
async function read_json_file(path) {
    const formated_path = join("src", path);
    try {
        const data = await readFile(formated_path, "utf-8");
        const json = JSON.parse(data);
        return json;
    }
    catch (error) {
        log("read error:", error?.message ?? error);
        return null;
    }
}
async function write_json_file(path, data) {
    const formated_path = join("src", path);
    let success = false;
    try {
        await writeFile(formated_path, JSON.stringify(data, null, 2), "utf-8");
        success = true;
    }
    catch (error) {
        log("write error:", error?.message ?? error);
    }
    finally {
        return success;
    }
}
async function file_exist(path) {
    const formated_path = join("src", path);
    let file_exist = false;
    try {
        await access(formated_path);
        file_exist = true;
    }
    catch (error) {
        if (error?.code === "ENOENT") {
            file_exist = false;
        }
        else {
            file_exist = false;
        }
    }
    return file_exist;
}
async function add_skill(available_skills) {
    let skills = [];
    while (true) {
        const answer = await select({
            message: "choose an option",
            choices: ["add a skill", "exit"],
        });
        if (answer === "exit") {
            break;
        }
        const name = (await select({
            message: "select a skill",
            choices: available_skills,
        }));
        const level = (await select({
            message: "student level",
            choices: ["critical", "average", "good", "excellent"],
        }));
        // prevent duplicate same skill
        if (skills.find((s) => s.name === name)) {
            log("skill already added to this student (in this session).");
            continue;
        }
        skills.push({
            name,
            level,
        });
        log("skill added!");
    }
    return skills;
}
// main CLI loop
async function main() {
    const manager = new Class_Manger();
    await manager.load_data_file();
    while (true) {
        const action = await select({
            message: "choose action",
            choices: [
                "add student",
                "mark attendance",
                "add student skills",
                "show student record",
                "show valid students",
                "load",
                "save",
                "exit",
            ],
        });
        switch (action) {
            case "add student":
                await manager.add_student();
                break;
            case "mark attendance":
                await manager.mark_attendance();
                break;
            case "add student skills":
                await manager.add_student_skills();
                break;
            case "show student record":
                await manager.show_student_record();
                break;
            case "show valid students":
                await manager.show_valid_students();
                break;
            case "save":
                await manager.save_data_file();
                break;
            case "load":
                await prompt_and_load(manager);
                break;
            case "exit":
                await manager.exit();
                break;
        }
    }
}
await main();
